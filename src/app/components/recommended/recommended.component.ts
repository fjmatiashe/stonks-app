import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarteraService, AnalystData } from '../../services/server.service';

interface SortEvent {
field: string;
direction: 'asc' | 'desc';
}

@Component({
selector: 'app-recommended',
standalone: true,
imports: [CommonModule],
template: `
    <div class="container">
    <h1 class="title">Acciones Más Recomendadas</h1>

    <div *ngIf="loading" class="loading">
        Cargando datos del scrapper, esto puede tardar unos 20 segundos.
    </div>
    <div *ngIf="!loading && !recommendedStocks.length" class="no-data">
        No se encontraron datos.
    </div>

    <table *ngIf="!loading && recommendedStocks.length" class="stocks-table">
        <thead>
        <tr>
            <th (click)="sortBy('ticker')">Ticker {{ getSortIcon('ticker') }}</th>
            <th (click)="sortBy('exchange')">Exchange {{ getSortIcon('exchange') }}</th>
            <th (click)="sortBy('price')">Precio {{ getSortIcon('price') }}</th>
            <th (click)="sortBy('rating')">Rating {{ getSortIcon('rating') }}</th>
            <th (click)="sortBy('compra')">Compra {{ getSortIcon('compra') }}</th>
            <th (click)="sortBy('mantener')">Mantener {{ getSortIcon('mantener') }}</th>
            <th (click)="sortBy('venta')">Venta {{ getSortIcon('venta') }}</th>
            <th (click)="sortBy('trailingPE')">Trailing P/E {{ getSortIcon('trailingPE') }}</th>
            <th (click)="sortBy('forwardPE')">Forward P/E {{ getSortIcon('forwardPE') }}</th>
            <th (click)="sortBy('averagePriceTarget')">Avg Price Target {{ getSortIcon('averagePriceTarget') }}</th>
            <th (click)="sortBy('potentialUpside')">Upside/Downside {{ getSortIcon('potentialUpside') }}</th>
            <th (click)="sortBy('netMargins')">Net Margins {{ getSortIcon('netMargins') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr *ngFor="let stock of recommendedStocks">
            <td>{{ stock.ticker }}</td>
            <td>{{ stock.exchange }}</td>
            <td>{{ stock.stockData?.price != null ? (stock.stockData!.price | number:'1.2-2') : 'N/A' }}</td>
            <td>{{ stock.rating | number:'1.2-2' }}</td>
            <td>{{ stock.opinions?.compra || 0 }}</td>
            <td>{{ stock.opinions?.mantener || 0 }}</td>
            <td>{{ stock.opinions?.venta || 0 }}</td>
            <td>{{ stock.stockData?.trailingPE != null ? (stock.stockData!.trailingPE | number:'1.2-2') : 'N/A' }}</td>
            <td>{{ stock.stockData?.forwardPE != null ? (stock.stockData!.forwardPE | number:'1.2-2') : 'N/A' }}</td>
            <td>{{ stock.stockData?.averagePriceTarget != null ? (stock.stockData!.averagePriceTarget | number:'1.2-2') : 'N/A' }}</td>
            <td>{{ stock.stockData?.potentialUpside != null ? ((stock.stockData!.potentialUpside! / 100) | percent:'1.0-2') : 'N/A' }}</td>
            <td>{{ stock.stockData?.netMargins || 'N/A' }}</td>
        </tr>
        </tbody>
    </table>
    </div>
`,
styles: [
    `
    .container { margin: 20px; font-family: Arial, sans-serif; }
    .title { text-align: center; margin-bottom: 20px; color: #2c3e50; font-size: 2rem; }
    .loading, .no-data { text-align: center; font-size: 1.2rem; color: #7f8c8d; }
    .stocks-table { width: 100%; border-collapse: collapse; margin-top: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .stocks-table th, .stocks-table td { padding: 12px; border: 1px solid #ecf0f1; }
    .stocks-table th { background-color: #34495e; color: #ecf0f1; font-weight: bold; cursor: pointer; position: relative; }
    .stocks-table th:hover { background-color: #2c3e50; }
    .stocks-table tbody tr:nth-child(even) { background-color: #f9f9f9; }
    .stocks-table tbody tr:hover { background-color: #ecf0f1; }
    .stocks-table td { text-align: center; }
    .stocks-table td:first-child, .stocks-table th:first-child { text-align: left; }
    `
]
})
export class RecommendedStocksComponent implements OnInit {
recommendedStocks: AnalystData[] = [];
loading = true;
sortEvent: SortEvent = { field: 'rating', direction: 'desc' };

constructor(private carteraService: CarteraService) {}

ngOnInit(): void {
    this.loadData();
}

private loadData(): void {
    this.carteraService.getFullAnalysts().subscribe({
    next: (data) => {
        // Datos iniciales
        let stocks: AnalystData[] = Array.isArray(data) ? data : [];

        // Aplanar opiniones
        stocks.forEach(s => {
        if (s.opinions && (s.opinions as any).opinions) {
            s.opinions = (s.opinions as any).opinions;
        }
        });

        // Filtrar solo con al menos 5 opiniones
        stocks = stocks.filter(s => {
        const { compra = 0, mantener = 0, venta = 0 } = s.opinions!;
        return (compra + mantener + venta) >= 5;
        });

        // Normalizar datos numéricos
        stocks.forEach(s => {
        if (!s.stockData) return;
        const raw: any = s.stockData;
        s.stockData.price = this.parseNumber(raw.price);
        s.stockData.trailingPE = this.parseNumber(raw.trailingPE);
        s.stockData.forwardPE = this.parseNumber(raw.forwardPE);
        const avgRaw = raw.averagePriceTarget ?? raw.averageStockPriceTarget;
        s.stockData.averagePriceTarget = this.parseNumber(avgRaw);
        const upRaw = raw.potentialUpside ?? raw.potentialUpsideDownside;
        s.stockData.potentialUpside = this.parseNumber(upRaw);
        s.stockData.netMargins = raw.netMargins;
        });

        // Calcular rating combinado (70% analistas, 30% upside con tramos)(incluir crecimiento de beneficios en el futuro)
        stocks.forEach(s => {
        const { compra = 0, mantener = 0, venta = 0 } = s.opinions!;
        const total = compra + mantener + venta;
        const analystRatio = total ? (compra - venta) / total : 0;
        const safeAnalyst = Math.max(0, Math.min(analystRatio, 1));
        const analystPts = safeAnalyst * 70;

        const upsideVal = s.stockData?.potentialUpside ?? 0;
        let upsidePts = 0;
        if (upsideVal > 0) {
            if (upsideVal <= 10) {
            upsidePts = (upsideVal / 10) * 15;
            } else {
            const clamped = Math.min(upsideVal, 100);
            upsidePts = 15 + ((clamped - 10) / 90) * 15;
            }
        }

        s.rating = analystPts + upsidePts;
        });

        // Filtrar duplicados manteniendo mejor rating
        const unique = stocks.reduce<Record<string, AnalystData>>((acc, s) => {
        const currentRating = s.rating ?? 0;
        const existingRating = acc[s.ticker]?.rating ?? 0;
        if (!acc[s.ticker] || currentRating > existingRating) {
            acc[s.ticker] = s;
        }
        return acc;
        }, {} as Record<string, AnalystData>);

        this.recommendedStocks = Object.values(unique);
        this.applySort();
        this.loading = false;
    },
    error: () => { this.loading = false; }
    });
}

sortBy(field: string): void {
    if (this.sortEvent.field === field) {
    this.sortEvent.direction = this.sortEvent.direction === 'asc' ? 'desc' : 'asc';
    } else {
    this.sortEvent.field = field;
    this.sortEvent.direction = 'asc';
    }
    this.applySort();
}

getSortIcon(field: string): string {
    return this.sortEvent.field === field
    ? this.sortEvent.direction === 'asc' ? '▲' : '▼'
    : '';
}

private applySort(): void {
    const { field, direction } = this.sortEvent;
    this.recommendedStocks = [...this.recommendedStocks].sort((a, b) => {
    const aVal = this.getFieldValue(a, field);
    const bVal = this.getFieldValue(b, field);
    if (aVal == null && bVal != null) return 1;
    if (aVal != null && bVal == null) return -1;
    if (aVal == null && bVal == null) return 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * (direction === 'asc' ? 1 : -1);
    }
    return ((aVal as number) - (bVal as number)) * (direction === 'asc' ? 1 : -1);
    });
}

private getFieldValue(stock: AnalystData, field: string): string | number | undefined {
    switch (field) {
    case 'ticker': return stock.ticker;
    case 'exchange': return stock.exchange;
    case 'price': return stock.stockData?.price;
    case 'rating': return stock.rating;
    case 'compra': return stock.opinions?.compra;
    case 'mantener': return stock.opinions?.mantener;
    case 'venta': return stock.opinions?.venta;
    case 'trailingPE': return stock.stockData?.trailingPE;
    case 'forwardPE': return stock.stockData?.forwardPE;
    case 'averagePriceTarget': return stock.stockData?.averagePriceTarget;
    case 'potentialUpside': return stock.stockData?.potentialUpside;
    case 'netMargins': return this.parseNumber(stock.stockData?.netMargins);
    default: return undefined;
    }
}

private parseNumber(value: any): number | undefined {
    if (value == null) return undefined;
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? undefined : num;
}
}

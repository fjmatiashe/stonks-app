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
            <td>
            {{ stock.stockData?.price != null
                ? (stock.stockData?.price | number:'1.2-2')
                : 'N/A' }}
            </td>
            <td>{{ stock.rating | number:'1.2-2' }}</td>
            <td>{{ stock.opinions?.compra || 0 }}</td>
            <td>{{ stock.opinions?.mantener || 0 }}</td>
            <td>{{ stock.opinions?.venta || 0 }}</td>
            <td>{{ stock.stockData?.trailingPE || 'N/A' }}</td>
            <td>{{ stock.stockData?.forwardPE || 'N/A' }}</td>
            <td>
            {{ stock.stockData?.averagePriceTarget != null
                ? (stock.stockData?.averagePriceTarget | number:'1.2-2')
                : 'N/A' }}
            </td>
            <td>
                {{ stock.stockData?.potentialUpside != null
                ? ((stock.stockData?.potentialUpside! / 100) | percent:'1.0-2')
                : 'N/A' }}
            </td>
            <td>{{ stock.stockData?.netMargins || 'N/A' }}</td>
        </tr>
        </tbody>
    </table>
    </div>
`,
styles: [`
    .container { margin: 20px; font-family: Arial, sans-serif; }
    .title { text-align: center; margin-bottom: 20px; color: #333; }
    .loading, .no-data { text-align: center; font-size: 18px; color: #555; }
    .stocks-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .stocks-table th, .stocks-table td { padding: 8px 12px; border: 1px solid #ddd; text-align: left; }
    .stocks-table th { cursor: pointer; background: #f4f4f4; position: relative; }
    .stocks-table th:hover { background: #eaeaea; }
`]
})
export class RecommendedStocksComponent implements OnInit {
recommendedStocks: AnalystData[] = [];
loading = true;

// Estado de ordenación
sortEvent: SortEvent = { field: 'rating', direction: 'desc' };

constructor(private carteraService: CarteraService) {}

ngOnInit(): void {
    this.loadData();
}

private loadData(): void {
    this.carteraService.getFullAnalysts().subscribe({
    next: (data) => {
        let stocks: AnalystData[] = Array.isArray(data) ? data : [];

        // Aplanar estructura de opiniones
        stocks.forEach(stock => {
        if (stock.opinions && (stock.opinions as any).opinions) {
            stock.opinions = (stock.opinions as any).opinions;
        }
        });

        // Filtrar y calcular rating
        stocks = stocks.filter(stock => {
        if (stock.opinions) {
            const { compra = 0, mantener = 0, venta = 0 } = stock.opinions;
            const total = compra + mantener + venta;
            stock.rating = total > 0 ? ((compra / total) * 100 - (venta / total) * 100) : 0;
            return true;
        }
        return false;
        });

        // Convertir strings a números y precio
        stocks.forEach(stock => {
        if (stock.stockData) {
            const raw = stock.stockData as any;
            // Price
            stock.stockData.price = parseFloat(
            typeof raw.price === 'string'
                ? raw.price.replace(/[^0-9.-]/g, '')
                : raw.price
            );
            // Avg Price Target
            stock.stockData.averagePriceTarget = parseFloat(
            typeof raw.averagePriceTarget === 'string'
                ? raw.averagePriceTarget.replace(/[^0-9.-]/g, '')
                : raw.averagePriceTarget
            );
            // Potential Upside
            stock.stockData.potentialUpside = parseFloat(
            typeof raw.potentialUpside === 'string'
                ? raw.potentialUpside.replace(/[^0-9.-]/g, '')
                : raw.potentialUpside
            );
        }
        });

        // Filtrar duplicados
        const unique: { [key: string]: AnalystData } = {};
        stocks.forEach(stock => {
        if (!unique[stock.ticker] || (stock.rating || 0) > (unique[stock.ticker].rating || 0)) {
            unique[stock.ticker] = stock;
        }
        });

        this.recommendedStocks = Object.values(unique);
        this.applySort();
        this.loading = false;
    },
    error: err => {
        console.error('Error al obtener datos de analistas:', err);
        this.loading = false;
    }
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
    if (this.sortEvent.field === field) {
    return this.sortEvent.direction === 'asc' ? '▲' : '▼';
    }
    return '';
}

private applySort(): void {
    const { field, direction } = this.sortEvent;
    this.recommendedStocks = [...this.recommendedStocks].sort((a, b) => {
    const aVal = this.getFieldValue(a, field);
    const bVal = this.getFieldValue(b, field);
    if (aVal == null && bVal != null) return 1;
    if (aVal != null && bVal == null) return -1;
    if (aVal == null && bVal == null) return 0;
    if (typeof aVal === 'string') {
        const cmp = (aVal as string).localeCompare(bVal as string);
        return direction === 'asc' ? cmp : -cmp;
    }
    const diff = (aVal as number) - (bVal as number);
    return direction === 'asc' ? diff : -diff;
    });
}

private getFieldValue(stock: AnalystData, field: string): string | number | null {
    switch (field) {
    case 'ticker': return stock.ticker;
    case 'exchange': return stock.exchange || '';
    case 'price': return stock.stockData?.price ?? null;
    case 'rating': return stock.rating ?? 0;
    case 'compra': return stock.opinions?.compra ?? 0;
    case 'mantener': return stock.opinions?.mantener ?? 0;
    case 'venta': return stock.opinions?.venta ?? 0;
    case 'trailingPE': return this.parseNumber(stock.stockData?.trailingPE);
    case 'forwardPE': return this.parseNumber(stock.stockData?.forwardPE);
    case 'averagePriceTarget': return stock.stockData?.averagePriceTarget ?? 0;
    case 'potentialUpside': return stock.stockData?.potentialUpside ?? 0;
    case 'netMargins': return this.parseNumber(stock.stockData?.netMargins);
    default: return null;
    }
}

private parseNumber(value: any): number | null {
    if (value == null) return null;
    const num = parseFloat(('' + value).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? null : num;
}
}

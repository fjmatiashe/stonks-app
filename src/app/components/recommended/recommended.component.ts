// src/app/components/recommended/recommended.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarteraService, AnalystData } from '../../services/server.service';

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
    <div class="card-list" *ngIf="!loading && recommendedStocks.length">
        <div class="card" *ngFor="let stock of recommendedStocks">
        <div class="card-header">
            <h2>{{ stock.ticker }} - {{ stock.name || stock.ticker }}</h2>
            <span class="exchange">{{ stock.exchange }}</span>
        </div>
        <div class="card-body">
            <p class="rating">
            Rating: <strong>{{ stock.rating | number:'1.2-2' }}</strong>
            </p>
            <div class="opinions" *ngIf="stock.opinions">
            <p *ngFor="let key of opinionKeys()">
                <strong>{{ key | titlecase }}:</strong> {{ stock.opinions[key] }}
            </p>
            </div>
            <div class="fundamentals" *ngIf="stock.stockData">
            <p>
                <strong>Trailing P/E:</strong> {{ stock.stockData.trailingPE || 'N/A' }}
            </p>
            <p>
                <strong>Forward P/E:</strong> {{ stock.stockData.forwardPE || 'N/A' }}
            </p>
            <p>
                <strong>Avg Price Target:</strong> {{ stock.stockData.averagePriceTarget != null ? (stock.stockData.averagePriceTarget | number:'1.2-2') : 'N/A' }}
            </p>
            <p>
                <strong>Upside/Downside:</strong> {{ stock.stockData.potentialUpside != null ? (stock.stockData.potentialUpside / 100 | percent:'1.0-2') : 'N/A' }}
            </p>
            <p>
                <strong>Net Margins:</strong> {{ stock.stockData.netMargins || 'N/A' }}
            </p>
            </div>
        </div>
        </div>
    </div>
    </div>
`,
styles: [`
    .container {
    margin: 20px;
    font-family: Arial, sans-serif;
    }
    .title {
    text-align: center;
    margin-bottom: 20px;
    color: #333;
    }
    .loading, .no-data {
    text-align: center;
    font-size: 18px;
    color: #555;
    }
    .card-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 15px;
    }
    .card {
    background: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    width: 280px;
    box-shadow: 2px 2px 6px rgba(0,0,0,0.1);
    }
    .card-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 5px;
    }
    .card-header h2 {
    margin: 0;
    font-size: 20px;
    color: #222;
    }
    .exchange {
    font-size: 14px;
    color: #777;
    }
    .card-body {
    font-size: 14px;
    color: #555;
    }
    .rating {
    margin-bottom: 10px;
    font-weight: bold;
    color: #333;
    }
    .opinions p,
    .fundamentals p {
    margin: 0;
    padding: 2px 0;
    }
`]
})
export class RecommendedStocksComponent implements OnInit {
recommendedStocks: AnalystData[] = [];
loading = true;

constructor(private carteraService: CarteraService) {}

ngOnInit(): void {
    this.carteraService.getFullAnalysts().subscribe({
    next: (data) => {
        let stocks: AnalystData[] = Array.isArray(data) ? data : [];
        console.log(data);

        // Aplanar estructura de opiniones
        stocks.forEach((stock) => {
            if (stock.opinions && (stock.opinions as any).opinions) {
                stock.opinions = (stock.opinions as any).opinions;
            }
        });

        // Filtrar acciones con al menos 0 opiniones
        stocks = stocks.filter((stock) => {
            if (stock.opinions) {
                const { compra = 0, mantener = 0, venta = 0 } = stock.opinions;
                const total = compra + mantener + venta;
                return total >= 0;
            }
            return false;
        });

        // Normalizar propiedades y calcular rating
        stocks.forEach((stock) => {
            if (stock.opinions) {
                const { compra = 0, mantener = 0, venta = 0 } = stock.opinions;
                const total = compra + mantener + venta;
                stock.rating = total > 0 ? ((compra / total) * 100 - (venta / total) * 100) : 0;
            }

            if (!stock.name) {
                stock.name = stock.ticker;
            }

            if (stock.stockData) {
                const raw = stock.stockData as any;
                stock.stockData.averagePriceTarget = parseFloat(
                    typeof raw.averageStockPriceTarget === 'string'
                        ? raw.averageStockPriceTarget.replace(/[^0-9.-]/g, '')
                        : raw.averageStockPriceTarget
                );

                stock.stockData.potentialUpside = parseFloat(
                    typeof raw.potentialUpsideDownside === 'string'
                        ? raw.potentialUpsideDownside.replace(/[^0-9.-]/g, '')
                        : raw.potentialUpsideDownside
                );
            }

            console.log("StockData for", stock.ticker, stock.stockData);
        });

        // Filtrar duplicados
        const uniqueStocks: { [ticker: string]: AnalystData } = {};
        stocks.forEach((stock) => {
            if (stock.ticker) {
                if (!uniqueStocks[stock.ticker] || (stock.rating || 0) > (uniqueStocks[stock.ticker].rating || 0)) {
                    uniqueStocks[stock.ticker] = stock;
                }
            }
        });

        // Ordenar y limitar a 50
        this.recommendedStocks = Object.values(uniqueStocks)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 50);

        this.loading = false;
    },
    error: (err) => {
        console.error('Error al obtener datos de analistas:', err);
        this.loading = false;
    }
    });
}

opinionKeys(): ('compra' | 'mantener' | 'venta')[] {
    return ['compra', 'mantener', 'venta'];
}
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarteraService } from '../../services/server.service';

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
            <h2>{{ stock.ticker }} - {{ stock.name }}</h2>
            <span class="exchange">{{ stock.exchange }}</span>
        </div>
        <div class="card-body">
            <p class="rating">Rating: <strong>{{ stock.rating | number:'1.2-2' }}</strong></p>
            <div class="opinions">
            <p *ngFor="let key of opinionKeys()">
                <strong>{{ key | titlecase }}:</strong> {{ stock.opinions[key] }}
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
    .opinions p {
    margin: 0;
    padding: 2px 0;
    }
`]
})
export class RecommendedStocksComponent implements OnInit {
recommendedStocks: any[] = [];
loading = true;

constructor(private carteraService: CarteraService) {}

ngOnInit(): void {
    this.carteraService.getAnalysts().subscribe({
    next: (data) => {
        console.log('data', data);
        let stocks: any[] = [];
        if (Array.isArray(data)) {
        stocks = data;
        } else if (data && data.stocks && Array.isArray(data.stocks)) {
        stocks = data.stocks;
        } else if (data && typeof data === 'object') {
        stocks = Object.values(data);
        }

        // Filtrar stocks con menos de 8 opiniones en total
        stocks = stocks.filter((stock: any) => {
        if (stock.opinions) {
            const compra = Number(stock.opinions.compra) || 0;
            const mantener = Number(stock.opinions.mantener) || 0;
            const venta = Number(stock.opinions.venta) || 0;
            const total = compra + mantener + venta;
            return total >= 8;
        }
        return false;
        });

        // Calcular rating para cada acción usando "compra", "mantener" y "venta"
        stocks.forEach((stock: any) => {
        if (stock.opinions) {
            const compra = Number(stock.opinions.compra) || 0;
            const mantener = Number(stock.opinions.mantener) || 0;
            const venta = Number(stock.opinions.venta) || 0;
            const total = compra + mantener + venta;
            
            if (total > 0) {
            const percentCompra = (compra / total) * 100;
            const percentVenta = (venta / total) * 100;
            stock.rating = percentCompra - percentVenta;
            } else {
            stock.rating = 0;
            }
        }
        });

        // Filtrar duplicados: conservar solo la acción única por ticker (la de mayor rating)
        const uniqueStocks: { [ticker: string]: any } = {};
        stocks.forEach((stock: any) => {
        if (stock.ticker) {
            if (!uniqueStocks[stock.ticker] || stock.rating > uniqueStocks[stock.ticker].rating) {
            uniqueStocks[stock.ticker] = stock;
            }
        }
        });

        // Ordenar de mayor a menor rating y tomar solo las 50 primeras
        this.recommendedStocks = Object.values(uniqueStocks)
        .sort((a: any, b: any) => b.rating - a.rating)
        .slice(0, 50);

        this.loading = false;
    },
    error: (err) => {
        console.error('Error al obtener datos de analistas:', err);
        this.loading = false;
    }
    });
}

opinionKeys(): string[] {
    return ['compra', 'mantener', 'venta'];
}
}

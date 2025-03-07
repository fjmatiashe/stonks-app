import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarteraService } from '../../services/server.service';

@Component({
selector: 'app-recommended',
standalone: true,
imports: [CommonModule],
template: `
    <h1>ACCIONES MÁS RECOMENDADAS</h1>
    <div *ngIf="loading">Cargando datos...</div>
    <ul *ngIf="!loading && recommendedStocks.length">
    <li *ngFor="let stock of recommendedStocks">
        <strong>{{ stock.ticker }}</strong> - {{ stock.exchange }}
        <div *ngIf="stock.error" style="color: red;">
        Error: {{ stock.error }}
        </div>
        <div *ngIf="!stock.error && stock.opinions">
        <!-- Suponiendo que 'opinions' es un arreglo de datos a mostrar -->
        <p *ngFor="let opinion of stock.opinions">{{ opinion }}</p>
        </div>
    </li>
    </ul>
    <div *ngIf="!loading && !recommendedStocks.length">
    No se encontraron datos.
    </div>
`,
styles: []
})
export class RecommendedStocksComponent implements OnInit {
recommendedStocks: any[] = [];
loading = true;

constructor(private carteraService: CarteraService) {}

ngOnInit(): void {
    this.carteraService.getAnalysts().subscribe({
    next: (data) => {
        console.log('Datos de analistas:', data);
        this.recommendedStocks = data;
        this.loading = false;
    },
    error: (err) => {
        console.error('Error al obtener datos de analistas:', err);
        this.loading = false;
    }
    });
}
}

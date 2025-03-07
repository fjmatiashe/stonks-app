import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { HeaderComponent } from './components/header/header.component';
import { SearchComponent } from './components/search/search.component';
import { MarketStatusComponent } from './components/market-status/market-status.component';
import { AboutMeComponent } from './components/about-me/about-me.component';
import { PortfoliosComponent } from './components/portfolios/portfolios.component';
import { StockInfoMixComponent } from './components/stock-info/stock-info-mix/stock-info-mix.component';
import { AlphaVantageService } from './services/api.service';
import { RecommendedStocksComponent } from './components/recommended/recommended.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SearchComponent,
    MarketStatusComponent,
    AboutMeComponent,
    PortfoliosComponent,
    StockInfoMixComponent,
    RecommendedStocksComponent,
],
  template: `
    <app-header (navigate)="onNavigate($event)"></app-header>
    <main class="container">

      <ng-container *ngIf="selectedView === 'stocks'">
        <app-search (search)="onSearch($event)"></app-search>
        <app-stock-info-mix 
          [ticker]="selectedSymbol" 
          [stockName]="selectedStockName">
        </app-stock-info-mix>
      </ng-container>

      <ng-container *ngIf="selectedView === 'recommended'">
        <app-recommended></app-recommended>
      </ng-container>

      <ng-container *ngIf="selectedView === 'portfolios'">
        <app-portfolios></app-portfolios>
      </ng-container>

      <ng-container *ngIf="selectedView === 'markets'">
        <app-market-status></app-market-status>
      </ng-container>

      <ng-container *ngIf="selectedView === 'about'">
        <app-about-me></app-about-me>
      </ng-container>

    </main>
  `,
  styles: [`
  
    .container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
  `]
})
export class AppComponent {
  selectedSymbol: string = 'AAPL';
  selectedStockName: string = 'Apple Inc.';
  selectedView: string = 'stocks'; 

  constructor(private stockService: AlphaVantageService) {}

  onNavigate(view: string): void {
    this.selectedView = view;
  }

  //FINhub
  onSearch(data: { symbol: string; name: string }): void {
    this.selectedSymbol = data.symbol;
    if (data.name.trim() === '') {
      this.stockService.searchSymbols(data.symbol).subscribe(response => {
        const bestMatch = response.result && response.result[0];
        this.selectedStockName = bestMatch && bestMatch.description ? bestMatch.description : data.symbol;
      }, err => {
        console.error('Error al buscar el nombre de la acción', err);
        this.selectedStockName = data.symbol;
      });
      
    } else {
      this.selectedStockName = data.name;
    }
  }

  //AlphaVantage
  // onSearch(data: { symbol: string; name: string }): void {
  //   this.selectedSymbol = data.symbol;
  //   if (data.name.trim() === '') {
  //     // Si no se recibió un nombre, buscamos el símbolo para obtener el nombre completo
  //     this.stockService.searchSymbols(data.symbol).subscribe(response => {
  //       const bestMatch = response.bestMatches && response.bestMatches[0];
  //       this.selectedStockName = bestMatch && bestMatch['2. name'] ? bestMatch['2. name'] : data.symbol;
  //     }, err => {
  //       console.error('Error al buscar el nombre de la acción', err);
  //       // En caso de error, se usa el símbolo como fallback
  //       this.selectedStockName = data.symbol;
  //     });
  //   } else {
  //     this.selectedStockName = data.name;
  //   }
  // }
}

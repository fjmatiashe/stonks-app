import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { HeaderComponent } from './components/header/header.component';
import { SearchComponent } from './components/search/search.component';
import { StockDisplayComponent } from './components/stock-display/stock-display.component';
import { MarketStatusComponent } from './components/market-status/market-status.component';
import { AboutMeComponent } from './components/about-me/about-me.component';
import { StockInfoComponent } from './components/stock-info-profit/stock-info-profit.component';
import { PortfoliosComponent } from './components/portfolios/portfolios.component';
import { StockInfoMixComponent } from './components/stock-info-mix/stock-info-mix.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    HeaderComponent, 
    SearchComponent, 
    StockDisplayComponent, 
    MarketStatusComponent, 
    AboutMeComponent, 
    StockInfoComponent, 
    PortfoliosComponent,
    StockInfoMixComponent,
  ],
  template: `
    <app-header (navigate)="onNavigate($event)"></app-header>
    <main class="container">

      <ng-container *ngIf="selectedView === 'stocks2'">
        <app-stock-info></app-stock-info>
      </ng-container>

      <ng-container *ngIf="selectedView === 'stocks'">
        <app-search (search)="onSearch($event)"></app-search>
        <app-stock-display [symbol]="selectedSymbol"></app-stock-display>
      </ng-container>

      <ng-container *ngIf="selectedView === 'stocks3'">
        <app-search (search)="onSearch($event)"></app-search>
        <app-stock-info-mix 
          [ticker]="selectedSymbol" 
          [stockName]="selectedStockName">
        </app-stock-info-mix>
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
  selectedSymbol: string = '';
  selectedStockName: string = ''; // Propiedad para el nombre de la acción
  selectedView: string = 'stocks3'; 

  constructor() {}

  onNavigate(view: string): void {
    this.selectedView = view;
  }

  // Ahora se recibe un objeto con symbol y name
  onSearch(data: { symbol: string; name: string }): void {
    this.selectedSymbol = data.symbol;
    this.selectedStockName = data.name;
  }
}

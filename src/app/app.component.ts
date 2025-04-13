import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { HeaderComponent } from './components/header/header.component';
import { SearchComponent } from './components/search/search.component';
import { MarketStatusComponent } from './components/market-status/market-status.component';
import { AboutMeComponent } from './components/about-me/about-me.component';
import { PortfoliosComponent } from './components/portfolios/portfolios.component';
import { StockInfoMixComponent } from './components/stock-info/stock-info-mix/stock-info-mix.component';
import { RecommendedStocksComponent } from './components/recommended/recommended.component';
import { AlphaVantageService } from './services/api.service';
import { CarteraService } from './services/server.service';
import { Subscription } from 'rxjs';

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
    <ng-container *ngIf="!scrapperLoaded; else mainContent">
      <div class="splash">
        <h2>Iniciando el scrapper...</h2>
        <p>Por favor, espera mientras se cargan los datos.</p>
      </div>
    </ng-container>
    <ng-template #mainContent>
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
    </ng-template>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .splash {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
      font-family: Arial, sans-serif;
      text-align: center;
    }
  `]
})
export class AppComponent implements OnInit {
  selectedSymbol: string = 'AAPL';
  selectedStockName: string = 'Apple Inc.';
  selectedView: string = 'stocks';
  scrapperLoaded: boolean = false;
  private sub!: Subscription;

  constructor(
    private stockService: AlphaVantageService,
    private carteraService: CarteraService
  ) {}

  ngOnInit(): void {
    this.sub = this.carteraService.scrapperLoaded$.subscribe(loaded => {
      console.log('Scrapper loaded:', loaded);
      this.scrapperLoaded = loaded;
    });
  }
  

  onNavigate(view: string): void {
    this.selectedView = view;
  }

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
}

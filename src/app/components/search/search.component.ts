// search.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlphaVantageService } from '../../services/alpha-vantage.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-box">
      <input 
        type="text" 
        [(ngModel)]="symbol" 
        placeholder="Ticket: IBM, AAPL, MSFT..."
        (input)="onInputChange()"
        (keyup.enter)="handleSearch()"
      >
      <button (click)="handleSearch()">Buscar</button>
    </div>
    <ul class="suggestions" *ngIf="suggestions.length">
      <li *ngFor="let suggestion of suggestions" (click)="selectSymbol(suggestion)">
        {{ suggestion.symbol }} - {{ suggestion.name }}
      </li>
    </ul>
  `,
  styles: [`
    .search-box { text-align: center; margin-bottom: 1rem; }
    input { 
      padding: 0.625rem;
      width: 30rem;
      border: 0.125rem solid #333;
      border-radius: 0.25rem;
      font-size: 1rem;
      margin-right: 0.625rem; 
    }
    button { 
      padding: 0.625rem 1.25rem;
      background-color: #555;
      border: 0.125rem solid #333;
      border-radius: 0.25rem;
      font-size: 1rem;
      cursor: pointer;
      color: white; 
    }
    button:hover { background-color: #777; }
    .suggestions {
      display: flex;
      flex-direction: column;
      align-items: center;
      list-style: none;
      padding: 0;
      margin: 0 auto;
      width: fit-content;
    }
    .suggestions li { 
      padding: 0.5rem; 
      cursor: pointer;
      width: 36rem;
    }
    .suggestions li:hover { background: #f0f0f0; }
  `]
})
export class SearchComponent {
  // Se emite un objeto con symbol y name
  @Output() search = new EventEmitter<{ symbol: string; name: string }>();
  symbol = '';
  suggestions: { symbol: string; name: string }[] = [];

  constructor(private stockService: AlphaVantageService) {}

  //Finhub
  onInputChange() {
    if (this.symbol.length > 0) {
      this.stockService.searchSymbols(this.symbol).subscribe(response => {
        this.suggestions = response.result?.map((match: any) => ({
          symbol: match.symbol,
          name: match.description
        })) || [];              
      });
    } else {
      this.suggestions = [];
    }
  }

  //AlphaVantage
  // onInputChange() {
  //   if (this.symbol.length > 0) {
  //     this.stockService.searchSymbols(this.symbol).subscribe(response => {
  //       this.suggestions = response.bestMatches?.map((match: any) => ({
  //         symbol: match['1. symbol'],
  //         name: match['2. name']
  //       })) || [];
  //     });
  //   } else {
  //     this.suggestions = [];
  //   }
  // }

  // Se emite el objeto completo al seleccionar una sugerencia
  selectSymbol(suggestion: { symbol: string; name: string }) {
    this.search.emit({
      symbol: suggestion.symbol.toUpperCase(),
      name: suggestion.name
    });
    this.suggestions = [];
    this.symbol = '';
  }

  // Al presionar Enter se emite el símbolo (en este caso sin nombre)
  handleSearch() {
    if (this.symbol.trim()) {
      this.search.emit({
        symbol: this.symbol.trim().toUpperCase(),
        name: ''
      });
      this.suggestions = [];
      this.symbol = '';
    }
  }
}

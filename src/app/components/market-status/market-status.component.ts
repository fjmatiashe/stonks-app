import { Component, OnInit } from '@angular/core';
import { AlphaVantageService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-market-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="marketStatus">
      <table class="market-table">
        <thead>
          <tr>
            <th>Región</th>
            <th>Bolsa</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let market of marketStatus.markets">
            <td>{{ market.region }}</td>
            <td>{{ market.primary_exchanges }}</td>
            <td [class.open]="market.current_status === 'open'" 
                [class.closed]="market.current_status === 'closed'">
              {{ market.current_status === 'open' ? 'Abierto' : 'Cerrado' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `h3 {
      font-family: Arial, sans-serif;
      text-align: center;
    }
    .market-table {
      width: 100%;
      border-collapse: collapse;
      font-family: Arial, sans-serif;
    }
    .market-table th, .market-table td {
      border: 1px solid #ddd;
      padding: 0.5rem;
      text-align: center;
    }
    .market-table th {
      background-color: #333;
      color: white;
    }
    .market-table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .market-table tr:hover {
      background-color: #f1f1f1;
    }
    .open { color: green; font-weight: bold; }
    .closed { color: red; font-weight: bold; }`
  ]
})
export class MarketStatusComponent implements OnInit {
  marketStatus: any;

  constructor(private stockService: AlphaVantageService) {}

  ngOnInit() {
    this.stockService.getMarketStatus().subscribe({
      next: (response) => {
        this.marketStatus = response;
      },
      error: () => {
        this.marketStatus = { error: 'No se pudo obtener el estado del mercado' };
      }
    });
  }
}

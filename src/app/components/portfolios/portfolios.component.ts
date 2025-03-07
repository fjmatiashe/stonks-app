import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarteraService, Holding, Manager } from '../../services/server.service';

@Component({
  selector: 'app-portfolios',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="portfolio-container">
      <h2>CARTERAS DE SUPERINVERSORES - DATOS DE DATAROMA.COM</h2>
      <div class="controls-container">
        <!-- Select para inversionistas -->
        <div class="select-wrapper">
          <select id="tickerSelect" (change)="onSelectTicker($event)" [value]="selectedTicker">
            <option value=""> Seleccione un inversor </option>
            <option *ngFor="let manager of managers" [value]="manager.ticker">
              {{ manager.name }}
            </option>
          </select>
        </div>
        <!-- Select para listas de Home -->
        <div class="select-wrapper">
          <select id="homeListSelect" (change)="onSelectHomeList($event)" [value]="selectedHomeList">
            <option value=""> Conjunto de inversores </option>
            <option *ngFor="let list of homeListKeys" [value]="list.key">
              {{ list.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Tabla para mostrar cartera o lista de Home -->
      <table class="portfolio-table" *ngIf="(selectedHomeList && homeLists[selectedHomeList]?.length) || (!selectedHomeList && holdings?.length)">
        <thead *ngIf="!selectedHomeList && holdings?.length">
          <tr>
            <th>Stock</th>            
            <th>Actividad Reciente</th>
            <th>%</th>
            <th>Pvp acción $</th>
            <th>Nº de acciones</th>
          </tr>
        </thead>
        <tbody>
          <!-- Si se ha seleccionado una lista de Home -->
          <ng-container *ngIf="selectedHomeList">
            <tr *ngFor="let row of homeLists[selectedHomeList]">
              <td *ngFor="let cell of row">{{ cell }}</td>
            </tr>
          </ng-container>
          <!-- Si se ha seleccionado un inversor -->
          <ng-container *ngIf="!selectedHomeList">
            <tr *ngFor="let holding of holdings">
              <td>{{ holding.stock }}</td>
              <td>{{ holding.recentActivity }}</td>
              <td>{{ holding.percentage }}</td>
              <td>{{ holding.currentPrice }}</td>
              <td>{{ holding.value }}</td>
            </tr>
          </ng-container>
        </tbody>
      </table>

      <!-- Mensajes de no datos -->
      <div *ngIf="!selectedHomeList && (!holdings || holdings.length === 0)" class="no-data">
        No hay datos disponibles para este inversionista.
      </div>
      <div *ngIf="selectedHomeList && (!homeLists[selectedHomeList] || homeLists[selectedHomeList].length === 0)" class="no-data">
        No hay datos disponibles para esta lista.
      </div>
    </div>
  `,
  styles: [`
    .portfolio-container {
      margin: 40px auto;
      max-width: 1200px;
      font-family: Arial, sans-serif;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    h2 {
      color: #333;
      margin-bottom: 20px;
      text-align: center;
    }
    .controls-container {
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }
    .select-wrapper {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    label {
      font-size: 16px;
      margin-bottom: 8px;
      color: #333;
    }
    select {
      font-size: 16px;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: 19rem;
    }
    .portfolio-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .portfolio-table th, 
    .portfolio-table td {
      padding: 12px 15px;
      border: 1px solid #ddd;
      text-align: left;
    }
    .portfolio-table th {
      background-color: #f4f4f4;
      font-weight: 600;
    }
    .portfolio-table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .portfolio-table tr:hover {
      background-color: #f1f1f1;
    }
    .no-data {
      text-align: center;
      margin-top: 20px;
      color: #777;
      font-size: 16px;
    }
  `]
})
export class PortfoliosComponent implements OnInit {
  holdings: Holding[] = [];
  managers: Manager[] = [];
  selectedTicker: string = '';

  homeLists: any = {};
  selectedHomeList: string = '';
  homeListKeys = [
    { key: 'topMostOwned', label: 'Top 10 most owned stocks' },
    { key: 'topStocksByPercentage', label: 'Top 10 stocks by %' },
    { key: 'topBigBets', label: 'Top "big bets"' },
    { key: 'topBuysLastQtr', label: 'Top 10 buys last qtr (Q4 2024)' },
    { key: 'topBuysLastQtrByPercentage', label: 'Top 10 buys last qtr by % (Q4 2024)' },
    { key: 'holdingsNear52Low', label: '5% or greater holdings near 52 week low' },
    { key: 'insiderBuys', label: 'Superinvestor stocks with most insider buys in the last 3 months' }
  ];

  constructor(private carteraService: CarteraService) {}

  ngOnInit(): void {
    this.loadManagers();
    this.loadHomeLists();
  }

  loadManagers(): void {
    this.carteraService.getManagers().subscribe(
      data => {
        this.managers = data;
        console.log('Managers:', this.managers);
      },
      error => console.error('Error al obtener los managers', error)
    );
  }

  loadCartera(ticker: string): void {
    this.carteraService.getCartera(ticker).subscribe(
      data => {
        this.holdings = data;
        // Al cargar cartera se limpia la vista de listas.
        this.selectedHomeList = '';
        console.log('Cartera cargada:', this.holdings);
      },
      error => console.error('Error al obtener la cartera', error)
    );
  }

  onSelectTicker(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const ticker = selectElement.value;
    this.selectedTicker = ticker;
    // Al seleccionar un inversor, se limpia la vista de listas.
    this.selectedHomeList = '';
    if (ticker) {
      this.loadCartera(ticker);
    } else {
      this.holdings = [];
    }
  }

  onSelectHomeList(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const key = selectElement.value;
    this.selectHomeList(key);
  }

  loadHomeLists(): void {
    this.carteraService.getHomeLists().subscribe(
      data => {
        this.homeLists = data;
        console.log('Listas de Home cargadas:', this.homeLists);
      },
      error => console.error('Error al obtener las listas de home', error)
    );
  }

  selectHomeList(key: string): void {
    this.selectedHomeList = key;
    // Al seleccionar una lista, se limpia la cartera y la selección de inversionista.
    this.holdings = [];
    this.selectedTicker = '';
  }
}

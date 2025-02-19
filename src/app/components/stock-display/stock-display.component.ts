import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, KeyValue, KeyValuePipe } from '@angular/common';
import { AlphaVantageService } from '../../services/alpha-vantage.service';

interface StockData {
  'Meta Data': {
    '2. Symbol': string;
  };
  'Weekly Adjusted Time Series': {
    [key: string]: {
      '4. close': string;
      // Se pueden incluir otros campos si se requiere.
    };
  };
}

interface StockError {
  error: string;
}

@Component({
  selector: 'app-stock-display',
  standalone: true,
  imports: [CommonModule, KeyValuePipe],
  template: `
    <div class="stock-data" *ngIf="data">
      <!-- En caso de error -->
      <div *ngIf="isError(data)" class="error">
        {{ data.error }}
      </div>

      <!-- Si la respuesta es correcta -->
      <div *ngIf="!isError(data)">
        <h2>{{ data['Meta Data']['2. Symbol'] }}</h2>
        
        <!-- Gráfico de barras simple -->
        <h3>Gráfico de cierre semanal</h3>
        <div class="chart" *ngIf="chartData.length">
          <div 
            *ngFor="let point of chartData" 
            class="bar" 
            [style.height.%]="getBarHeight(point.close)"
            title="{{ point.date }}: {{ point.close | number:'1.2-2' }}">
          </div>
        </div>

        <!-- Lista de datos semanales en orden descendente (de la fecha actual hacia atrás) -->
        <div class="time-series">
          <div 
            *ngFor="let entry of data['Weekly Adjusted Time Series'] | keyvalue: descendingComparator" 
            class="time-entry"
          >
            <h3>{{ entry.key }}</h3>
            <p>Cierre: {{ (entry.value['4. close'] | number:'1.2-2') || 'N/A' }}</p>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [
    /* Estilos para la lista de datos */
  `.time-series { 
        display: grid; 
        gap: 1rem; 
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
      }
    .time-entry { 
        background: #f8f9fa; 
        padding: 1rem; 
        border-radius: 4px; 
      }
    .error { 
        color: #dc3545; 
        padding: 1rem; 
        background: #fff3cd; 
      }`,

  /* Estilos para el gráfico de barras */
  `.chart {
        display: flex;
        align-items: flex-end;
        height: 200px;
        border-left: 1px solid #333;
        border-bottom: 1px solid #333;
        margin-top: 1rem;
      }
    .bar {
        background-color: #007bff;
        width: 10px;
        transition: background-color 0.3s;
      }
    .bar:hover {
        background-color: #0056b3;
      }`
  ]
})
export class StockDisplayComponent implements OnChanges {
  // Recibimos el símbolo desde el componente padre
  @Input() symbol: string | null = null;

  // Datos recibidos de la API
  data: StockData | StockError | null = null;

  // Arreglo que usaremos para el gráfico
  chartData: { date: string; close: number }[] = [];
  // Valor máximo de cierre para escalar las barras
  maxClose: number = 0;

  constructor(private alphaVantageService: AlphaVantageService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['symbol'] && this.symbol) {
      this.fetchStockData();
    }
  }

  fetchStockData(): void {
    this.alphaVantageService.getStockData(this.symbol!).subscribe({
      next: (response) => {
        if (response['Error Message']) {
          this.data = { error: 'Símbolo de acción inválido' };
          this.chartData = [];
          this.maxClose = 0;
        } else {
          this.data = response;
          this.prepareChartData();
        }
      },
      error: () => {
        this.data = { error: 'Fallo en la petición a la API' };
        this.chartData = [];
        this.maxClose = 0;
      }
    });
  }

  prepareChartData(): void {
    if (this.data && !this.isError(this.data)) {
      const series = this.data['Weekly Adjusted Time Series'];
      // Convertimos el objeto en un arreglo ordenado en forma descendente (la fecha más reciente primero)
      this.chartData = Object.keys(series)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .map(date => ({
          date,
          close: parseFloat(series[date]['4. close'])
        }));
      this.maxClose = Math.max(...this.chartData.map(point => point.close));
    }
  }

  /**
   * Calcula la altura de la barra en porcentaje
   */
  getBarHeight(close: number): number {
    if (this.maxClose === 0) return 0;
    return (close / this.maxClose) * 100;
  }

  /**
   * Comparador para el KeyValuePipe que ordena de forma descendente (la fecha más reciente primero).
   * Nota: El KeyValuePipe espera una función que compare dos objetos KeyValue.
   */
  descendingComparator(a: KeyValue<string, any>, b: KeyValue<string, any>): number {
    return new Date(b.key).getTime() - new Date(a.key).getTime();
  }

  // Type guard para identificar si se trata de un error
  isError(data: any): data is StockError {
    return data && data.error;
  }
}

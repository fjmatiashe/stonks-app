import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AlphaVantageService } from '../../services/alpha-vantage.service';
import { combineLatest } from 'rxjs';

// Interfaz para los datos históricos
interface HistoricalData {
  date: string;
  close: number;
}

@Component({
  selector: 'app-stock-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Buscador estilizado -->
    <div class="search-container">
      <input
        type="text"
        [(ngModel)]="ticker"
        placeholder="Ingrese un ticker"
        (keyup.enter)="onSearch()"
      />
      <button (click)="onSearch()">Buscar</button>
    </div>

    <!-- Gráfico (solo si hay datos) -->
    <div *ngIf="historicalData.length" class="chart-wrapper">
      <div class="chart-info left">
        <div class="max">Máx: {{ getMaxClose() | number:'1.2-2' }}</div>
        <div class="min">Mín: {{ getMinClose() | number:'1.2-2' }}</div>
      </div>

      <div class="chart-container">
        <svg width="71.88rem" height="18.75rem" class="chart">
          <rect
            x="0"
            y="0"
            width="71.88rem"
            height="18.75rem"
            fill="transparent"
            (mousemove)="onMouseMove($event)"
            (mouseleave)="hideTooltip()"
          ></rect>
          <polygon [attr.points]="getChartPoints(true)" fill="rgba(40, 167, 69, 0.3)"></polygon>
          <polyline [attr.points]="getChartPoints()" fill="none" stroke="#28a745" stroke-width="0.125rem"></polyline>
          <g *ngFor="let tick of getXAxisTicks(); let i = index">
            <text [attr.x]="getXPosition(i)" y="19rem" font-size="0.75rem" text-anchor="middle">
              {{ tick }}
            </text>
          </g>
          <g *ngIf="tooltipVisible">
            <rect [attr.x]="tooltipX - 3.125" [attr.y]="tooltipY - 3.125" width="6.25rem" height="1.875rem" fill="white" stroke="black"></rect>
            <text [attr.x]="tooltipX +47" [attr.y]="tooltipY +16" font-size="0.75rem" text-anchor="middle">
              {{ tooltipDate }}: {{ tooltipValue | number:'1.2-2' }}
            </text>
          </g>
        </svg>
      </div>

      <div class="chart-info right">
        <div class="current">Actual: {{ getCurrentValue(this.historicalData) | number:'1.2-2' }}</div>
      </div>
    </div>

    <!-- Sección de datos en tres columnas -->
    <div class="data-columns">
      <!-- Columna 1: Últimos días (más recientes arriba) -->
      <div class="historical">
        <h2 *ngIf="historicalData.length">Últimos días</h2>
        <div *ngIf="historicalData.length; else errorTpl">
          <div *ngFor="let data of getRecentHistoricalData()">
            <p>Fecha: {{ data.date }} - Cierre: {{ data.close }}</p>
            <hr />
          </div>
        </div>
      </div>

      <!-- Columna 2: Recomendación de Analistas -->
      <div class="recommendations">
        <div *ngIf="analystRecommendations.length;">
        <h2>Recomendación de Analistas</h2>
        <div *ngIf="analystRecommendations.length; else noRecTpl">
          <ul>
            <li *ngFor="let rec of analystRecommendations">
              <p class="sri"[style.color]="getSRIColor(rec.sri)">SRI: {{ rec.sri | number:'1.3-5' }}</p>
              <p [style.color]="getRecommendationColor('strong_buy')">Strong Buy: {{ rec.strong_buy }}</p>
              <p [style.color]="getRecommendationColor('buy')">Buy: {{ rec.buy }}</p>
              <p [style.color]="getRecommendationColor('hold')">Hold: {{ rec.hold }}</p>
              <p [style.color]="getRecommendationColor('sell')">Sell: {{ rec.sell }}</p>
              <p [style.color]="getRecommendationColor('strong_sell')">Strong Sell: {{ rec.strong_sell }}</p>
              <p>Periodo: {{ rec.period * 1000 | date:'dd/MM/yyyy' }}</p>
              <hr />
            </li>
          </ul>
        </div>
        </div>
        <ng-template #noRecTpl>
          <p>No hay recomendaciones disponibles.</p>
        </ng-template>
      </div>

      <!-- Columna 3: Datos Fundamentales -->
      <div class="fundamentals">
      <div *ngIf="incomeStatementData">
        <h2>Datos Fundamentales</h2>
        <p>EPS útimo trimestre: {{ computedEPS | number:'1.2-2' }}</p>
        <p>EPS útimo año: {{ computedYearEPS | number:'1.2-2' }}</p>
        <p>PER (Precio/EPS): {{ perRatio | number:'1.2-2' }}</p>
        <p>Forward PER: {{ forwardPerRatio | number:'1.2-2' }}</p>
        <p *ngIf="profitMargin">Margen de Beneficio: {{ profitMargin | percent:'1.2-2' }}</p>
      </div>
      </div>
    </div>

    <ng-template #errorTpl>
      <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
    </ng-template>
  `,
  styles: [`
    /* Buscador */
    .search-container { text-align: center; margin-bottom: 1rem; }
    .search-container input {
      padding: 0.625rem;
      width: 18.75rem;
      border: 0.125rem solid #28a745;
      border-radius: 0.25rem;
      font-size: 1rem;
      margin-right: 0.625rem;
    }
    .search-container button {
      padding: 0.625rem 1.25rem;
      background-color: #28a745;
      color: #fff;
      border: none;
      border-radius: 0.25rem;
      font-size: 1rem;
      cursor: pointer;
    }
    .search-container button:hover { background-color: #218838; }
    
    /* Gráfico */
    .chart-wrapper { display: flex; align-items: center; justify-content: center; margin: 1rem auto; width: 71.88rem; }
    .chart-container { position: relative; }
    .chart { display: block; border: 0.0625rem solid #333; }
    .chart-info { font-size: 0.875rem; width: 6.25rem; text-align: center; }
    .chart-info.left { margin-right: 0.625rem; }
    .chart-info.right { margin-left: 0.625rem; }
    
    /* Columnas de datos */
    .data-columns {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: flex-start;
      margin-top: 2rem;
    }

    .sri{
      font-weight: bold;
      font-size: 1.25rem;}
  
    .historical, .recommendations, .fundamentals {
      flex: 1;
      margin: 0 1rem;
      text-align: left;
    }
    h2, h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { margin: 0.3125rem 0; }
    .error { color: red; font-weight: bold; }
  `]
})
export class StockInfoComponent implements OnInit {
  historicalData: HistoricalData[] = [];
  errorMessage: string = '';
  ticker: string = '';
  analystRecommendations: any[] = [];
  tooltipVisible: boolean = false;
  tooltipX: number = 0;
  tooltipY: number = 0;
  tooltipValue: number = 0;
  tooltipDate: string = '';

  // Variables para datos fundamentales
  incomeStatementData: any;
  epsHistoricalData: any;
  epsTrendsData: any;
  computedEPS: number = 0;
  computedYearEPS: number = 0;
  perRatio: number = 0;
  forwardPerRatio: number = 0;
  profitMargin: number = 0; // netIncome / revenue

  constructor(private stockService: AlphaVantageService) {}

  ngOnInit(): void {
    // Se puede invocar fetchFundamentalData() si se tiene ticker por defecto
  }

  onSearch(): void {
    this.errorMessage = '';
    this.historicalData = [];
    this.analystRecommendations = [];
    // Reiniciamos datos fundamentales
    this.incomeStatementData = null;
    this.epsHistoricalData = null;
    this.epsTrendsData = null;
    this.computedEPS = 0;
    this.computedYearEPS = 0;
    this.perRatio = 0;
    this.forwardPerRatio = 0;
    this.profitMargin = 0;
  
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    today.setDate(today.getDate() - 3000);
    const startDate = today.toISOString().split('T')[0];
  
    // Observables para datos históricos y fundamentales
    const historical$ = this.stockService.getHistoricalDailyData(this.ticker, startDate, endDate);
    const fundamentals$ = forkJoin({
      incomeStatement: this.stockService.getIncomeStatement(this.ticker),
      epsHistorical: this.stockService.getEPSHistorical(this.ticker),
      epsTrends: this.stockService.getEPSTrends(this.ticker)
    });
  
    combineLatest([historical$, fundamentals$]).subscribe({
      next: ([historicalDataRaw, fundamentalsData]) => {
        // Procesar datos históricos
        if (Array.isArray(historicalDataRaw) && historicalDataRaw.length > 0) {
          this.historicalData = historicalDataRaw.map(item => ({
            date: new Date(item.t * 1000).toISOString().split('T')[0],
            close: item.c,
          }));
          this.historicalData.sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          console.log('🎯 Datos históricos procesados:', this.historicalData);
        } else {
          this.errorMessage = '⚠️ No hay datos históricos disponibles';
        }
  
        // Datos fundamentales
        this.incomeStatementData = fundamentalsData.incomeStatement;
        this.epsHistoricalData = fundamentalsData.epsHistorical;
        this.epsTrendsData = fundamentalsData.epsTrends;
        console.log('✅ Datos fundamentales recibidos:', fundamentalsData);
  
        // Ahora que ambos sets de datos están disponibles, se calculan los fundamentales
        this.calculateFundamentals();
      },
      error: (err) => {
        console.error('🚨 Error al obtener datos:', err);
        this.errorMessage = '❌ Error al cargar los datos.';
      }
    });
  
    // También puedes seguir llamando a fetchAnalystRecommendations() de forma independiente
    this.fetchAnalystRecommendations();
  }

  fetchHistoricalData(): void {
    if (!this.ticker.trim()) {
      this.errorMessage = '⚠️ Por favor, ingrese un ticker válido';
      return;
    }
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    today.setDate(today.getDate() - 3000); // Ejemplo: 5000 días atrás
    const startDate = today.toISOString().split('T')[0];

    console.log('🔄 Solicitando datos históricos para:', this.ticker);
    this.stockService.getHistoricalDailyData(this.ticker, startDate, endDate).subscribe({
      next: (data) => {
        console.log('✅ Datos históricos recibidos:', data);
        if (Array.isArray(data) && data.length > 0) {
          this.historicalData = data.map(item => ({
            date: new Date(item.t * 1000).toISOString().split('T')[0],
            close: item.c,
          }));
          // Ordenar de forma ascendente (datos antiguos primero)
          this.historicalData.sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          console.log('🎯 Datos procesados:', this.historicalData);
        } else {
          this.errorMessage = '⚠️ No hay datos históricos disponibles';
          console.warn('❌ Datos históricos vacíos:', data);
        }
      },
      error: (err) => {
        console.error('🚨 Error al obtener datos históricos:', err);
        this.errorMessage = '❌ Error al cargar los datos históricos.';
      }
    });
  }

  fetchAnalystRecommendations(): void {
    console.log('📊 Solicitando recomendaciones de analistas para:', this.ticker);
    this.stockService.getAnalystRecommendations(this.ticker).subscribe({
      next: (data) => {
        console.log('✅ Recomendaciones recibidas:', data);
        if (data && data.records && Array.isArray(data.records) && data.records.length > 0) {
          const record = data.records[0];
          const mappedRecommendation = {
            sentiment: data.sentiment || 'N/A',
            recommendation: data.recommendation || 'N/A',
            sri: data.sri,
            buy: record.buy,
            hold: record.hold,
            sell: record.sell,
            strong_buy: record.strong_buy,
            strong_sell: record.strong_sell,
            period: record.period
          };
          this.analystRecommendations = [mappedRecommendation];
        } else {
          console.warn('❌ No se recibieron recomendaciones:', data);
          this.analystRecommendations = [];
        }
      },
      error: (err) => {
        console.error('🚨 Error al obtener recomendaciones:', err);
      }
    });
  }

  fetchFundamentalData(): void {
    if (!this.ticker.trim()) {
      this.errorMessage = '⚠️ Por favor, ingrese un ticker válido';
      return;
    }
    console.log('🔄 Solicitando datos fundamentales para:', this.ticker);
    forkJoin({
      incomeStatement: this.stockService.getIncomeStatement(this.ticker),
      epsHistorical: this.stockService.getEPSHistorical(this.ticker),
      epsTrends: this.stockService.getEPSTrends(this.ticker)
    }).subscribe({
      next: (data) => {
        console.log('✅ Datos fundamentales recibidos:', data);
        this.incomeStatementData = data.incomeStatement;
        this.epsHistoricalData = data.epsHistorical;
        this.epsTrendsData = data.epsTrends;
        console.log('incomeStatementData', this.incomeStatementData);
        console.log('epsHistoricalData', this.epsHistoricalData);
        console.log('epsTrendsData', this.epsTrendsData);
        this.calculateFundamentals();
      },
      error: (err) => {
        console.error('🚨 Error al obtener datos fundamentales:', err);
        this.errorMessage = '❌ Error al cargar los datos fundamentales.';
      }
    });
  }

  calculateFundamentals(): void {

    //EPS trimestral
    const epsHistoricalArray = Array.isArray(this.epsHistoricalData)
      ? this.epsHistoricalData
      : Object.values(this.epsHistoricalData || {});
      console.log('📊 EPS Historical:', epsHistoricalArray);
    if (epsHistoricalArray.length > 0) {
      const latestEPSRecord = epsHistoricalArray[2];
      this.computedEPS = latestEPSRecord.epsActual;
      console.log('🧮 EPS calculado:', this.computedEPS);

    //EPS anual
    if (epsHistoricalArray.length >= 6) {
      this.computedYearEPS =
        epsHistoricalArray[2].epsActual +
        epsHistoricalArray[3].epsActual +
        epsHistoricalArray[4].epsActual +
        epsHistoricalArray[5].epsActual;
      console.log('🧮 EPS Anual calculado:', this.computedYearEPS);
    } else {
      console.warn('⚠️ No hay suficientes datos para calcular el EPS anual.');
      this.computedYearEPS = 0;
    }

    //PER
      const currentPrice = this.getCurrentValue(this.historicalData);
      console.log('🧮 P actual:', currentPrice);
      this.perRatio = this.computedEPS !== 0 ? currentPrice / this.computedYearEPS : 0;
      console.log('🧮 PER calculado:', this.perRatio);
    } else {
      console.warn('⚠️ No hay datos de EPS Historical para calcular el EPS.');
    }
  
    // Forward PER
    const currentPrice = this.getCurrentValue(this.historicalData);
    const epsTrendsArray = Array.isArray(this.epsTrendsData)
      ? this.epsTrendsData
      : Object.values(this.epsTrendsData || {});

    // Suponiendo que quieres usar el cuarto registro (índice 3) de epsTrendsArray:
    const fourthRecord = epsTrendsArray[3];
    console.log('📈 Cuarto registro de EPS Trends:', fourthRecord);

    if (fourthRecord) {
      // Convierte el objeto en un array de [fecha, registro]
      const entries = Object.entries(fourthRecord);
      
      // Ordena los registros por fecha descendente (de más reciente a más antiguo)
      const sortedEntries = entries.sort(
        ([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime()
      );
      
      // Extrae solo los 4 registros más recientes y descarta la fecha
      const fourMostRecent = sortedEntries.slice(0, 4).map(([, record]) => record);
      console.log('📈 Cuatro registros más recientes del cuarto registro:', fourMostRecent);
      
      // Suma los valores de epsTrendCurrent de esos 4 registros
      const forwardEPS: any = fourMostRecent.reduce(
        (sum, item: any) => sum + (item.epsTrendCurrent || 0),
        0
      );
      console.log('📈 EPS Forward:', forwardEPS);
      
      this.forwardPerRatio = forwardEPS !== 0 ? currentPrice / forwardEPS : 0;
      console.log('🧮 Forward PER calculado:', this.forwardPerRatio);
    } else {
      console.warn('⚠️ No hay datos en el cuarto registro de EPS Trends para calcular Forward PER.');
    }

  }
  
  // Devuelve los últimos 5 días (más recientes primero)
  getRecentHistoricalData(): HistoricalData[] {
    return this.historicalData.slice(-5).reverse();
  }

  getChartPoints(fill: boolean = false): string {
    if (!this.historicalData.length) return '';
    const width = 71.88 * 16; // 1150px
    const height = 18.75 * 16; // 300px
    const min = this.getMinClose();
    const max = this.getMaxClose();
    const range = max - min;
    const step = width / (this.historicalData.length - 1);
    let points = this.historicalData.map((d, index) => {
      const x = index * step;
      const y = height - ((d.close - min) / range * height);
      return `${x},${y}`;
    });
    if (fill) {
      points.push(`${width},${height}`, `0,${height}`);
    }
    return points.join(' ');
  }

  getChartData() {
    const width = 71.88 * 16; // 1150px
    const height = 18.75 * 16; // 300px
    const min = this.getMinClose();
    const max = this.getMaxClose();
    const range = max - min;
    const step = width / (this.historicalData.length - 1);
    return this.historicalData.map((d, index) => ({
      x: index * step,
      y: height - ((d.close - min) / range * height),
      value: d.close,
      date: d.date
    }));
  }

  getXAxisTicks(): string[] {
    return this.historicalData
      .map(d => d.date)
      .filter((_, index, arr) => index % Math.ceil(arr.length / 6) === 0);
  }

  getXPosition(index: number): number {
    const width = 71.88 * 16; // 1150px
    const ticks = this.getXAxisTicks();
    const step = width / (ticks.length - 1);
    return index * step;
  }

  getMinClose(): number {
    return this.historicalData.length ? Math.min(...this.historicalData.map(item => item.close)) : 0;
  }

  getMaxClose(): number {
    return this.historicalData.length ? Math.max(...this.historicalData.map(item => item.close)) : 0;
  }

  getCurrentValue(historicalData: HistoricalData[]): number {
    if (!historicalData || historicalData.length === 0) {
      return 0; // Retorna 0 si aún no hay datos
    }
    const latestData = historicalData[historicalData.length - 1];
    return latestData.close;
  }
  


  onMouseMove(event: MouseEvent): void {
    if (!this.historicalData.length) return;
    const svgElement = (event.target as HTMLElement).closest('svg') as SVGSVGElement;
    const rect = svgElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const width = 71.88 * 16; // 1150px
    const step = width / (this.historicalData.length - 1);
    let index = Math.round(mouseX / step);
    if (index < 0) { index = 0; }
    if (index >= this.historicalData.length) { index = this.historicalData.length - 1; }
    const point = this.getChartData()[index];
    this.tooltipX = point.x;
    this.tooltipY = point.y;
    this.tooltipValue = point.value;
    this.tooltipDate = point.date;
    this.tooltipVisible = true;
  }

  hideTooltip(): void {
    this.tooltipVisible = false;
  }

  getRecommendationColor(field: string): string {
    switch(field) {
      case 'strong_buy': return 'green';
      case 'buy': return 'lightgreen';
      case 'hold': return 'gold';
      case 'sell': return 'orange';
      case 'strong_sell': return 'red';
      default: return 'black';
    }
  }

  getSRIColor(sri: number): string {
    const hue = sri * 120;
    return `hsl(${hue}, 100%, 40%)`;
  }
}

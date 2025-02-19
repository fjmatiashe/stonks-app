import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AlphaVantageService } from '../../services/alpha-vantage.service';

// Interfaz para los datos históricos
interface HistoricalData {
  date: string;
  close: number;
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
  percent?: number; 
}

@Component({
  selector: 'app-stock-info-mix',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Título con el nombre de la acción -->
    <h1 class="title" *ngIf="stockName">{{ stockName }}</h1>

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
            <text [attr.x]="tooltipX + 47" [attr.y]="tooltipY + 16" font-size="0.75rem" text-anchor="middle">
              {{ tooltipDate }}: {{ tooltipValue | number:'1.2-2' }}
            </text>
          </g>
        </svg>
      </div>

      <div class="chart-info right">
        <div class="current">Actual: {{ getCurrentValue(historicalData) | number:'1.2-2' }}</div>
      </div>
    </div>

    <div class="data-columns">
      <!-- Columna 1: Últimos días -->
      <div *ngIf="historicalData.length" class="historical">
        <h2 *ngIf="historicalData.length">Últimos días</h2>
        <div *ngIf="historicalData.length; else errorTpl">
          <div *ngFor="let data of getRecentHistoricalData()">
            <p>{{ data.date }} - Cierre: {{ data.close }}</p>
            <hr />
          </div>
        </div>
      </div>

      <!-- Columna 2: Recomendación de Analistas (tarjeta) -->
      <div class="recommendations" *ngIf="analystRecommendations.length">
        <h2>Opinión de Analistas</h2>
        <div class="recommendations-content" *ngIf="analystRecommendations.length; else noRecTpl">
          <div class="recommendations-donut">
            <svg width="150" height="150" viewBox="0 0 42 42" class="donut">
              <circle class="donut-hole" cx="21" cy="21" r="15.91549431" fill="#fff"></circle>
              <circle class="donut-ring" cx="21" cy="21" r="15.91549431" fill="transparent" stroke="#d2d3d4" stroke-width="3"></circle>
              <ng-container *ngFor="let segment of getDonutData(); let i = index">
                <circle
                  class="donut-segment"
                  cx="21" cy="21" r="15.91549431"
                  [attr.stroke]="segment.color"
                  stroke-width="3"
                  fill="transparent"
                  [attr.stroke-dasharray]="((segment.percent ?? 0) * 100) + ' ' + (100 - ((segment.percent ?? 0) * 100))"
                  [attr.stroke-dashoffset]="calculateDonutOffset(i)">
                </circle>
              </ng-container>
              <!-- Texto SRI en el centro, contrarrotado y formateado a 3 decimales -->
              <text x="50%" y="40%" text-anchor="middle" dy=".3em" class="sri" transform="rotate(90 21 21)">
                SRI
              </text>
              <text x="50%" y="60%" text-anchor="middle" dy=".3em" class="sri" transform="rotate(90 21 21)">
                {{ analystRecommendations[0]?.sri | number:'1.3-3' }}
              </text>
            </svg>
          </div>
          <div class="recommendations-stats">
            <div class="stat">
              <span class="label" [style.color]="getRecommendationColor('strong_buy')">Strong Buy</span>
              <span class="value">{{ analystRecommendations[0]?.strong_buy }}</span>
            </div>
            <div class="stat">
              <span class="label" [style.color]="getRecommendationColor('buy')">Buy</span>
              <span class="value">{{ analystRecommendations[0]?.buy }}</span>
            </div>
            <div class="stat">
              <span class="label" [style.color]="getRecommendationColor('hold')">Hold</span>
              <span class="value">{{ analystRecommendations[0]?.hold }}</span>
            </div>
            <div class="stat">
              <span class="label" [style.color]="getRecommendationColor('sell')">Sell</span>
              <span class="value">{{ analystRecommendations[0]?.sell }}</span>
            </div>
            <div class="stat">
              <span class="label" [style.color]="getRecommendationColor('strong_sell')">Strong Sell</span>
              <span class="value">{{ analystRecommendations[0]?.strong_sell }}</span>
            </div>
            <div class="period">
              Periodo: {{ analystRecommendations[0]?.period * 1000 | date:'dd/MM/yyyy' }}
            </div>
          </div>
        </div>
        <ng-template #noRecTpl>
          <p>No hay recomendaciones disponibles.</p>
        </ng-template>
      </div>

      <!-- Columna 3: Datos Fundamentales -->
      <div class="fundamentals" *ngIf="incomeStatementData">
        <h2>Datos Fundamentales</h2>
        <div class="fundamentals-grid">
          <!-- Columna Trimestral -->
          <div class="fundamentals-col">
            <h3>Trimestral</h3>
            <p>EPS: {{ computedEPS | number:'1.2-2' }}</p>
            <p>Ingr: {{ getCurrencySymbol(incomeStatementData.currency) }}{{ lastQuarterRevenue | number:'1.2-2' }}</p>
            <p>BN: {{ getCurrencySymbol(incomeStatementData.currency) }}{{ lastQuarterNetIncome | number:'1.2-2' }}</p>
            <p *ngIf="profitMargin">Margen: {{ profitMargin | percent:'1.2-2' }}</p>
          </div>
          <!-- Columna Anual -->
          <div class="fundamentals-col">
            <h3>Anual</h3>
            <p>EPS: {{ computedYearEPS | number:'1.2-2' }}</p>
            <p>Ingr: {{ getCurrencySymbol(incomeStatementData.currency) }}{{ lastYearRevenue | number:'1.2-2' }}</p>
            <p>BN: {{ getCurrencySymbol(incomeStatementData.currency) }}{{ lastYearNetIncome | number:'1.2-2' }}</p>
            <p *ngIf="yearProfitMargin">Margen: {{ yearProfitMargin | percent:'1.2-2' }}</p>
          </div>
        </div>
        <!-- PER y Forward PER en una misma línea -->
        <p class="per">
          <span [style.color]="getRatioColor(perRatio)">PER: {{ perRatio | number:'1.2-2' }}</span>
          &nbsp;|&nbsp;
          <span [style.color]="getRatioColor(forwardPerRatio)">Forward PER: {{ forwardPerRatio | number:'1.2-2' }}</span>
        </p>
      </div>
    </div>

    <ng-template #errorTpl>
      <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
    </ng-template>
  `,
  styles: [`
    :host {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }
    .title { text-align: center; }
    /* Gráfico */
    .chart-wrapper { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      margin: 1rem auto; 
      width: 71.88rem; 
    }
    .chart-container { position: relative; }
    .chart { display: block; border: 0.0625rem solid #333; }
    .chart-info { font-size: 0.875rem; width: 6.25rem; text-align: center; }
    .chart-info.left { margin-right: 0.625rem; }
    .chart-info.right { margin-left: 0.625rem; }

    /* Columnas generales */
    .data-columns {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 1rem;
    }
    /* Se definen anchos fijos para cada columna */
    .historical {
      flex: 0 0 20%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .recommendations {
      flex: 0 0 25%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 5px;
      text-align: center;
    }
    .fundamentals {
      flex: 0 0 46%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .per{ text-align: center;}
    h2, h3, h4 { margin-bottom: .75rem; text-align: center; }
    p { margin: 0.3125rem 0; }
    .error { color: red; font-weight: bold; }

    /* Recomendaciones */
    .recommendations-content {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
    }
    .recommendations-donut {
      position: relative;
      width: 150px;
      height: 150px;
      margin-right: 1rem;
    }
    .donut {
      transform: rotate(-90deg);
    }
    .sri {
      font-size: 0.4rem;
      font-weight: bold;
      fill: #000;
    }
    .recommendations-stats {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      text-align: left;
    }
    .stat {
      display: flex;
      justify-content: space-between;
      width: 150px;
    }
    .period {
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }

    /* Datos Fundamentales en grid */
    .fundamentals-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .fundamentals-col {
      border: 1px solid #ccc;
      padding: 0.5rem;
      border-radius: 5px;
      background: #fff;
    }
    .fundamentals-col h3 {
      margin-top: 0;
      font-size: 1.2rem;
      text-align: center;
      background-color: #f4f4f4;
      padding: 0.3rem;
      border-radius: 3px;
    }
  `]
})
export class StockInfoMixComponent implements OnInit, OnChanges {
  @Input() ticker: string = '';
  @Input() stockName: string = '';
  
  historicalData: HistoricalData[] = [];
  errorMessage: string = '';
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
  profitMargin: number = 0; 
  yearProfitMargin: number = 0;
  lastQuarterRevenue: number = 0;
  lastQuarterNetIncome: number = 0;
  lastYearRevenue: number = 0;
  lastYearNetIncome: number = 0;

  constructor(private stockService: AlphaVantageService) {}

  ngOnInit(): void {
    // Se puede invocar onSearch() si se tiene un ticker por defecto
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticker'] && changes['ticker'].currentValue) {
      console.log('🔍 Cambio en el ticker:', changes['ticker'].currentValue, this.stockName);
      this.onSearch();
    }
  }

  onSearch(): void {
    // Reiniciamos datos y mensajes
    this.errorMessage = '';
    this.historicalData = [];
    this.analystRecommendations = [];
    this.incomeStatementData = null;
    this.epsHistoricalData = null;
    this.epsTrendsData = null;
    this.computedEPS = 0;
    this.computedYearEPS = 0;
    this.perRatio = 0;
    this.forwardPerRatio = 0;
    this.profitMargin = 0;
    this.yearProfitMargin = 0;
  
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    today.setDate(today.getDate() - 3000);
    const startDate = today.toISOString().split('T')[0];
  
    const historical$ = this.stockService.getHistoricalDailyData(this.ticker, startDate, endDate);
    const fundamentals$ = forkJoin({
      incomeStatement: this.stockService.getIncomeStatement(this.ticker),
      epsHistorical: this.stockService.getEPSHistorical(this.ticker),
      epsTrends: this.stockService.getEPSTrends(this.ticker)
    });
    const recommendations$ = this.stockService.getAnalystRecommendations(this.ticker);
  
    forkJoin({
      historical: historical$,
      fundamentals: fundamentals$,
      recommendations: recommendations$
    }).subscribe({
      next: (data) => {
        // Procesar datos históricos
        if (Array.isArray(data.historical) && data.historical.length > 0) {
          this.historicalData = data.historical.map(item => ({
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
  
        // Procesar datos fundamentales
        this.incomeStatementData = data.fundamentals.incomeStatement;
        this.epsHistoricalData = data.fundamentals.epsHistorical;
        this.epsTrendsData = data.fundamentals.epsTrends;
        console.log('✅ Datos fundamentales recibidos:', data.fundamentals);
        this.calculateFundamentals();
  
        // Procesar recomendaciones de analistas
        const recData = data.recommendations;
        if (recData && recData.records && Array.isArray(recData.records) && recData.records.length > 0) {
          const record = recData.records[0];
          const mappedRecommendation = {
            sentiment: recData.sentiment || 'N/A',
            recommendation: recData.recommendation || 'N/A',
            sri: recData.sri,
            buy: record.buy,
            hold: record.hold,
            sell: record.sell,
            strong_buy: record.strong_buy,
            strong_sell: record.strong_sell,
            period: record.period
          };
          this.analystRecommendations = [mappedRecommendation];
        } else {
          console.warn('❌ No se recibieron recomendaciones:', recData);
          this.analystRecommendations = [];
        }
      },
      error: (err) => {
        console.error('🚨 Error al obtener datos:', err);
        this.errorMessage = '❌ Error al cargar los datos.';
      }
    });
  }
  
  calculateFundamentals(): void {
    // EPS trimestral
    const epsHistoricalArray = Array.isArray(this.epsHistoricalData)
      ? this.epsHistoricalData
      : Object.values(this.epsHistoricalData || {});
    console.log('📊 EPS Historical:', epsHistoricalArray);
    if (epsHistoricalArray.length > 0) {
      const latestEPSRecord = epsHistoricalArray[2];
      this.computedEPS = latestEPSRecord.epsActual;
      console.log('🧮 EPS calculado:', this.computedEPS);
  
      // EPS anual
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
  
      // PER
      const currentPrice = this.getCurrentValue(this.historicalData);
      console.log('🧮 Precio actual:', currentPrice);
      this.perRatio = this.computedYearEPS !== 0 ? currentPrice / this.computedYearEPS : 0;
      console.log('🧮 PER calculado:', this.perRatio);
    } else {
      console.warn('⚠️ No hay datos de EPS Historical para calcular el EPS.');
    }
  
    // Forward PER
    const currentPrice = this.getCurrentValue(this.historicalData);
    const epsTrendsArray = Array.isArray(this.epsTrendsData)
      ? this.epsTrendsData
      : Object.values(this.epsTrendsData || {});
  
    const fourthRecord = epsTrendsArray[3];
    console.log('📈 Cuarto registro de EPS Trends:', fourthRecord);
  
    if (fourthRecord) {
      const entries = Object.entries(fourthRecord);
      const sortedEntries = entries.sort(
        ([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime()
      );
      const fourMostRecent = sortedEntries.slice(0, 4).map(([, record]) => record);
      console.log('📈 Cuatro registros más recientes:', fourMostRecent);
      
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
  
    // Ingresos y beneficios trimestrales
    if (this.incomeStatementData && this.incomeStatementData.quarterly) {
      const quarterlyData = Array.isArray(this.incomeStatementData.quarterly)
        ? this.incomeStatementData.quarterly
        : Object.values(this.incomeStatementData.quarterly);
      
      if (quarterlyData.length > 0) {
        console.log('📊 Datos trimestrales (convertidos a array):', quarterlyData);
        const latestQuarter = quarterlyData[quarterlyData.length - 1];
        console.log('📊 Último trimestre:', latestQuarter);
        this.lastQuarterRevenue = latestQuarter.totalRevenue || 0;
        this.lastQuarterNetIncome = latestQuarter.netIncome || 0;
        this.profitMargin = this.lastQuarterRevenue
          ? this.lastQuarterNetIncome / this.lastQuarterRevenue
          : 0;
        console.log('Ingresos último trimestre:', this.lastQuarterRevenue);
        console.log('Beneficio neto último trimestre:', this.lastQuarterNetIncome);
      } else {
        console.warn('⚠️ No hay datos trimestrales en el Income Statement.');
      }
    } else {
      console.warn('⚠️ No hay datos trimestrales en el Income Statement.');
    }
  
    // Datos anuales
    if (this.incomeStatementData && this.incomeStatementData.yearly) {
      const yearlyData = Array.isArray(this.incomeStatementData.yearly)
        ? this.incomeStatementData.yearly
        : Object.values(this.incomeStatementData.yearly);
  
      if (yearlyData.length > 0) {
        console.log('📊 Datos anuales (convertidos a array):', yearlyData);
        const latestYear = yearlyData[yearlyData.length - 1];
        console.log('📊 Último año:', latestYear);
        this.lastYearRevenue = latestYear.totalRevenue || 0;
        this.lastYearNetIncome = latestYear.netIncome || 0;
        console.log('Ingresos último año:', this.lastYearRevenue);
        console.log('Beneficio neto último año:', this.lastYearNetIncome);
        this.yearProfitMargin = this.lastYearRevenue
          ? this.lastYearNetIncome / this.lastYearRevenue
          : 0;
      } else {
        console.warn('⚠️ No hay datos anuales en el Income Statement.');
      }
    } else {
      console.warn('⚠️ No hay datos anuales en el Income Statement.');
    }
  }
  
  // Método para obtener el símbolo de la divisa
  getCurrencySymbol(currency: string): string {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return currency;
    }
  }
  
  // Métodos de utilidad para el gráfico y datos históricos
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
  
  getXAxisTicks(): string[] {
    return this.historicalData
      .map(d => d.date)
      .filter((_, index, arr) => index % Math.ceil(arr.length / 6) === 0);
  }
  
  getXPosition(index: number): number {
    const width = 71.88 * 16;
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
      return 0;
    }
    const latestData = historicalData[historicalData.length - 1];
    return latestData.close;
  }
  
  onMouseMove(event: MouseEvent): void {
    if (!this.historicalData.length) return;
    const svgElement = (event.target as HTMLElement).closest('svg') as SVGSVGElement;
    const rect = svgElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const width = 71.88 * 16;
    const step = width / (this.historicalData.length - 1);
    let index = Math.round(mouseX / step);
    if (index < 0) { index = 0; }
    if (index >= this.historicalData.length) { index = this.historicalData.length - 1; }
    const chartData = this.getChartData();
    if (chartData && chartData[index]) {
      const pointData = chartData[index];
      this.tooltipX = pointData.x;
      this.tooltipY = pointData.y;
      this.tooltipValue = pointData.value;
      this.tooltipDate = pointData.date;
      this.tooltipVisible = true;
    }
  }
  
  getChartData() {
    const width = 71.88 * 16;
    const height = 18.75 * 16;
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
  
  getRatioColor(value: number): string {
    let hue: number;
    if (value <= 20) {
      const t = value / 20;
      hue = 120 - t * 60;
    } else if (value <= 50) {
      const t = (value - 20) / 30;
      hue = 60 - t * 60;
    } else {
      hue = 0;
    }
    return `hsl(${hue}, 100%, 40%)`;
  }
  
  // Métodos para el gráfico donut en recomendaciones
  getDonutData(): DonutSegment[] {
    if (!this.analystRecommendations.length) {
      return [];
    }
    const rec = this.analystRecommendations[0];
    const data: DonutSegment[] = [
      { label: 'strong_buy', value: rec.strong_buy, color: this.getRecommendationColor('strong_buy') },
      { label: 'buy', value: rec.buy, color: this.getRecommendationColor('buy') },
      { label: 'hold', value: rec.hold, color: this.getRecommendationColor('hold') },
      { label: 'sell', value: rec.sell, color: this.getRecommendationColor('sell') },
      { label: 'strong_sell', value: rec.strong_sell, color: this.getRecommendationColor('strong_sell') },
    ];
    const total = data.reduce((sum, d) => sum + d.value, 0);
    data.forEach(d => d.percent = total ? (d.value / total) : 0);
    return data;
  }
  
  calculateDonutOffset(index: number): number {
    const segments = this.getDonutData();
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += (segments[i]?.percent ?? 0) * 100;
    }
    return 25 - offset;
  }
}

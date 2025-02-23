import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HistoricalData {
date: string;
close: number;
}

@Component({
selector: 'app-stock-chart',
standalone: true,
imports: [CommonModule],
template: `
    <div class="chart-wrapper" *ngIf="filteredData.length">
    <div class="chart-container" (mousemove)="onMouseMove($event)" (mouseleave)="hideTooltip()">
        
        <!-- Botones de selección de modo -->
        <div class="mode-selector" (mouseenter)="hideTooltip()">
            <button [class.active]="chartMode === 'absolute'" (click)="setChartMode('absolute')">3000 días</button>
            <button [class.active]="chartMode === 'fiveYears'" (click)="setChartMode('fiveYears')">5 Años</button>
            <button [class.active]="chartMode === 'threeYears'" (click)="setChartMode('threeYears')">3 Años</button>
            <button [class.active]="chartMode === 'lastYear'" (click)="setChartMode('lastYear')">1 Año</button>
            <button [class.active]="chartMode === 'currentYear'" (click)="setChartMode('currentYear')">Año actual</button>
        </div>
        
        <!-- Valores máximos y mínimos a la izquierda del gráfico -->
        <div class="chart-values">
            <span class="chart-max">MAX:<br>{{ maxValue | number:'1.2-2' }}</span>
            <span class="chart-min">MIN:<br>{{ minValue | number:'1.2-2' }}</span>
        </div>
        
        <svg width="71.88rem" height="18.75rem" class="chart">
            <rect x="0" y="0" width="71.88rem" height="18.75rem" fill="transparent"></rect>
            <polygon [attr.points]="getChartPoints(true)" fill="rgba(40, 167, 69, 0.3)"></polygon>
            <polyline [attr.points]="getChartPoints()" fill="none" stroke="#28a745" stroke-width="0.125rem"></polyline>
        </svg>
        
        <!-- Etiqueta de valor actual en el final del gráfico -->
        <div class="current-value-label"
            [style.left.px]="lastChartData.x"
            [style.top.px]="lastChartData.y">
            VAL:<br>
            {{ currentValue | number:'1.2-2' }}
        </div>
        
        <div class="tooltip" *ngIf="tooltipVisible"
            [style.left.px]="tooltipX"
            [style.top.px]="tooltipY">
            <div class="tooltip-content">
            <strong>{{ tooltipDate }}</strong><br>
            {{ tooltipValue | number:'1.2-2' }}
            </div>
        </div>
        
        <!-- Fechas en la parte inferior del gráfico -->
        <div class="chart-dates">
            <span *ngFor="let tick of getXAxisTicks()"
                [style.left.px]="getXPosition(tick.index)"
                class="date-label">
            {{ tick.date | date:'yyyy' }}
            </span>
        </div>
    </div>
    </div>
`,
styles: [`
    .chart-wrapper { display: flex; justify-content: center; }
    .chart-container { position: relative; width: 71.88rem; }
    .chart { display: block; border: 0.0625rem solid #333; }
    
    /* Contenedor para fechas (eje X) */
    .chart-dates {
    position: relative;
    width: 71.88rem;
    height: 1.5rem;
    margin: 0 auto;
    }
    .date-label { 
    position: absolute; 
    top: 0; 
    font-size: 0.75rem; 
    }
    .date-label:not(:first-child):not(:last-child) { 
    transform: translateX(-50%); 
    }
    .date-label:first-child { 
    transform: translateX(0%); 
    }
    .date-label:last-child { 
    transform: translateX(-100%); 
    }
    
    /* Tooltip styling */
    .tooltip {
    position: absolute;
    pointer-events: none;
    transform: translate(-50%, -100%);
    z-index: 10;
    }
    .tooltip-content {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.5rem;
    font-size: 0.75rem;
    border-radius: 0.25rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    white-space: nowrap;
    }
    
    /* Estilos para los botones de selección */
    .mode-selector {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 20;
    display: flex;
    gap: 0.25rem;
    background-color: #f8f9fa;
    padding: 0.25rem;
    border: 1px solid black;
    border-bottom-right-radius: 0.5rem;
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
    }
    .mode-selector button {
    background-color: white;
    color: #333;
    padding: 0.25rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    cursor: pointer;
    }
    .mode-selector button:hover {
    background-color: #f8f9fa;
    }
    .mode-selector button.active {
    background-color: #28a745;
    color: white;
    border-color: #28a745;
    }
    
    /* Estilos para mostrar los valores máximos y mínimos */
    .chart-values {
    font-family: Arial, sans-serif;
    height: 19rem;
    position: absolute;
    left: -50px; 
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #333;
    }
    
    /* Estilos para la etiqueta del valor actual en el final del gráfico */
    .current-value-label {
    position: absolute;
    font-family: Arial, sans-serif;
    font-size: 0.75rem;
    color: #333;
    /* Opcional: un pequeño margen para separarlo del gráfico */
    transform: translate(5px, -50%);
    white-space: nowrap;
    }
`]
})
export class StockChartComponent {
@Input() historicalData: HistoricalData[] = [];

// Modos de visualización
chartMode: 'absolute' | 'lastYear' | 'threeYears' | 'fiveYears' | 'currentYear' = 'absolute';

tooltipVisible = false;
tooltipX = 0;
tooltipY = 0;
tooltipValue = 0;
tooltipDate = '';

setChartMode(mode: 'absolute' | 'lastYear' | 'threeYears' | 'fiveYears' | 'currentYear'): void {
    this.chartMode = mode;
}

get filteredData(): HistoricalData[] {
    if (!this.historicalData.length) return [];
    const lastDate = new Date(this.historicalData[this.historicalData.length - 1].date);
    let fromDate: Date | null = null;

    if (this.chartMode === 'lastYear') {
        fromDate = new Date(lastDate);
        fromDate.setFullYear(fromDate.getFullYear() - 1);
    } else if (this.chartMode === 'threeYears') {
        fromDate = new Date(lastDate);
        fromDate.setFullYear(fromDate.getFullYear() - 3);
    } else if (this.chartMode === 'fiveYears') {
        fromDate = new Date(lastDate);
        fromDate.setFullYear(fromDate.getFullYear() - 5);
    } else if (this.chartMode === 'currentYear') {
        const currentYear = new Date().getFullYear();
        return this.historicalData.filter(d => new Date(d.date).getFullYear() === currentYear);
    }

    return fromDate ? this.historicalData.filter(d => new Date(d.date) >= fromDate) : this.historicalData;
}

// Getter para obtener el valor máximo
get maxValue(): number {
    return Math.max(...this.filteredData.map(d => d.close));
}

// Getter para obtener el valor mínimo
get minValue(): number {
    return Math.min(...this.filteredData.map(d => d.close));
}

// Getter para obtener el valor actual (último dato)
get currentValue(): number {
    return this.filteredData.length ? this.filteredData[this.filteredData.length - 1].close : 0;
}

getChartPoints(fill: boolean = false): string {
    const data = this.filteredData;
    if (!data.length) return '';
    const width = 71.88 * 16;
    const height = 18.75 * 16;
    const min = Math.min(...data.map(d => d.close));
    const max = Math.max(...data.map(d => d.close));
    const range = max - min;
    const step = width / (data.length - 1);
    const points = data.map((d, index) => {
        const x = index * step;
        const y = height - ((d.close - min) / range * height);
        return `${x},${y}`;
    });
    if (fill) {
        points.push(`${width},${height}`, `0,${height}`);
    }
    return points.join(' ');
}

// Devuelve un array de ticks con la fecha y su índice, basados en el cambio de año.
getXAxisTicks(): { date: string, index: number }[] {
    const data = this.filteredData;
    const ticks: { date: string, index: number }[] = [];
    let prevYear: number | null = null;
    data.forEach((d, i) => {
        const currentYear = new Date(d.date).getFullYear();
        if (prevYear === null || currentYear !== prevYear) {
            ticks.push({ date: d.date, index: i });
            prevYear = currentYear;
        }
    });

    // En modo 'absolute', evitamos que se amontonen ticks a la izquierda.
    if (this.chartMode === 'absolute') {
        const threshold = 50;
        const leftTicks = ticks.filter(t => this.getXPosition(t.index) < threshold);
        if (leftTicks.length > 1) {
            const maxXTick = leftTicks.reduce((prev, curr) =>
                this.getXPosition(curr.index) > this.getXPosition(prev.index) ? curr : prev
            );
            const remainingTicks = ticks.filter(t => this.getXPosition(t.index) >= threshold);
            return [maxXTick, ...remainingTicks];
        }
    }
    
    return ticks;
}

// Calcula la posición X basada en el índice real del dato en filteredData.
getXPosition(dataIndex: number): number {
    const width = 71.88 * 16;
    const step = width / (this.filteredData.length - 1);
    return dataIndex * step;
}

// Getter que devuelve las coordenadas del último punto del gráfico.
get lastChartData(): { x: number, y: number, value: number, date: string } {
    const data = this.getChartData();
    return data.length ? data[data.length - 1] : { x: 0, y: 0, value: 0, date: '' };
}

getChartData() {
    const data = this.filteredData;
    const width = 71.88 * 16;
    const height = 18.75 * 16;
    const min = Math.min(...data.map(d => d.close));
    const max = Math.max(...data.map(d => d.close));
    const range = max - min;
    const step = width / (data.length - 1);
    return data.map((d, index) => ({
        x: index * step,
        y: height - ((d.close - min) / range * height),
        value: d.close,
        date: d.date
    }));
}

onMouseMove(event: MouseEvent): void {
    const data = this.filteredData;
    if (!data.length) return;
    const svg = (event.target as HTMLElement).closest('svg') as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const width = 71.88 * 16;
    const step = width / (data.length - 1);
    let index = Math.round(mouseX / step);
    if (index < 0) { index = 0; }
    if (index >= data.length) { index = data.length - 1; }
    const chartData = this.getChartData();
    if (chartData[index]) {
        const point = chartData[index];
        this.tooltipX = event.clientX - rect.left;
        this.tooltipY = event.clientY - rect.top - 10;
        this.tooltipValue = point.value;
        this.tooltipDate = point.date;
        this.tooltipVisible = true;
    }
}

hideTooltip(): void {
    this.tooltipVisible = false;
}
}

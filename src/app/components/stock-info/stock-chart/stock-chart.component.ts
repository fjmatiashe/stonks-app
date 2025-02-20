// stock-chart.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface HistoricalData {
date: string;
close: number;
}

@Component({
selector: 'app-stock-chart',
standalone: true,
imports: [CommonModule, FormsModule],
template: `
    <!-- Selector de modo -->
    <div class="chart-mode-selector">
    <label>
        <input type="radio" name="chartMode" value="absolute" [(ngModel)]="chartMode">
        3000 días
    </label>
    &nbsp;&nbsp;
    <label>
        <input type="radio" name="chartMode" value="lastYear" [(ngModel)]="chartMode">
        Último Año
    </label>
    </div>
    <!-- Gráfico -->
    <div class="chart-wrapper" *ngIf="filteredData.length">
    <div class="chart-container">
        <svg width="71.88rem" height="18.75rem" class="chart"
            (mousemove)="onMouseMove($event)" (mouseleave)="hideTooltip()">
        <rect x="0" y="0" width="71.88rem" height="18.75rem" fill="transparent"></rect>
        <polygon [attr.points]="getChartPoints(true)" fill="rgba(40, 167, 69, 0.3)"></polygon>
        <polyline [attr.points]="getChartPoints()" fill="none" stroke="#28a745" stroke-width="0.125rem"></polyline>
        <g *ngIf="tooltipVisible">
            <rect [attr.x]="tooltipX - 3.125" [attr.y]="tooltipY - 3.125"
                width="6.25rem" height="1.875rem" fill="white" stroke="black"></rect>
            <text [attr.x]="tooltipX + 47" [attr.y]="tooltipY + 16" font-size="0.75rem" text-anchor="middle">
            {{ tooltipDate }}: {{ tooltipValue | number:'1.2-2' }}
            </text>
        </g>
        </svg>
        <!-- Fechas debajo del gráfico -->
        <div class="chart-dates">
        <span *ngFor="let tick of getXAxisTicks(); let i = index"
                [style.left.px]="getXPosition(i)"
                class="date-label">
            {{ tick }}
        </span>
        </div>
    </div>
    </div>
`,
styles: [`
    .chart-mode-selector { text-align: center; margin-bottom: 1rem; font-size: 0.875rem; }
    .chart-wrapper { display: flex; justify-content: center; }
    .chart-container { position: relative; width: 71.88rem; }
    .chart { display: block; border: 0.0625rem solid #333; }
    .chart-dates { position: relative; width: 71.88rem; height: 1.5rem; margin: 0 auto; }
    .date-label { position: absolute; top: 0; transform: translateX(-50%); font-size: 0.75rem; }
`]
})
export class StockChartComponent {
// ¡Agrega el decorador @Input() para que el componente reconozca el binding!
@Input() historicalData: HistoricalData[] = [];

// Modo del gráfico: 'absolute' o 'lastYear'
chartMode: 'absolute' | 'lastYear' = 'absolute';

tooltipVisible = false;
tooltipX = 0;
tooltipY = 0;
tooltipValue = 0;
tooltipDate = '';

get filteredData(): HistoricalData[] {
    if (this.chartMode === 'lastYear' && this.historicalData.length) {
    const lastDate = new Date(this.historicalData[this.historicalData.length - 1].date);
    const oneYearAgo = new Date(lastDate);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return this.historicalData.filter(d => new Date(d.date) >= oneYearAgo);
    }
    return this.historicalData;
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

getXAxisTicks(): string[] {
    const data = this.filteredData;
    return data.map(d => d.date)
            .filter((_, index, arr) => index % Math.ceil(arr.length / 6) === 0);
}

getXPosition(index: number): number {
    const width = 71.88 * 16;
    const ticks = this.getXAxisTicks();
    const step = width / (ticks.length - 1);
    return index * step;
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
    this.tooltipX = point.x;
    this.tooltipY = point.y;
    this.tooltipValue = point.value;
    this.tooltipDate = point.date;
    this.tooltipVisible = true;
    }
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

hideTooltip(): void {
    this.tooltipVisible = false;
}
}

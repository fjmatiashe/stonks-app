// historical-data.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoricalData } from '../stock-chart/stock-chart.component';

@Component({
selector: 'app-historical-data',
standalone: true,
imports: [CommonModule],
template: `
    <div class="historical" *ngIf="recentData.length">
    <h2>Últimos días</h2>
    <ng-container *ngIf="recentData.length; else noDataTpl">
        <div *ngFor="let data of recentData">
        <p>{{ data.date }} - Cierre: {{ data.close | number:'1.2-2' }}</p>
        <hr />
        </div>
    </ng-container>
    <ng-template #noDataTpl>
        <p>No hay datos disponibles.</p>
    </ng-template>
    </div>
`,
styles: [`
    .historical {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    width: 18rem;
    height: 20rem;
    }
    h2 { text-align: center; }
`]
})
export class HistoricalDataComponent {
@Input() historicalData: HistoricalData[] = [];

get recentData(): HistoricalData[] {
    return this.historicalData.length < 5
    ? [...this.historicalData].reverse()
    : this.historicalData.slice(-5).reverse();
}
}

// fundamentals.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
selector: 'app-fundamentals',
standalone: true,
imports: [CommonModule],
template: `
    <div class="fundamentals" *ngIf="incomeStatementData">
    <h2>Datos Fundamentales</h2>
    <div class="fundamentals-grid">
        <div class="fundamentals-col">
        <h3>Trimestral</h3>
        <p>EPS: {{ computedEPS | number:'1.2-2' }}</p>
        <p>Ingr: {{ getCurrencySymbol(incomeStatementData.currency) }}{{ lastQuarterRevenue | number:'1.2-2' }}</p>
        <p>BN: {{ getCurrencySymbol(incomeStatementData.currency) }}{{ lastQuarterNetIncome | number:'1.2-2' }}</p>
        <p *ngIf="profitMargin">Margen: {{ profitMargin | percent:'1.2-2' }}</p>
        </div>
        <div class="fundamentals-col">
        <h3>Anual</h3>
        <p>EPS: {{ computedYearEPS | number:'1.2-2' }}</p>
        <p>Ingr: {{ getCurrencySymbol(incomeStatementData.currency) }}{{ lastYearRevenue | number:'1.2-2' }}</p>
        <p>BN: {{ getCurrencySymbol(incomeStatementData.currency) }}{{ lastYearNetIncome | number:'1.2-2' }}</p>
        <p *ngIf="yearProfitMargin">Margen: {{ yearProfitMargin | percent:'1.2-2' }}</p>
        </div>
    </div>
    <p class="per">
        <span [style.color]="getRatioColor(perRatio)">PER: {{ perRatio | number:'1.2-2' }}</span>
        &nbsp;|&nbsp;
        <span [style.color]="getRatioColor(forwardPerRatio)">Forward PER: {{ forwardPerRatio | number:'1.2-2' }}</span>
    </p>
    </div>
`,
styles: [`
    .fundamentals { 
        padding: 0.5rem; 
        border: 1px solid #ddd; 
        border-radius: 5px; 
        width: 27.6rem;
        height: 20rem;
    }
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
    .per { text-align: center; }
`]
})
export class FundamentalsComponent {
@Input() incomeStatementData: any;
@Input() computedEPS: number = 0;
@Input() computedYearEPS: number = 0;
@Input() perRatio: number = 0;
@Input() forwardPerRatio: number = 0;
@Input() profitMargin: number = 0;
@Input() yearProfitMargin: number = 0;
@Input() lastQuarterRevenue: number = 0;
@Input() lastQuarterNetIncome: number = 0;
@Input() lastYearRevenue: number = 0;
@Input() lastYearNetIncome: number = 0;

getCurrencySymbol(currency: string): string {
    switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return currency;
    }
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
}

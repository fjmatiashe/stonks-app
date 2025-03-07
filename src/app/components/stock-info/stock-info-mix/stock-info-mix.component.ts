// stock-info-mix.component.ts
import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AlphaVantageService } from '../../../services/api.service';

import { StockChartComponent, HistoricalData } from '../stock-chart/stock-chart.component';
import { HistoricalDataComponent } from '../historical-data/historical-data.component';
import { AnalystRecommendationsComponent } from '../analyst-recommendations/analyst-recommendations.component';
import { FundamentalsComponent } from '../fundamental-data/fundamentals.component';

@Component({
selector: 'app-stock-info-mix',
standalone: true,
imports: [CommonModule, FormsModule, StockChartComponent, HistoricalDataComponent, AnalystRecommendationsComponent, FundamentalsComponent],
template: `
    <h1 class="title">{{ stockName || 'Apple Inc.' }}</h1>
    <!-- Gráfico -->
    <app-stock-chart [historicalData]="historicalData"></app-stock-chart>
    <!-- Columnas de datos -->
    <div class="data-columns">
    <app-historical-data [historicalData]="historicalData"></app-historical-data>
    <app-analyst-recommendations [recommendation]="analystRecommendation"></app-analyst-recommendations>
    <app-fundamentals
        [incomeStatementData]="incomeStatementData"
        [computedEPS]="computedEPS"
        [computedYearEPS]="computedYearEPS"
        [perRatio]="perRatio"
        [forwardPerRatio]="forwardPerRatio"
        [profitMargin]="profitMargin"
        [yearProfitMargin]="yearProfitMargin"
        [lastQuarterRevenue]="lastQuarterRevenue"
        [lastQuarterNetIncome]="lastQuarterNetIncome"
        [lastYearRevenue]="lastYearRevenue"
        [lastYearNetIncome]="lastYearNetIncome"
    ></app-fundamentals>
    </div>
    <ng-container *ngIf="errorMessage">
    <p class="error">{{ errorMessage }}</p>
    </ng-container>
`,
styles: [`
    h1 { text-align: center; font-family: Arial, sans-serif;}
    .title { text-align: center; }
    .data-columns {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1rem;
    font-family: Arial, sans-serif;
    }
    .error { color: red; font-weight: bold; text-align: center; }
`]
})
export class StockInfoMixComponent implements OnInit, OnChanges {

    @Input() ticker: string = '';
    @Input() stockName: string = '';

historicalData: HistoricalData[] = [];
errorMessage = '';
analystRecommendation: any = null;

// Datos fundamentales
incomeStatementData: any;
computedEPS = 0;
computedYearEPS = 0;
perRatio = 0;
forwardPerRatio = 0;
profitMargin = 0;
yearProfitMargin = 0;
lastQuarterRevenue = 0;
lastQuarterNetIncome = 0;
lastYearRevenue = 0;
lastYearNetIncome = 0;

constructor(private stockService: AlphaVantageService) {}

ngOnInit(): void {
    }

ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticker'] && changes['ticker'].currentValue) {
        const nuevoTicker = changes['ticker'].currentValue.trim();
        this.ticker = nuevoTicker || '';
        this.onSearch();
}
}

onSearch(): void {
    // Reiniciar datos
    this.errorMessage = '';
    this.historicalData = [];
    this.analystRecommendation = null;
    this.incomeStatementData = null;
    this.computedEPS = 0;
    this.computedYearEPS = 0;
    this.perRatio = 0;
    this.forwardPerRatio = 0;
    this.profitMargin = 0;
    this.yearProfitMargin = 0;
    this.lastQuarterRevenue = 0;
    this.lastQuarterNetIncome = 0;
    this.lastYearRevenue = 0;
    this.lastYearNetIncome = 0;

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
        // Datos históricos
        if (Array.isArray(data.historical) && data.historical.length > 0) {
        this.historicalData = data.historical.map(item => ({
            date: new Date(item.t * 1000).toISOString().split('T')[0],
            close: item.c,
        }));
        this.historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } else {
        this.errorMessage = 'No hay datos históricos disponibles';
        }

        // Fundamentales
        this.incomeStatementData = data.fundamentals.incomeStatement;
        this.calculateFundamentals(data.fundamentals.epsHistorical, data.fundamentals.epsTrends);

        // Recomendaciones
        const recData = data.recommendations;
        if (recData && recData.records && Array.isArray(recData.records) && recData.records.length > 0) {
        const record = recData.records[0];
        this.analystRecommendation = {
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
        } else {
        this.analystRecommendation = null;
        }
    },
    error: (err) => {
        console.error('Error al obtener datos', err);
        this.errorMessage = 'Error al cargar los datos.';
    }
    });
}

calculateFundamentals(epsHistoricalData: any, epsTrendsData: any): void {
    const epsArray = Array.isArray(epsHistoricalData)
    ? epsHistoricalData : Object.values(epsHistoricalData || {});
    if (epsArray.length > 0) {
    const latestEPS = epsArray[2];
    this.computedEPS = latestEPS.epsActual;
    if (epsArray.length >= 6) {
        this.computedYearEPS = epsArray[2].epsActual + epsArray[3].epsActual +
                            epsArray[4].epsActual + epsArray[5].epsActual;
    }
    const currentPrice = this.historicalData[this.historicalData.length - 1].close;
    this.perRatio = this.computedYearEPS !== 0 ? currentPrice / this.computedYearEPS : 0;
    }

    const currentPrice = this.historicalData[this.historicalData.length - 1].close;
    const epsTrendsArray = Array.isArray(epsTrendsData) ? epsTrendsData : Object.values(epsTrendsData || {});
    const fourthRecord = epsTrendsArray[3];
    if (fourthRecord) {
    const entries = Object.entries(fourthRecord);
    const sortedEntries = entries.sort(
        ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
    const fourMostRecent = sortedEntries.slice(0, 4).map(([, rec]) => rec);
    const forwardEPS: number = fourMostRecent.reduce(
        (sum: number, item: any) => sum + (item.epsTrendCurrent || 0),
        0
    );
    this.forwardPerRatio = forwardEPS !== 0 ? currentPrice / forwardEPS : 0;
    }

    if (this.incomeStatementData && this.incomeStatementData.quarterly) {
    const quarterly = Array.isArray(this.incomeStatementData.quarterly)
                        ? this.incomeStatementData.quarterly
                        : Object.values(this.incomeStatementData.quarterly);
    if (quarterly.length > 0) {
        const latestQuarter = quarterly[quarterly.length - 1];
        this.lastQuarterRevenue = latestQuarter.totalRevenue || 0;
        this.lastQuarterNetIncome = latestQuarter.netIncome || 0;
        this.profitMargin = this.lastQuarterRevenue ? this.lastQuarterNetIncome / this.lastQuarterRevenue : 0;
    }
    }

    if (this.incomeStatementData && this.incomeStatementData.yearly) {
    const yearly = Array.isArray(this.incomeStatementData.yearly)
                    ? this.incomeStatementData.yearly
                    : Object.values(this.incomeStatementData.yearly);
    if (yearly.length > 0) {
        const latestYear = yearly[yearly.length - 1];
        this.lastYearRevenue = latestYear.totalRevenue || 0;
        this.lastYearNetIncome = latestYear.netIncome || 0;
        this.yearProfitMargin = this.lastYearRevenue ? this.lastYearNetIncome / this.lastYearRevenue : 0;
    }
    }
}
}

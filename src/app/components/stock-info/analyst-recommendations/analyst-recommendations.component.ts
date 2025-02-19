// analyst-recommendations.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DonutSegment {
label: string;
value: number;
color: string;
percent?: any;
}

@Component({
selector: 'app-analyst-recommendations',
standalone: true,
imports: [CommonModule],
template: `
    <div class="recommendations" *ngIf="recommendation">
    <h2>Opinión de Analistas</h2>
    <div class="recommendations-content" *ngIf="recommendation; else noRecTpl">
        <div class="recommendations-donut">
        <svg width="150" height="150" viewBox="0 0 42 42" class="donut">
            <circle class="donut-hole" cx="21" cy="21" r="15.91549431" fill="#fff"></circle>
            <circle class="donut-ring" cx="21" cy="21" r="15.91549431" fill="transparent" stroke="#d2d3d4" stroke-width="3"></circle>
            <ng-container *ngFor="let segment of donutData; let i = index">
            <circle class="donut-segment" cx="21" cy="21" r="15.91549431"
                [attr.stroke]="segment.color" stroke-width="3" fill="transparent"
                [attr.stroke-dasharray]="(segment.percent * 100) + ' ' + (100 - segment.percent * 100)"
                [attr.stroke-dashoffset]="calculateDonutOffset(i)">
            </circle>
            </ng-container>
            <text x="50%" y="40%" text-anchor="middle" dy=".3em" class="sri" transform="rotate(90 21 21)">
            SRI
            </text>
            <text x="50%" y="60%" text-anchor="middle" dy=".3em" class="sri" transform="rotate(90 21 21)">
            {{ recommendation.sri | number:'1.3-3' }}
            </text>
        </svg>
        </div>
        <div class="recommendations-stats">
        <div class="stat">
            <span class="label" [style.color]="getRecommendationColor('strong_buy')">Strong Buy</span>
            <span class="value">{{ recommendation.strong_buy }}</span>
        </div>
        <div class="stat">
            <span class="label" [style.color]="getRecommendationColor('buy')">Buy</span>
            <span class="value">{{ recommendation.buy }}</span>
        </div>
        <div class="stat">
            <span class="label" [style.color]="getRecommendationColor('hold')">Hold</span>
            <span class="value">{{ recommendation.hold }}</span>
        </div>
        <div class="stat">
            <span class="label" [style.color]="getRecommendationColor('sell')">Sell</span>
            <span class="value">{{ recommendation.sell }}</span>
        </div>
        <div class="stat">
            <span class="label" [style.color]="getRecommendationColor('strong_sell')">Strong Sell</span>
            <span class="value">{{ recommendation.strong_sell }}</span>
        </div>
        <div class="period">
            Periodo: {{ recommendation.period * 1000 | date:'dd/MM/yyyy' }}
        </div>
        </div>
    </div>
    <ng-template #noRecTpl>
        <p>No hay recomendaciones disponibles.</p>
    </ng-template>
    </div>
`,
styles: [`
    .recommendations {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    text-align: center;
    width: 24rem;
    height: 20rem;
    }
    .recommendations-content {
    padding: 2rem 0rem;
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
    .donut { transform: rotate(-90deg); }
    .sri { font-size: 0.4rem; font-weight: bold; fill: #000; }
    .recommendations-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
    }
    .stat { display: flex; justify-content: space-between; width: 150px; }
    .period { font-size: 0.85rem; margin-top: 0.5rem; }
`]
})
export class AnalystRecommendationsComponent {
@Input() recommendation: any;

get donutData(): DonutSegment[] {
    if (!this.recommendation) return [];
    const data: DonutSegment[] = [
    { label: 'strong_buy', value: this.recommendation.strong_buy, color: this.getRecommendationColor('strong_buy') },
    { label: 'buy', value: this.recommendation.buy, color: this.getRecommendationColor('buy') },
    { label: 'hold', value: this.recommendation.hold, color: this.getRecommendationColor('hold') },
    { label: 'sell', value: this.recommendation.sell, color: this.getRecommendationColor('sell') },
    { label: 'strong_sell', value: this.recommendation.strong_sell, color: this.getRecommendationColor('strong_sell') },
    ];
    const total = data.reduce((sum, d) => sum + d.value, 0);
    data.forEach(d => d.percent = total ? (d.value / total) : 0);
    return data;
}

calculateDonutOffset(index: number): number {
    const segments = this.donutData;
    let offset = 0;
    for (let i = 0; i < index; i++) {
    offset += (segments[i]?.percent || 0) * 100;
    }
    return 25 - offset;
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
}

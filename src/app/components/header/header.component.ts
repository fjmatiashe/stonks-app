import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <h1>LOS STONKS</h1>
      <nav>
        <button (click)="onNavigate('stocks')">BUSCADOR MIX</button>
        <button (click)="onNavigate('portfolios')">CARTERAS DE DATAROMA</button>
        <button (click)="onNavigate('markets')">MERCADOS</button>
        <button (click)="onNavigate('about')">SOBRE MI</button>
      </nav>
    </header>
  `,
  styles: [
    `.header { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 2.5rem; background: #333; color: white; }
      nav button { margin: 0 10px; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer; background: #555; color: white; }
      nav button:hover { background: #777; }`
  ]
})
export class HeaderComponent {
  @Output() navigate = new EventEmitter<string>(); 

  onNavigate(view: string) {
    this.navigate.emit(view);
  }
}

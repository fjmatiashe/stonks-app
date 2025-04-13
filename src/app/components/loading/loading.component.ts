// splash.component.ts
import { Component } from '@angular/core';

@Component({
selector: 'app-splash',
template: `
    <div class="splash">
    <h2>Iniciando el scrapper...</h2>
    <p>Esto puede tardar unos segundos.</p>
    <!-- Aquí puedes agregar un spinner o barra de progreso -->
    </div>
`,
styles: [`
    .splash {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f5f5f5;
    font-family: Arial, sans-serif;
    }
`]
})
export class SplashComponent {}

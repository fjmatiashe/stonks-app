import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about-me',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Sobre mí</h1>
    <img alt="Foto de perfil" src="https://github.com/fjmatiash.png" />

    <div class="card" (click)="toggleDescription()" [class.flipped]="!description">
      <div class="card-inner">
        <div class="card-front">
          <p *ngIf="description">
            ¡Hola! Mi nombre es <b>Francisco Javier Matías Hernández</b>. Soy un ingeniero de frontend apasionado por la tecnología y los mercados financieros. Combinando mi experiencia en desarrollo web con mi interés por la bolsa, he creado esta web para compartir información, herramientas y análisis que puedan ayudar a otros a entender mejor el mundo de las inversiones. Mi objetivo es hacer que los datos sean accesibles y presentarlos de una manera clara e intuitiva.
          </p>
        </div>

        <div class="card-back">
          <p *ngIf="!description">
            <b>Estudios:</b>
            <br> • Doble Grado en ADET e Ingeniería Informática en la UPSA, combinando estrategia empresarial con desarrollo tecnológico. Adquirí conocimientos en gestión financiera, optimización de recursos y diseño de software eficiente.
            <br><br> <b>Experiencia:</b>
            <br>• Librería de componentes con Lit y NX, creando soluciones reutilizables y escalables.
            <br>• Aplicaciones internas con React + Next.js, optimizando flujos de trabajo.
            <br>• Cotizador de seguros en Angular, desarrollando interfaces intuitivas y eficientes.
          </p>
        </div>
      </div>
      <!-- Icono de Lucide que indica que la tarjeta es clicable -->
      <div class="flip-indicator">
        <svg xmlns="http://www.w3.org/2000/svg" class="flip-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0114.53-3.36L23 10"></path>
        </svg>
      </div>
    </div>
    <div class="spacer"></div>
  `,
  styles: [
    `
    h1 {
      text-align: center;
      font-family: Arial, sans-serif;
    }
    p {
      margin: 2rem auto;
      font-family: Arial, sans-serif;
      font-size: 1.2rem;
      line-height: 1.6;
    }
    img {
      border-radius: 50%;
      width: 5rem;
      height: 5rem;
      margin: 0 auto;
      display: block;
    }
    .card {
      margin-top: 2rem;
      cursor: pointer;
      height: 15.625rem;
      width: 100%;
      perspective: 75rem;
      position: relative;
    }
    .card-inner {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.8s ease-in-out;
    }
    /* Se rota la tarjeta cuando se aplica la clase "flipped" */
    .flipped .card-inner {
      transform: rotateY(180deg);
    }
    .card-front, .card-back {
      width: 100%;
      height: 100%;
      position: absolute;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.25rem .5rem;
      background: #fff;
      border-radius: .625rem;
      box-shadow: 0 .25rem .5rem rgba(0, 0, 0, 0.2);
    }
    .card-back {
      transform: rotateY(180deg);
    }
    /* Icono indicador de giro */
    .flip-indicator {
      position: absolute;
      bottom: .625rem;
      right: .625rem;
      pointer-events: none;
      transition: transform 0.8s ease-in-out;
    }
    .flipped .flip-indicator {
      transform: rotate(180deg);
    }
    .flip-icon {
      width: 1.5rem;
      height: 1.5rem;
    }
    .spacer {
      height: 3.125rem;
    }
    `
  ]
})
export class AboutMeComponent {
  description = true;

  toggleDescription() {
    this.description = !this.description;
  }
}

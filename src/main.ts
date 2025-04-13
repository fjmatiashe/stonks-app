import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';
import { AppComponent } from './app/app.component';
import { CarteraService } from './app/services/server.service';

function initializeAnalysts(carteraService: CarteraService) {
  return () => carteraService.getFullAnalysts().toPromise();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAnalysts,
      deps: [CarteraService],
      multi: true
    }
  ]
});

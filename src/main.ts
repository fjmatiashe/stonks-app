import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';
import { AppComponent } from './app/app.component';
import { CarteraService } from './app/services/server.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient()
  ]
});

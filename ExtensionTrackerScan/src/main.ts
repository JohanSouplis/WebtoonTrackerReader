import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/angular/app.config';
import { AppComponent } from './app/angular/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/angular/app.config';
import { AppShellPage } from './app/angular/shell/ui/pages/app-shell/app-shell.page';

bootstrapApplication(AppShellPage, appConfig).catch((err) =>
  console.error(err),
);

import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

const rowsPaginatorIntl = (): MatPaginatorIntl => {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Rows per page';
  intl.getRangeLabel = (page, size, length) =>
    length === 0
      ? '0 of 0'
      : `${page * size + 1}–${Math.min(length, (page + 1) * size)} of ${length}`;
  return intl;
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideAnimationsAsync(
      matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'noop'
        : 'animations',
    ),
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass(
        'material-symbols-rounded',
      );
    }),
    { provide: MatPaginatorIntl, useFactory: rowsPaginatorIntl },
  ],
};

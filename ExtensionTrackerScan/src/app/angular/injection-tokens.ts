import { InjectionToken } from '@angular/core';
import { FullPageNavigatorPort } from './shell/service/full-page-navigator.port';

export const FULL_PAGE_NAVIGATOR = new InjectionToken<FullPageNavigatorPort>(
  'FullPageNavigatorPort',
);

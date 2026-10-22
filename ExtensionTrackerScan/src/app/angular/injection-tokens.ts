import { InjectionToken } from '@angular/core';
import { ScanRepository } from '../core/ports/scan-repository.port';
import { FullPageNavigatorPort } from './shell/service/full-page-navigator.port';

export const FULL_PAGE_NAVIGATOR = new InjectionToken<FullPageNavigatorPort>(
  'FullPageNavigatorPort',
);

export const SCAN_REPOSITORY = new InjectionToken<ScanRepository>(
  'ScanRepository',
);

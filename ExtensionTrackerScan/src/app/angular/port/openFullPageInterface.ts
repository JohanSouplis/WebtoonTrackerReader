import { InjectionToken } from '@angular/core';

export interface NavigatorHandler {
  openFullPage(): void;
}

export const NAVIGATOR_HANDLER_TOKEN = new InjectionToken<NavigatorHandler>(
  'NavigatorHandler'
);

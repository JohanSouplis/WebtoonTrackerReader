import { Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FULL_PAGE_NAVIGATOR } from '../injection-tokens';
import { ChromeFullPageNavigator } from './gateways/chrome-full-page-navigator.gateway';
import { InMemoryFullPageNavigator } from './gateways/in-memory-full-page-navigator.gateway';

export const SHELL_PROVIDERS: Provider[] = [
  {
    provide: FULL_PAGE_NAVIGATOR,
    useFactory: () =>
      environment.production
        ? new ChromeFullPageNavigator()
        : new InMemoryFullPageNavigator(),
  },
];

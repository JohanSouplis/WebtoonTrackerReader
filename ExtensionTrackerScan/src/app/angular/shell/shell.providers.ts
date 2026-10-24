import { ErrorHandler, inject, Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ChromeRuntimeTelemetryRecorder } from '../../core/gateways/chrome-runtime-telemetry-recorder.gateway';
import { ChromeStorageRatePromptRepository } from '../../core/gateways/chrome-storage-rate-prompt-repository.gateway';
import { ChromeStorageSeriesSuggestionsRepository } from '../../core/gateways/chrome-storage-series-suggestions-repository.gateway';
import { DEV_DUE_RATE_PROMPT } from '../../core/gateways/in-memory/dev-rate-prompt';
import { DEV_SERIES_SUGGESTIONS } from '../../core/gateways/in-memory/dev-series-suggestions';
import { InMemoryRatePromptRepository } from '../../core/gateways/in-memory/in-memory-rate-prompt-repository.gateway';
import { InMemorySeriesSuggestionsRepository } from '../../core/gateways/in-memory/in-memory-series-suggestions-repository.gateway';
import { InMemoryTelemetryRecorder } from '../../core/gateways/in-memory/in-memory-telemetry-recorder.gateway';
import { SystemClock } from '../../core/gateways/system-clock.gateway';
import { AnswerRatePromptUseCase } from '../../core/use-cases/answer-rate-prompt.use-case';
import {
  RATE_PROMPT_REPOSITORY,
  SERIES_SUGGESTIONS_REPOSITORY,
  STORE_LISTING,
  TELEMETRY_RECORDER,
} from '../injection-tokens';
import { ChromeStoreListing } from './gateways/chrome-store-listing.gateway';
import { InMemoryStoreListing } from './gateways/in-memory-store-listing.gateway';
import { TelemetryErrorHandler } from './gateways/telemetry-error-handler.gateway';

const devRatePrompt = () =>
  new URLSearchParams(location.search).has('rate-prompt-due')
    ? DEV_DUE_RATE_PROMPT
    : undefined;

const devSeriesSuggestions = () =>
  new URLSearchParams(location.search).has('pending-series')
    ? DEV_SERIES_SUGGESTIONS
    : undefined;

export const SHELL_PROVIDERS: Provider[] = [
  {
    provide: STORE_LISTING,
    useFactory: () =>
      environment.production
        ? new ChromeStoreListing()
        : new InMemoryStoreListing(),
  },
  {
    provide: RATE_PROMPT_REPOSITORY,
    useFactory: () =>
      environment.production
        ? new ChromeStorageRatePromptRepository()
        : new InMemoryRatePromptRepository(devRatePrompt()),
  },
  {
    provide: SERIES_SUGGESTIONS_REPOSITORY,
    useFactory: () =>
      environment.production
        ? new ChromeStorageSeriesSuggestionsRepository()
        : new InMemorySeriesSuggestionsRepository(devSeriesSuggestions()),
  },
  {
    provide: AnswerRatePromptUseCase,
    useFactory: () =>
      new AnswerRatePromptUseCase(
        inject(RATE_PROMPT_REPOSITORY),
        new SystemClock(),
      ),
  },
  {
    provide: TELEMETRY_RECORDER,
    useFactory: () =>
      environment.production
        ? new ChromeRuntimeTelemetryRecorder()
        : new InMemoryTelemetryRecorder(),
  },
  { provide: ErrorHandler, useClass: TelemetryErrorHandler },
];

import { inject, Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ChromeStorageRatePromptRepository } from '../../core/gateways/chrome-storage-rate-prompt-repository.gateway';
import { DEV_DUE_RATE_PROMPT } from '../../core/gateways/in-memory/dev-rate-prompt';
import { InMemoryRatePromptRepository } from '../../core/gateways/in-memory/in-memory-rate-prompt-repository.gateway';
import { SystemClock } from '../../core/gateways/system-clock.gateway';
import { AnswerRatePromptUseCase } from '../../core/use-cases/answer-rate-prompt.use-case';
import { RATE_PROMPT_REPOSITORY, STORE_LISTING } from '../injection-tokens';
import { ChromeStoreListing } from './gateways/chrome-store-listing.gateway';
import { InMemoryStoreListing } from './gateways/in-memory-store-listing.gateway';

const devRatePrompt = () =>
  new URLSearchParams(location.search).has('rate-prompt-due')
    ? DEV_DUE_RATE_PROMPT
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
    provide: AnswerRatePromptUseCase,
    useFactory: () =>
      new AnswerRatePromptUseCase(
        inject(RATE_PROMPT_REPOSITORY),
        new SystemClock(),
      ),
  },
];

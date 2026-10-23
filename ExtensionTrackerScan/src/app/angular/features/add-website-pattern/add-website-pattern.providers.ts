import { inject, Provider } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { DiscordWebsiteProposal } from '../../../core/gateways/discord-website-proposal.gateway';
import { InMemoryWebsiteProposal } from '../../../core/gateways/in-memory/in-memory-website-proposal.gateway';
import { ProposeWebsiteUseCase } from '../../../core/use-cases/propose-website.use-case';
import { TELEMETRY_RECORDER } from '../../injection-tokens';

export const ADD_WEBSITE_PATTERN_PROVIDERS: Provider[] = [
  {
    provide: ProposeWebsiteUseCase,
    useFactory: () =>
      new ProposeWebsiteUseCase(
        environment.production
          ? new DiscordWebsiteProposal()
          : new InMemoryWebsiteProposal(),
        inject(TELEMETRY_RECORDER),
      ),
  },
];

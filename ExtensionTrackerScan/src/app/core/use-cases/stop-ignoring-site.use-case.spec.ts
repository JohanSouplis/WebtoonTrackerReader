import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryCrashReporter } from '../gateways/in-memory/in-memory-crash-reporter.gateway';
import { InMemoryReportSettingsRepository } from '../gateways/in-memory/in-memory-report-settings-repository.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { InMemorySeriesSuggestionsRepository } from '../gateways/in-memory/in-memory-series-suggestions-repository.gateway';
import { InMemoryTelemetryRecorder } from '../gateways/in-memory/in-memory-telemetry-recorder.gateway';
import {
  hostTrust,
  OTHER_UNCERTAIN_HOST,
  uncertainPage,
  UNCERTAIN_HOST,
  waiting,
} from './pending-series.fixture';
import { RecordVisitedPageUseCase } from './record-visited-page.use-case';
import { StopIgnoringSiteUseCase } from './stop-ignoring-site.use-case';

describe('StopIgnoringSiteUseCase', () => {
  it('should suggest the new series of a site again once the reader stops ignoring it', async () => {
    const suggestionsRepository = new InMemorySeriesSuggestionsRepository(
      waiting(
        [],
        [
          hostTrust({ dismissedInARow: 2 }),
          hostTrust({ host: OTHER_UNCERTAIN_HOST, dismissedInARow: 3 }),
        ],
      ),
    );
    const recordVisitedPage = new RecordVisitedPageUseCase(
      new InMemoryScanRepository(),
      suggestionsRepository,
      new InMemoryCrashReporter(),
      new InMemoryReportSettingsRepository(),
      new FixedClock(),
      new InMemoryTelemetryRecorder(),
    );

    const ignoredHosts = await new StopIgnoringSiteUseCase(
      suggestionsRepository,
    ).execute(UNCERTAIN_HOST);
    await recordVisitedPage.execute(uncertainPage('Vagabond', 12));
    await recordVisitedPage.execute(
      uncertainPage('Vagabond', 12, OTHER_UNCERTAIN_HOST),
    );

    expect(ignoredHosts).toEqual([OTHER_UNCERTAIN_HOST]);
    expect(
      (await suggestionsRepository.load())
        .snapshot()
        .pending.map(({ host }) => host),
    ).toEqual([UNCERTAIN_HOST]);
  });
});

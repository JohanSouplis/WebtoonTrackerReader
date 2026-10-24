import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryCrashReporter } from '../gateways/in-memory/in-memory-crash-reporter.gateway';
import { InMemoryReportSettingsRepository } from '../gateways/in-memory/in-memory-report-settings-repository.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { InMemorySeriesSuggestionsRepository } from '../gateways/in-memory/in-memory-series-suggestions-repository.gateway';
import { InMemoryTelemetryRecorder } from '../gateways/in-memory/in-memory-telemetry-recorder.gateway';
import { ConfirmSiteSeriesUseCase } from './confirm-site-series.use-case';
import {
  OTHER_UNCERTAIN_HOST,
  pendingSeries,
  uncertainPage,
  UNCERTAIN_HOST,
  waiting,
} from './pending-series.fixture';
import { RecordVisitedPageUseCase } from './record-visited-page.use-case';
import { aScan } from './scans.fixture';

describe('ConfirmSiteSeriesUseCase', () => {
  it('should add every series waiting on the site as it showed them, and only them', async () => {
    const { confirmSite, scans, pending, telemetry } = setUp();

    const result = await confirmSite.execute(UNCERTAIN_HOST);

    expect(await scans()).toEqual([
      aScan({
        title: 'Doberman',
        chapter: 88,
        url: DOBERMAN.url,
        readAt: DOBERMAN.seenAt,
      }),
      aScan({
        title: 'Solo Leveling',
        chapter: 56,
        url: SOLO_LEVELING.url,
        readAt: SOLO_LEVELING.seenAt,
      }),
    ]);
    expect(await pending()).toEqual([ELSEWHERE]);
    expect(result).toEqual({ library: await scans(), pending: [ELSEWHERE] });
    expect(telemetry.recordedEvents).toEqual([
      { kind: 'pending-series', host: UNCERTAIN_HOST, outcome: 'added' },
      { kind: 'pending-series', host: UNCERTAIN_HOST, outcome: 'added' },
    ]);
  });

  it('should add the next new series of the site by itself once the reader added all of its series', async () => {
    const { confirmSite, recordVisitedPage, scans } = setUp();
    await confirmSite.execute(UNCERTAIN_HOST);

    await recordVisitedPage.execute(uncertainPage('Vagabond', 12));

    expect((await scans()).map(({ title }) => title)).toContain('Vagabond');
  });
});

const NOW = new Date('2025-01-01T09:00:10Z');

const SOLO_LEVELING = pendingSeries({
  title: 'Solo Leveling',
  chapter: 56,
  seenAt: new Date('2024-12-02T10:00:00Z'),
});

const DOBERMAN = pendingSeries({ title: 'Doberman', chapter: 88 });

const ELSEWHERE = pendingSeries({
  title: 'Vagabond',
  chapter: 3,
  host: OTHER_UNCERTAIN_HOST,
});

const setUp = () => {
  const scanRepository = new InMemoryScanRepository();
  const suggestionsRepository = new InMemorySeriesSuggestionsRepository(
    waiting([SOLO_LEVELING, ELSEWHERE, DOBERMAN]),
  );
  const telemetry = new InMemoryTelemetryRecorder();
  return {
    telemetry,
    confirmSite: new ConfirmSiteSeriesUseCase(
      scanRepository,
      suggestionsRepository,
      telemetry,
    ),
    recordVisitedPage: new RecordVisitedPageUseCase(
      scanRepository,
      suggestionsRepository,
      new InMemoryCrashReporter(),
      new InMemoryReportSettingsRepository(),
      new FixedClock(NOW),
      new InMemoryTelemetryRecorder(),
    ),
    scans: async () => (await scanRepository.load()).snapshot(),
    pending: async () =>
      (await suggestionsRepository.load()).snapshot().pending,
  };
};

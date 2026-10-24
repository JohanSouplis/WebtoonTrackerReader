import { ScanTitle } from '../domain/scan-title';
import {
  PendingSeriesNotFound,
  SeriesSuggestionsSnapshot,
} from '../domain/series-suggestions';
import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryCrashReporter } from '../gateways/in-memory/in-memory-crash-reporter.gateway';
import { InMemoryReportSettingsRepository } from '../gateways/in-memory/in-memory-report-settings-repository.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { InMemorySeriesSuggestionsRepository } from '../gateways/in-memory/in-memory-series-suggestions-repository.gateway';
import { InMemoryTelemetryRecorder } from '../gateways/in-memory/in-memory-telemetry-recorder.gateway';
import { ConfirmPendingSeriesUseCase } from './confirm-pending-series.use-case';
import { DismissPendingSeriesUseCase } from './dismiss-pending-series.use-case';
import {
  OTHER_UNCERTAIN_HOST,
  pendingSeries,
  uncertainPage,
  UNCERTAIN_HOST,
  waiting,
} from './pending-series.fixture';
import { RecordVisitedPageUseCase } from './record-visited-page.use-case';

describe('DismissPendingSeriesUseCase', () => {
  it('should forget the series and keep the site when the reader says it is not a series', async () => {
    const { dismiss, pending, telemetry } = setUp(
      waiting([RANKING, SOLO_LEVELING]),
    );

    const result = await dismiss('Weekly Ranking');

    expect(result).toEqual({ pending: [SOLO_LEVELING], isSiteIgnored: false });
    expect(await pending()).toEqual([SOLO_LEVELING]);
    expect(telemetry.recordedEvents).toEqual([
      { kind: 'pending-series', host: UNCERTAIN_HOST, outcome: 'dismissed' },
    ]);
  });

  it('should not suggest again on that site a title the reader said is not a series', async () => {
    const { dismiss, recordVisitedPage, pending } = setUp(waiting([RANKING]));
    await dismiss('Weekly Ranking');

    await recordVisitedPage.execute(uncertainPage('Weekly Ranking', 1167));
    await recordVisitedPage.execute(
      uncertainPage('Weekly Ranking', 1167, OTHER_UNCERTAIN_HOST),
    );

    expect(await pending()).toEqual([
      pendingSeries({
        title: 'Weekly Ranking',
        chapter: 1167,
        host: OTHER_UNCERTAIN_HOST,
        seenAt: NOW,
      }),
    ]);
  });

  it('should ignore the new series of a site once the reader said two of them in a row are not series', async () => {
    const { dismiss, recordVisitedPage, pending } = setUp(
      waiting([RANKING, SOLO_LEVELING]),
    );
    await dismiss('Weekly Ranking');

    const result = await dismiss('Solo Leveling');
    await recordVisitedPage.execute(uncertainPage('Vagabond', 12));

    expect(result).toEqual({ pending: [], isSiteIgnored: true });
    expect(await pending()).toEqual([]);
  });

  it('should keep asking about the new series of a site when the reader added one of them between two dismissals', async () => {
    const { dismiss, confirm, recordVisitedPage, pending } = setUp(
      waiting([RANKING, DOBERMAN, SOLO_LEVELING]),
    );
    await dismiss('Weekly Ranking');
    await confirm('Doberman');

    const result = await dismiss('Solo Leveling');
    await recordVisitedPage.execute(uncertainPage('Vagabond', 12));

    expect(result.isSiteIgnored).toBe(false);
    expect((await pending()).map(({ title }) => title)).toEqual(['Vagabond']);
  });

  it('should ask again about the new series of a site the reader trusted once one of its series is not a series', async () => {
    const { dismiss, confirm, recordVisitedPage, pending } = setUp(
      waiting([DOBERMAN, SOLO_LEVELING, TOWER_OF_GOD, RANKING]),
    );
    await confirm('Doberman');
    await confirm('Solo Leveling');
    await confirm('Tower of God');

    await dismiss('Weekly Ranking');
    await recordVisitedPage.execute(uncertainPage('Vagabond', 12));

    expect((await pending()).map(({ title }) => title)).toEqual(['Vagabond']);
  });

  it('should fail and change nothing when the series no longer waits', async () => {
    const { dismiss, pending, telemetry } = setUp(waiting([RANKING]));

    await expect(dismiss('Vagabond')).rejects.toThrow(PendingSeriesNotFound);

    expect(await pending()).toEqual([RANKING]);
    expect(telemetry.recordedEvents).toEqual([]);
  });
});

const NOW = new Date('2025-01-01T09:00:10Z');

const RANKING = pendingSeries({ title: 'Weekly Ranking', chapter: 1166 });

const DOBERMAN = pendingSeries({ title: 'Doberman', chapter: 88 });

const TOWER_OF_GOD = pendingSeries({ title: 'Tower of God', chapter: 550 });

const SOLO_LEVELING = pendingSeries({
  title: 'Solo Leveling',
  chapter: 56,
  seenAt: new Date('2024-12-02T10:00:00Z'),
});

const setUp = (suggestions: SeriesSuggestionsSnapshot) => {
  const scanRepository = new InMemoryScanRepository();
  const suggestionsRepository = new InMemorySeriesSuggestionsRepository(
    suggestions,
  );
  const telemetry = new InMemoryTelemetryRecorder();
  const dismissPendingSeries = new DismissPendingSeriesUseCase(
    suggestionsRepository,
    telemetry,
  );
  const confirmPendingSeries = new ConfirmPendingSeriesUseCase(
    scanRepository,
    suggestionsRepository,
    new InMemoryTelemetryRecorder(),
  );
  const refOf = (title: string) => ({
    title: ScanTitle.of(title),
    host: UNCERTAIN_HOST,
  });
  return {
    telemetry,
    dismiss: (title: string) => dismissPendingSeries.execute(refOf(title)),
    confirm: (title: string) =>
      confirmPendingSeries.execute(refOf(title), { kind: 'as-detected' }),
    recordVisitedPage: new RecordVisitedPageUseCase(
      scanRepository,
      suggestionsRepository,
      new InMemoryCrashReporter(),
      new InMemoryReportSettingsRepository(),
      new FixedClock(NOW),
      new InMemoryTelemetryRecorder(),
    ),
    pending: async () =>
      (await suggestionsRepository.load()).snapshot().pending,
  };
};

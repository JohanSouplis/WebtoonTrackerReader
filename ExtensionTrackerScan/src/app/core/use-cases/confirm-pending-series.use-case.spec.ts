import { ScanSnapshot } from '../domain/scan-library';
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
import {
  OTHER_UNCERTAIN_HOST,
  pendingSeries,
  uncertainPage,
  uncertainUrl,
  UNCERTAIN_HOST,
  waiting,
} from './pending-series.fixture';
import { RecordVisitedPageUseCase } from './record-visited-page.use-case';
import { aScan } from './scans.fixture';

describe('ConfirmPendingSeriesUseCase', () => {
  it('should add the series under the title the site showed when the reader adds it as it is', async () => {
    const { confirm, scans, pending, telemetry } = setUp(
      waiting([DOBERMAN, SOLO_LEVELING]),
    );

    const result = await confirm('Doberman', { kind: 'as-detected' });

    expect(await scans()).toEqual([
      aScan({
        title: 'Doberman',
        chapter: 88,
        url: DOBERMAN.url,
        readAt: DOBERMAN.seenAt,
      }),
    ]);
    expect(await pending()).toEqual([SOLO_LEVELING]);
    expect(result).toEqual({
      library: await scans(),
      pending: [SOLO_LEVELING],
    });
    expect(telemetry.recordedEvents).toEqual([
      { kind: 'pending-series', host: UNCERTAIN_HOST, outcome: 'added' },
    ]);
  });

  it('should keep the device the series was read on when the reader adds it', async () => {
    const readOnPhone = pendingSeries({
      title: 'Doberman',
      chapter: 88,
      origin: 'other-device',
    });
    const { confirm, scans } = setUp(waiting([readOnPhone]));

    await confirm('Doberman', { kind: 'as-detected' });

    expect(await scans()).toMatchObject([
      { title: 'Doberman', origin: 'other-device' },
    ]);
  });

  it('should add the series under the corrected title and keep the title the site showed as an alias', async () => {
    const { confirm, scans, telemetry } = setUp(
      waiting([DOBERMAN_ONLINE_FREE]),
    );

    await confirm('Doberman Online Free', {
      kind: 'renamed',
      title: ScanTitle.of('Doberman'),
    });

    expect(await scans()).toEqual([
      aScan({
        title: 'Doberman',
        chapter: 88,
        url: DOBERMAN_ONLINE_FREE.url,
        readAt: DOBERMAN_ONLINE_FREE.seenAt,
        aliases: ['Doberman Online Free'],
      }),
    ]);
    expect(telemetry.recordedEvents).toEqual([
      { kind: 'pending-series', host: UNCERTAIN_HOST, outcome: 'added-edited' },
    ]);
  });

  it('should advance the series a later chapter on the same site reads under the title the site showed, once the reader corrected it', async () => {
    const { confirm, recordVisitedPage, scans, pending } = setUp(
      waiting([DOBERMAN_ONLINE_FREE]),
    );
    await confirm('Doberman Online Free', {
      kind: 'renamed',
      title: ScanTitle.of('Doberman'),
    });

    await recordVisitedPage.execute(uncertainPage('Doberman Online Free', 89));

    expect(await scans()).toEqual([
      aScan({
        title: 'Doberman',
        chapter: 89,
        url: uncertainUrl('doberman-online-free', 89),
        readAt: NOW,
        aliases: ['Doberman Online Free'],
      }),
    ]);
    expect(await pending()).toEqual([]);
  });

  it('should count a correction to the same title as adding the series as it is', async () => {
    const { confirm, telemetry } = setUp(waiting([DOBERMAN]));

    await confirm('Doberman', {
      kind: 'renamed',
      title: ScanTitle.of('doberman'),
    });

    expect(telemetry.recordedEvents).toEqual([
      { kind: 'pending-series', host: UNCERTAIN_HOST, outcome: 'added' },
    ]);
  });

  it('should merge the series into a followed scan, which keeps its title and takes the newer chapter', async () => {
    const followed = aScan({
      title: 'Solo Leveling',
      chapter: 40,
      isFavorite: true,
    });
    const { confirm, scans, pending, telemetry } = setUp(
      waiting([SOLO_LEVELING_DE]),
      [followed],
    );

    await confirm('Solo Leveling DE', {
      kind: 'merged',
      into: ScanTitle.of('Solo Leveling'),
    });

    expect(await scans()).toEqual([
      {
        ...followed,
        chapter: 56,
        url: SOLO_LEVELING_DE.url,
        readAt: SOLO_LEVELING_DE.seenAt,
        aliases: ['Solo Leveling DE'],
      },
    ]);
    expect(await pending()).toEqual([]);
    expect(telemetry.recordedEvents).toEqual([
      { kind: 'pending-series', host: UNCERTAIN_HOST, outcome: 'merged' },
    ]);
  });

  it('should keep the chapter of the followed scan when the merged series was read before it', async () => {
    const followed = aScan({
      title: 'Solo Leveling',
      chapter: 80,
      readAt: new Date('2025-02-01T00:00:00Z'),
    });
    const { confirm, scans } = setUp(waiting([SOLO_LEVELING_DE]), [followed]);

    await confirm('Solo Leveling DE', {
      kind: 'merged',
      into: ScanTitle.of('Solo Leveling'),
    });

    expect(await scans()).toEqual([
      { ...followed, aliases: ['Solo Leveling DE'] },
    ]);
  });

  it('should add the series to the followed scan its corrected title names', async () => {
    const followed = aScan({ title: 'Solo Leveling', chapter: 40 });
    const { confirm, scans } = setUp(waiting([SOLO_LEVELING_DE]), [followed]);

    await confirm('Solo Leveling DE', {
      kind: 'renamed',
      title: ScanTitle.of('Solo leveling'),
    });

    expect(await scans()).toEqual([
      {
        ...followed,
        chapter: 56,
        url: SOLO_LEVELING_DE.url,
        readAt: SOLO_LEVELING_DE.seenAt,
        aliases: ['Solo Leveling DE'],
      },
    ]);
  });

  it('should take in the same series waiting on another site, and every waiting series the library now recognises', async () => {
    const elsewhere = pendingSeries({
      title: 'Doberman Online Free',
      chapter: 90,
      host: OTHER_UNCERTAIN_HOST,
      seenAt: new Date('2024-12-05T10:00:00Z'),
    });
    const alreadyNamed = pendingSeries({
      title: 'Doberman',
      chapter: 91,
      host: OTHER_UNCERTAIN_HOST,
      seenAt: new Date('2024-12-06T10:00:00Z'),
    });
    const { confirm, scans, pending } = setUp(
      waiting([DOBERMAN_ONLINE_FREE, elsewhere, alreadyNamed, SOLO_LEVELING]),
    );

    await confirm('Doberman Online Free', {
      kind: 'renamed',
      title: ScanTitle.of('Doberman'),
    });

    expect(await scans()).toEqual([
      aScan({
        title: 'Doberman',
        chapter: 91,
        url: alreadyNamed.url,
        readAt: alreadyNamed.seenAt,
        aliases: ['Doberman Online Free'],
      }),
    ]);
    expect(await pending()).toEqual([SOLO_LEVELING]);
  });

  it('should add the next new series of a site by itself once the reader added three of its series in a row as they were', async () => {
    const { confirm, recordVisitedPage, scans, pending } = setUp(
      waiting([DOBERMAN, SOLO_LEVELING, TOWER_OF_GOD]),
    );
    await confirm('Doberman', { kind: 'as-detected' });
    await confirm('Solo Leveling', { kind: 'as-detected' });
    await confirm('Tower of God', { kind: 'as-detected' });

    await recordVisitedPage.execute(uncertainPage('Vagabond', 12));

    expect((await scans()).map(({ title }) => title)).toEqual([
      'Doberman',
      'Solo Leveling',
      'Tower of God',
      'Vagabond',
    ]);
    expect(await pending()).toEqual([]);
  });

  it('should keep asking about the new series of a site when the reader added only two of its series as they were', async () => {
    const { confirm, recordVisitedPage, pending } = setUp(
      waiting([DOBERMAN, SOLO_LEVELING]),
    );
    await confirm('Doberman', { kind: 'as-detected' });
    await confirm('Solo Leveling', { kind: 'as-detected' });

    await recordVisitedPage.execute(uncertainPage('Vagabond', 12));

    expect((await pending()).map(({ title }) => title)).toEqual(['Vagabond']);
  });

  it.each`
    case                                          | third
    ${'needed a corrected title'}                 | ${{ kind: 'renamed', title: ScanTitle.of('Tower of God Season 3') }}
    ${'belonged to a series the reader followed'} | ${{ kind: 'merged', into: ScanTitle.of('Doberman') }}
  `(
    'should keep asking about the new series of a site when one of the three series added $case',
    async ({ third }) => {
      const { confirm, recordVisitedPage, pending } = setUp(
        waiting([DOBERMAN, SOLO_LEVELING, TOWER_OF_GOD]),
      );
      await confirm('Doberman', { kind: 'as-detected' });
      await confirm('Solo Leveling', { kind: 'as-detected' });
      await confirm('Tower of God', third);

      await recordVisitedPage.execute(uncertainPage('Vagabond', 12));

      expect((await pending()).map(({ title }) => title)).toEqual(['Vagabond']);
    },
  );

  it('should fail and change nothing when the series no longer waits', async () => {
    const { confirm, scans, pending, telemetry } = setUp(waiting([DOBERMAN]));

    await expect(confirm('Vagabond', { kind: 'as-detected' })).rejects.toThrow(
      PendingSeriesNotFound,
    );

    expect(await scans()).toEqual([]);
    expect(await pending()).toEqual([DOBERMAN]);
    expect(telemetry.recordedEvents).toEqual([]);
  });
});

const NOW = new Date('2025-01-01T09:00:10Z');

const DOBERMAN = pendingSeries({ title: 'Doberman', chapter: 88 });

const DOBERMAN_ONLINE_FREE = pendingSeries({
  title: 'Doberman Online Free',
  chapter: 88,
});

const SOLO_LEVELING = pendingSeries({
  title: 'Solo Leveling',
  chapter: 56,
  seenAt: new Date('2024-12-02T10:00:00Z'),
});

const TOWER_OF_GOD = pendingSeries({ title: 'Tower of God', chapter: 550 });

const SOLO_LEVELING_DE = pendingSeries({
  title: 'Solo Leveling DE',
  chapter: 56,
  seenAt: new Date('2024-12-02T10:00:00Z'),
});

const setUp = (
  suggestions: SeriesSuggestionsSnapshot,
  followed: ScanSnapshot[] = [],
) => {
  const scanRepository = new InMemoryScanRepository(followed);
  const suggestionsRepository = new InMemorySeriesSuggestionsRepository(
    suggestions,
  );
  const telemetry = new InMemoryTelemetryRecorder();
  const confirmPendingSeries = new ConfirmPendingSeriesUseCase(
    scanRepository,
    suggestionsRepository,
    telemetry,
  );
  return {
    telemetry,
    confirm: (
      title: string,
      confirmation: Parameters<ConfirmPendingSeriesUseCase['execute']>[1],
    ) =>
      confirmPendingSeries.execute(
        { title: ScanTitle.of(title), host: UNCERTAIN_HOST },
        confirmation,
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

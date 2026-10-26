import { ScanSnapshot } from '../domain/scan-library';
import {
  InMemoryBrowserHistory,
  SyncedVisit,
} from '../gateways/in-memory/in-memory-browser-history.gateway';
import { InMemoryCrashReporter } from '../gateways/in-memory/in-memory-crash-reporter.gateway';
import { InMemoryReportSettingsRepository } from '../gateways/in-memory/in-memory-report-settings-repository.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { InMemorySeriesSuggestionsRepository } from '../gateways/in-memory/in-memory-series-suggestions-repository.gateway';
import { InMemoryTelemetryRecorder } from '../gateways/in-memory/in-memory-telemetry-recorder.gateway';
import { ImportReadingHistoryUseCase } from './import-reading-history.use-case';
import { pendingSeries, uncertainPage } from './pending-series.fixture';
import { aScan } from './scans.fixture';

describe('ImportReadingHistoryUseCase', () => {
  it('should record each scan read in the history at its visit date', async () => {
    const followed = aScan({ title: 'Overgeared', chapter: 1 });
    const { importReadingHistory, scans } = setUp(
      [
        visit('Overgeared Chapter 266 - Manganato', MANGANATO_URL, LATER),
        visit('Read Episode 3 - The Hidden Muse | Manta', MANTA_URL, EARLIER),
      ],
      [followed],
    );

    await importReadingHistory.execute();

    expect(await scans()).toEqual([
      aScan({
        title: 'Overgeared',
        chapter: 266,
        url: MANGANATO_URL,
        readAt: LATER,
        origin: 'unknown',
      }),
      aScan({
        title: 'The Hidden Muse',
        chapter: 3,
        url: MANTA_URL,
        readAt: EARLIER,
        origin: 'unknown',
      }),
    ]);
  });

  it('should mark a scan read on another device when Chrome synced the visit from it', async () => {
    const { importReadingHistory, scans } = setUp(
      [
        {
          ...visit('Overgeared Chapter 266 - Manganato', MANGANATO_URL, LATER),
          origin: 'other-device',
        },
      ],
      [aScan({ title: 'Overgeared', chapter: 1 })],
    );

    await importReadingHistory.execute();

    expect(await scans()).toEqual([
      aScan({
        title: 'Overgeared',
        chapter: 266,
        url: MANGANATO_URL,
        readAt: LATER,
        origin: 'other-device',
      }),
    ]);
  });

  it('should keep the device a new series was read on while it waits for the reader', async () => {
    const { importReadingHistory, pending } = setUp([
      { ...historyVisit('Solo Leveling', 56, LATER), origin: 'other-device' },
    ]);

    await importReadingHistory.execute();

    expect(await pending()).toMatchObject([
      { title: 'Solo Leveling', origin: 'other-device' },
    ]);
  });

  it('should keep the latest chapter when an older visit of the same scan comes later in the history', async () => {
    const { importReadingHistory, scans } = setUp([
      visit('Nano Machine - Chapter 190 - Flame Comics', FLAME_URL, LATER),
      visit(
        'Nano Machine - Chapter 189 - Flame Comics',
        'https://flamecomics.xyz/nano-machine-chapter-189/',
        EARLIER,
      ),
    ]);

    await importReadingHistory.execute();

    expect(await scans()).toEqual([
      aScan({
        title: 'Nano Machine',
        chapter: 190,
        url: FLAME_URL,
        readAt: LATER,
        origin: 'unknown',
      }),
    ]);
  });

  it('should suggest once, at its latest chapter, a new series the history shows on a site whose recognition is not trusted', async () => {
    const { importReadingHistory, scans, pending } = setUp([
      historyVisit('Solo Leveling', 56, LATER),
      historyVisit('Solo Leveling', 55, EARLIER),
    ]);

    await importReadingHistory.execute();

    expect(await scans()).toEqual([]);
    expect(await pending()).toEqual([
      pendingSeries({
        title: 'Solo Leveling',
        chapter: 56,
        seenAt: LATER,
        origin: 'unknown',
        source: 'history',
      }),
    ]);
  });

  it('should keep the ten newest new series of a site when the history shows more of them', async () => {
    const { importReadingHistory, pending } = setUp(
      Array.from({ length: 12 }, (_, index) =>
        historyVisit(
          `Series ${index + 1}`,
          1,
          new Date(Date.UTC(2025, 0, index + 1)),
        ),
      ),
    );

    await importReadingHistory.execute();

    expect((await pending()).map(({ title }) => title)).toEqual(
      Array.from({ length: 10 }, (_, index) => `Series ${12 - index}`),
    );
  });

  it('should keep the newest series of each site, and the newest in all, when the history holds more than the reader can review', async () => {
    const hosts = ['a.example', 'b.example', 'c.example', 'd.example'];
    const visits = hosts.flatMap((host, siteIndex) =>
      Array.from({ length: 12 }, (_, index) =>
        historyVisit(
          `Series ${String.fromCharCode(65 + index)}`,
          1,
          new Date(Date.UTC(2025, 0, 1 + index, siteIndex)),
          host,
        ),
      ),
    );
    const { importReadingHistory, pending } = setUp(visits);

    await importReadingHistory.execute();

    const kept = await pending();
    expect(kept).toHaveLength(30);
    expect(
      hosts.map((host) => kept.filter((series) => series.host === host).length),
    ).toEqual([7, 7, 8, 8]);
    expect(
      kept.filter(({ host }) => host === 'd.example').map(({ title }) => title),
    ).toEqual(
      ['L', 'K', 'J', 'I', 'H', 'G', 'F', 'E'].map(
        (letter) => `Series ${letter}`,
      ),
    );
  });

  it('should record the scans read in the history on websites outside the catalog', async () => {
    const { importReadingHistory, scans, crashReporter } = setUp([
      visit('Nano Machine - Chapter 190 - Flame Comics', FLAME_URL, LATER),
      visit('Nano Machine - Flame Comics', FLAME_SERIES_URL, LATER),
    ]);

    await importReadingHistory.execute();

    expect(await scans()).toEqual([
      aScan({
        title: 'Nano Machine',
        chapter: 190,
        url: FLAME_URL,
        readAt: LATER,
        origin: 'unknown',
      }),
    ]);
    expect(crashReporter.reportedPages).toEqual([]);
  });

  it('should report the history pages whose title matches no format of their supported website', async () => {
    const unparsed = visit(
      'Lore Olympus | WEBTOON',
      'https://www.webtoons.com/en/romance/lore-olympus/list?title_no=1320',
      LATER,
    );
    const { importReadingHistory, scans, crashReporter, telemetry } = setUp([
      unparsed,
      visit('Asura Scans', 'https://asuracomic.net/', LATER),
      visit('Search - Google', 'https://www.google.com/search?q=scans', LATER),
    ]);

    await importReadingHistory.execute();

    expect(crashReporter.reportedPages).toEqual([unparsed.page]);
    expect(telemetry.recordedEvents).toEqual([
      { kind: 'parse-miss', host: 'webtoons.com' },
    ]);
    expect(await scans()).toEqual([]);
  });

  it('should report no history page when the reader turned parse reports off', async () => {
    const { importReadingHistory, crashReporter } = setUp(
      [
        visit(
          'Lore Olympus | WEBTOON',
          'https://www.webtoons.com/en/romance/lore-olympus/list?title_no=1320',
          LATER,
        ),
      ],
      [],
      new InMemoryReportSettingsRepository({ sendsParseReports: false }),
    );

    await importReadingHistory.execute();

    expect(crashReporter.reportedPages).toEqual([]);
  });
});

const EARLIER = new Date('2025-03-01T10:00:00Z');
const LATER = new Date('2025-03-02T10:00:00Z');
const MANGANATO_URL = 'https://chapmanganato.to/manga-hi985065/chapter-266';
const FLAME_URL = 'https://flamecomics.xyz/nano-machine-chapter-190/';
const FLAME_SERIES_URL = 'https://flamecomics.xyz/series/nano-machine/';
const MANTA_URL =
  'https://manta.net/en/series/the-hidden-muse/episodes/episode-3?episodeId=117732';

const historyVisit = (
  title: string,
  chapter: number,
  readAt: Date,
  host?: string,
): SyncedVisit => ({ page: uncertainPage(title, chapter, host), readAt });

const visit = (pageTitle: string, url: string, readAt: Date): SyncedVisit => ({
  page: { pageTitle, url },
  readAt,
});

const setUp = (
  visits: SyncedVisit[],
  followed: ScanSnapshot[] = [],
  reportSettings = new InMemoryReportSettingsRepository(),
) => {
  const scanRepository = new InMemoryScanRepository(followed);
  const suggestionsRepository = new InMemorySeriesSuggestionsRepository();
  const crashReporter = new InMemoryCrashReporter();
  const telemetry = new InMemoryTelemetryRecorder();
  return {
    crashReporter,
    telemetry,
    scans: async () => (await scanRepository.load()).snapshot(),
    pending: async () =>
      (await suggestionsRepository.load()).snapshot().pending,
    importReadingHistory: new ImportReadingHistoryUseCase(
      new InMemoryBrowserHistory(visits),
      scanRepository,
      suggestionsRepository,
      crashReporter,
      reportSettings,
      telemetry,
    ),
  };
};

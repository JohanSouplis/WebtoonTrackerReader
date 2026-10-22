import { ScanSnapshot } from '../domain/scan-library';
import { InMemoryBrowserHistory } from '../gateways/in-memory/in-memory-browser-history.gateway';
import { InMemoryCrashReporter } from '../gateways/in-memory/in-memory-crash-reporter.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { HistoryVisit } from '../ports/browser-history.port';
import { ImportReadingHistoryUseCase } from './import-reading-history.use-case';
import { aScan } from './scans.fixture';

describe('ImportReadingHistoryUseCase', () => {
  it('should record each scan read in the history at its visit date', async () => {
    const followed = aScan({ title: 'Overgeared', chapter: 1 });
    const { importReadingHistory, scans } = setUp(
      [
        visit('Overgeared Chapter 266 - Manganato', MANGANATO_URL, LATER),
        visit(
          'Super God System - chapter 85 - Dragon Tea',
          DRAGON_TEA_URL,
          EARLIER,
        ),
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
      }),
      aScan({
        title: 'Super God System',
        chapter: 85,
        url: DRAGON_TEA_URL,
        readAt: EARLIER,
      }),
    ]);
  });

  it('should keep the latest chapter when an older visit of the same scan comes later in the history', async () => {
    const { importReadingHistory, scans } = setUp([
      visit('Overgeared Chapter 266 - Manganato', MANGANATO_URL, LATER),
      visit('Overgeared Chapter 265 - Manganato', MANGANATO_URL, EARLIER),
    ]);

    await importReadingHistory.execute();

    expect(await scans()).toEqual([
      aScan({
        title: 'Overgeared',
        chapter: 266,
        url: MANGANATO_URL,
        readAt: LATER,
      }),
    ]);
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
      }),
    ]);
    expect(crashReporter.reportedPages).toEqual([]);
  });

  it('should report the history pages whose title matches no format of their supported website', async () => {
    const unparsed = visit(
      'Chronicles Of The Demon Faction - Ch - Share Any Manga on MangaPark',
      'https://mangapark.org/title/341611-en-chronicles-of-the-demon-faction/9404698-ch-102',
      LATER,
    );
    const { importReadingHistory, scans, crashReporter } = setUp([
      unparsed,
      visit('Asura Scans', 'https://asuracomic.net/', LATER),
      visit('Search - Google', 'https://www.google.com/search?q=scans', LATER),
    ]);

    await importReadingHistory.execute();

    expect(crashReporter.reportedPages).toEqual([unparsed.page]);
    expect(await scans()).toEqual([]);
  });
});

const EARLIER = new Date('2025-03-01T10:00:00Z');
const LATER = new Date('2025-03-02T10:00:00Z');
const MANGANATO_URL = 'https://chapmanganato.to/manga-hi985065/chapter-266';
const FLAME_URL = 'https://flamecomics.xyz/nano-machine-chapter-190/';
const FLAME_SERIES_URL = 'https://flamecomics.xyz/series/nano-machine/';
const DRAGON_TEA_URL =
  'https://dragontea.ink/novel/super-god-system/chapter-85/';

const visit = (pageTitle: string, url: string, readAt: Date): HistoryVisit => ({
  page: { pageTitle, url },
  readAt,
});

const setUp = (visits: HistoryVisit[], followed: ScanSnapshot[] = []) => {
  const scanRepository = new InMemoryScanRepository(followed);
  const crashReporter = new InMemoryCrashReporter();
  return {
    crashReporter,
    scans: async () => (await scanRepository.load()).snapshot(),
    importReadingHistory: new ImportReadingHistoryUseCase(
      new InMemoryBrowserHistory(visits),
      scanRepository,
      crashReporter,
    ),
  };
};

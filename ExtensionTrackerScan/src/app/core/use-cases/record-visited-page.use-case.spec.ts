import { ScanSnapshot } from '../domain/scan-library';
import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryCrashReporter } from '../gateways/in-memory/in-memory-crash-reporter.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { RecordVisitedPageUseCase } from './record-visited-page.use-case';
import { aScan } from './scans.fixture';
import { SUPPORTED_WEBSITE_PAGES } from './supported-website-pages.fixture';

describe('RecordVisitedPageUseCase', () => {
  it.each(SUPPORTED_WEBSITE_PAGES)(
    'should record the scan read when the page title is "%s"',
    async (pageTitle, url, title, chapter) => {
      const { recordVisitedPage, scans, crashReporter } = setUp();

      await recordVisitedPage.execute({ pageTitle, url });

      expect(await scans()).toEqual([
        aScan({ title, chapter, url, readAt: NOW }),
      ]);
      expect(crashReporter.reportedPages).toEqual([]);
    },
  );

  it('should ignore the page without reporting it when it belongs to no supported website', async () => {
    const { recordVisitedPage, scans, crashReporter } = setUp();

    await recordVisitedPage.execute({ pageTitle: '', url: '' });

    expect(await scans()).toEqual([]);
    expect(crashReporter.reportedPages).toEqual([]);
  });

  it.each([
    [
      'Stories that change your world, Tappytoon Comics & Novels | Official English',
      'https://www.tappytoon.com/en/comics/home',
    ],
    [
      'Chronicles Of The Demon Faction - Ch - Share Any Manga on MangaPark',
      'https://mangapark.org/title/341611-en-chronicles-of-the-demon-faction/9404698-ch-102',
    ],
  ])(
    'should report the page when its title "%s" matches no format of its supported website',
    async (pageTitle, url) => {
      const { recordVisitedPage, scans, crashReporter } = setUp();

      await recordVisitedPage.execute({ pageTitle, url });

      expect(await scans()).toEqual([]);
      expect(crashReporter.reportedPages).toEqual([{ pageTitle, url }]);
    },
  );

  it.each([
    [
      'a redirect',
      'Disqus Comments',
      'https://disqus.com/embed/comments/?base=default&f=asura-scans-13&t_i=chapter-135-85&t_u=https%3A%2F%2Fasuracomic.net%2Fseries%2Facademys-genius-swordmaster-73f07cea%2Fchapter%2F85&t_e=Academy%27s%20Genius%20Swordmaster&t_d=Academy%27s%20Genius%20Swordmaster%20Chapter%2085%20-%20Asura%20Scans&t_t=Academy%27s%20Genius%20Swordmaster&s_o=default#version=2f54d43b17c298fa4a839abab8ed97ea',
    ],
    ['the home page of the website', 'Asura Scans', 'https://asuracomic.net/'],
    [
      'the page listing the chapters of a scan',
      'Izure Saikyou no Renkinjutsushi? - MangaDex',
      'https://mangadex.org/title/17b4a134-65a5-4ba9-851e-9cc824755bf5/izure-saikyou-no-renkinjutsushi?tab=chapters',
    ],
    [
      'a oneshot',
      '23 | Oneshot - Jujutsu Kaisen - Hibernation (Doujinshi) - MangaDex',
      'https://mangadex.org/chapter/de33d854-073d-41af-a707-58da728855d1/23',
    ],
    [
      'a page whose url contains "undefined"',
      'Solo Leveling Chapter 3 - Asura Scans',
      'https://asuracomic.net/series/undefined/chapter/3',
    ],
  ])(
    'should ignore the page without reporting it when it is %s',
    async (_, pageTitle, url) => {
      const { recordVisitedPage, scans, crashReporter } = setUp();

      await recordVisitedPage.execute({ pageTitle, url });

      expect(await scans()).toEqual([]);
      expect(crashReporter.reportedPages).toEqual([]);
    },
  );

  it('should add the scan after the scans already followed when its title is new', async () => {
    const followed = aScan({ title: 'OldScanTitle', chapter: 8 });
    const { recordVisitedPage, scans } = setUp([followed]);

    await recordVisitedPage.execute(asuraPage('Title', '13'));

    expect(await scans()).toEqual([
      followed,
      aScan({ title: 'Title', chapter: 13, url: asuraUrl('13'), readAt: NOW }),
    ]);
  });

  it('should replace the chapter, url and date when a newer reading of a followed scan arrives', async () => {
    const { recordVisitedPage, scans } = setUp([
      aScan({ title: 'Title', chapter: 1 }),
    ]);

    await recordVisitedPage.execute(asuraPage('Title', '2'));

    expect(await scans()).toEqual([
      aScan({ title: 'Title', chapter: 2, url: asuraUrl('2'), readAt: NOW }),
    ]);
  });

  it('should keep the latest chapter when an older reading of the same scan arrives', async () => {
    const followed = aScan({
      title: 'Title',
      chapter: 1,
      readAt: new Date('2026-01-01T00:00:00Z'),
    });
    const { recordVisitedPage, scans } = setUp([followed]);

    await recordVisitedPage.execute(asuraPage('Title', '2'));

    expect(await scans()).toEqual([followed]);
  });

  it.each([
    ['the chapter is not a number', 'Title Chapter abc - Asura Scans'],
    ['the title is empty', '  Chapter 3 - Asura Scans'],
    ['the title and the chapter are empty', '  Chapter x - Asura Scans'],
  ])(
    'should leave the followed scans unchanged when %s',
    async (_, pageTitle) => {
      const followed = aScan({ title: 'Title', chapter: 1 });
      const { recordVisitedPage, scans } = setUp([followed]);

      await recordVisitedPage.execute({ pageTitle, url: asuraUrl('3') });

      expect(await scans()).toEqual([followed]);
    },
  );

  it('should update the followed scan when the title differs only by a typographic apostrophe', async () => {
    const { recordVisitedPage, scans } = setUp([
      aScan({ title: "Mount Hua Sect's Genius Phantom Swordsman", chapter: 1 }),
    ]);
    const page = {
      pageTitle:
        'Mount Hua Sect’s Genius Phantom Swordsman - Chapter 18 - Kun Manga',
      url: 'https://kunmanga.com/manga/mount-hua-sects-genius-phantom-swordsman/chapter-18/',
    };

    await recordVisitedPage.execute(page);

    expect(await scans()).toEqual([
      aScan({
        title: "Mount Hua Sect's Genius Phantom Swordsman",
        chapter: 18,
        url: page.url,
        readAt: NOW,
      }),
    ]);
  });

  it('should update the followed scan with the new spelling when the title differs only by case', async () => {
    const { recordVisitedPage, scans } = setUp([
      aScan({ title: 'Mount Hua sect Genius', chapter: 1 }),
    ]);

    await recordVisitedPage.execute(asuraPage('Mount hua Sect genius', '2'));

    expect(await scans()).toEqual([
      aScan({
        title: 'Mount hua Sect genius',
        chapter: 2,
        url: asuraUrl('2'),
        readAt: NOW,
      }),
    ]);
  });

  it('should fill the url of a followed scan when its url is missing', async () => {
    const { recordVisitedPage, scans } = setUp([
      aScan({ title: 'Title', chapter: 1, url: '' }),
    ]);

    await recordVisitedPage.execute(asuraPage('Title', '1'));

    expect(await scans()).toEqual([
      aScan({ title: 'Title', chapter: 1, url: asuraUrl('1'), readAt: NOW }),
    ]);
  });

  it('should keep the favorite and the rating of a followed scan when a reading at the same date arrives', async () => {
    const { recordVisitedPage, scans } = setUp([
      aScan({
        title: 'Title',
        chapter: 1,
        url: '',
        readAt: NOW,
        isFavorite: true,
        rating: 9,
      }),
    ]);

    await recordVisitedPage.execute(asuraPage('Title', '1'));

    expect(await scans()).toEqual([
      aScan({
        title: 'Title',
        chapter: 1,
        url: asuraUrl('1'),
        readAt: NOW,
        isFavorite: true,
        rating: 9,
      }),
    ]);
  });
});

const NOW = new Date('2025-01-01T09:00:10Z');

const asuraUrl = (chapter: string): string =>
  `https://asuracomic.net/series/title/chapter/${chapter}`;

const asuraPage = (title: string, chapter: string) => ({
  pageTitle: `${title} Chapter ${chapter} - Asura Scans`,
  url: asuraUrl(chapter),
});

const setUp = (followed: ScanSnapshot[] = []) => {
  const scanRepository = new InMemoryScanRepository(followed);
  const crashReporter = new InMemoryCrashReporter();
  return {
    crashReporter,
    scans: async () => (await scanRepository.load()).snapshot(),
    recordVisitedPage: new RecordVisitedPageUseCase(
      scanRepository,
      crashReporter,
      new FixedClock(NOW),
    ),
  };
};

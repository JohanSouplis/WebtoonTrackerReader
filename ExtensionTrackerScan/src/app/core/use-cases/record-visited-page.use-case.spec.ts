import { parsePageSignals } from '../../../page-signals-message';
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

  // prettier-ignore
  it.each<[string, string, string, number]>([
    ['Nano Machine - Chapter 190 - Flame Comics', 'https://flamecomics.xyz/nano-machine-chapter-190/', 'Nano Machine', 190],
    ["Read Omniscient Reader's Viewpoint Chapter 205 Online Free - ManhwaClan", 'https://manhwaclan.com/manga/omniscient-readers-viewpoint/chapter-205/', "Omniscient Reader's Viewpoint", 205],
    ['The Breaker: Eternal Force - Chapter 79 - Hivetoon', 'https://hivetoon.com/series/the-breaker-eternal-force/chapter-79', 'The Breaker: Eternal Force', 79],
    ['86 - Eighty Six Chapter 42 - MangaBuddy', 'https://mangabuddy.com/86-eighty-six/chapter-42', '86 - Eighty Six', 42],
    ['Kaiju No. 8 Chapter 98.5 - Read Kaiju No. 8 Manga Online', 'https://kaijuno8.online/manga/kaiju-no-8-chapter-98-5/', 'Kaiju No. 8', 98.5],
    ['Dandadan Chapitre 150,5 - Sushiscan', 'https://sushiscan.net/dandadan-chapitre-150-5/', 'Dandadan', 150.5],
    ['Chapter 99 | Eleceed | ManhwaFreak', 'https://manhwa-freak.com/eleceed-chapter-99/', 'Eleceed', 99],
    ['Chapter 12.5 - Spy x Family - Read Manga', 'https://readspyxfamily.com/manga/spy-x-family-chapter-12-5/', 'Spy x Family', 12.5],
    ['Berserk Chapter 375 - MangaKatana', 'https://mangakatana.com/manga/berserk.1234/c375', 'Berserk', 375],
    ['Lookism Ep 412 - WebtoonScan', 'https://www.webtoonscan.com/read?series=lookism&ep=412', 'Lookism', 412],
    ['Eleceed Ch. 300 | ReadM', 'https://readm.today/manga/eleceed/300/all-pages', 'Eleceed', 300],
  ])(
    'should record the scan read on a website outside the catalog when the page title is "%s"',
    async (pageTitle, url, title, chapter) => {
      const { recordVisitedPage, scans, crashReporter } = setUp();

      await recordVisitedPage.execute({ pageTitle, url });

      expect(await scans()).toEqual([aScan({ title, chapter, url, readAt: NOW })]);
      expect(crashReporter.reportedPages).toEqual([]);
    },
  );

  // prettier-ignore
  it.each([
    ['the overview page of a scan', 'Nano Machine - Flame Comics', 'https://flamecomics.xyz/series/nano-machine/'],
    ['a page whose url does not confirm the chapter of its title', 'Martial Peak Manga - Read Martial Peak Chapter 3800 Online', 'https://www.mangago.me/read-manga/martial_peak/'],
    ['a search for a chapter', 'solo leveling chapter 110 - Google Search', 'https://www.google.com/search?q=solo+leveling+chapter+110'],
    ['a news article about a bankruptcy', 'Party City files for Chapter 11 bankruptcy - Reuters', 'https://www.reuters.com/business/retail-consumer/party-city-files-chapter-11-bankruptcy-2023-01-17/'],
    ['an article about the spoilers of a chapter', 'Solo Leveling Chapter 110 Spoilers & Raw Scans - Manga Thrill', 'https://mangathrill.com/solo-leveling-chapter-110-spoilers-raw-scans/'],
    ['a chapter of a book on a website unrelated to scans', 'Genesis Chapter 1 - King James Bible Online', 'https://www.kingjamesbibleonline.org/Genesis-Chapter-1/'],
    ['an anime episode', 'Watch One Piece Episode 1100 English Sub - GogoAnime', 'https://gogoanime3.co/one-piece-episode-1100'],
    ['a cartoon episode', 'Adventure Time Episode 12 - KimCartoon', 'https://kimcartoon.li/Cartoon/Adventure-Time/Episode-12'],
    ['a news page about a scandal', 'Celebrity Scandal: Chapter 3 - The Fallout | Daily Gossip', 'https://dailygossip.example/celebrity-scandal/chapter-3/'],
    ['a novel chapter', 'Read Lord of the Mysteries Chapter 12 Online - NovelBin', 'https://novelbin.me/novel-book/lord-of-the-mysteries/chapter-12'],
    ['a wiki page about a chapter', 'Chapter 110 | Solo Leveling Wiki | Fandom', 'https://solo-leveling.fandom.com/wiki/Chapter_110'],
    ['a discussion of a chapter', '[DISC] Solo Leveling - Chapter 110 : r/manga', 'https://www.reddit.com/r/manga/comments/xyz789/disc_solo_leveling_chapter_110/'],
    ['a lesson of an online course', 'Chapter 3 - Introduction to Manga Drawing | Udemy', 'https://www.udemy.com/course/manga-drawing/learn/lecture/chapter-3'],
    ['a tutorial whose title is missing from its url', 'Chapter 7 - Manga Studio Tutorial: Inking | Clip Studio Tips', 'https://tips.clip-studio.com/en-us/articles/chapter-7'],
  ])(
    'should ignore the page of a website outside the catalog without reporting it when it is %s',
    async (_, pageTitle, url) => {
      const { recordVisitedPage, scans, crashReporter } = setUp();

      await recordVisitedPage.execute({ pageTitle, url });

      expect(await scans()).toEqual([]);
      expect(crashReporter.reportedPages).toEqual([]);
    },
  );

  // prettier-ignore
  it.each<[string, object, string, number]>([
    ['its url is an opaque id and its structured data names the series', { pageTitle: "Omniscient Reader's Viewpoint - Prologue - Chapter 0 - Flame Comics", url: 'https://flamecomics.xyz/series/2/0c9db8012fbd1257', ogTitle: "Omniscient Reader's Viewpoint - Prologue - Chapter 0 - Flame Comics", structuredData: [{ type: 'Organization', name: 'Flame Comics' }, { type: 'Chapter', name: "Omniscient Reader's Viewpoint - Prologue - Chapter 0", headline: 'Prologue' }, { type: 'CreativeWorkSeries', name: "Omniscient Reader's Viewpoint" }] }, "Omniscient Reader's Viewpoint", 0],
    ['its tab title is one chapter ahead of its heading, selected chapter and url', { pageTitle: 'Chapter 3 - Rakuen wo Mezashite - ManhwaClan', url: 'https://www.manhwafan.com/manga/rakuen-wo-mezashite/chapter-2', ogTitle: 'Chapter 3 - Rakuen wo Mezashite - ManhwaClan', heading: 'Rakuen wo Mezashite - Chapter 2: Depression and Mania', breadcrumb: 'Home Rakuen wo Mezashite Chapter 2: Depression and Mania', selectedOptions: ['Chapter 2'] }, 'Rakuen wo Mezashite', 2],
    ['its structured data names the series with HTML entities', { pageTitle: 'I’ll Retire After Saving the World Chapter 107 – Akaza Scans', url: 'https://akazascans.org/ill-retire-after-saving-the-world-chapter-107/', structuredData: [{ type: 'ListItem', name: 'I&#8217;ll Retire After Saving the World Chapter 107' }, { type: 'ComicSeries', name: 'I&#8217;ll Retire After Saving the World' }] }, "I'll Retire After Saving the World", 107],
    ['its chapters are numbered again in each volume', { pageTitle: 'Читать Том 8. Глава 1 манги Гон бесплатно — InkStory', url: 'https://inkstory.net/content/gon/881370cc-55e6-443e-946a-03277876ad42', ogTitle: 'Читать Том 8. Глава 1 манги Гон бесплатно', structuredData: [{ type: 'ListItem', name: 'Гон', position: 3 }, { type: 'Chapter', name: 'Том 8. Глава 1' }] }, 'Гон', 1],
    ['its tab title names the series after the chapter and a connector word', { pageTitle: 'Lire le chapitre 144 de Kindergarten Wars — Manga Nova', url: 'https://www.manga-nova.com/lecture-en-ligne/kindergarten-wars/chapitre/144' }, 'Kindergarten Wars', 144],
    ['its tab title announces the next chapter', { pageTitle: 'Otto no Yuigon ga "Doujinshi Kake" Datta Mono de Chap 3: Creativity Wall and Memories Next Chap 4', url: 'https://www.zinmanga.net/manga/otto-no-yuigon-ga-doujinshi-kake-datta-mono-de/chapter-3' }, 'Otto no Yuigon ga "Doujinshi Kake" Datta Mono de', 3],
    ['its url glues a post id to the chapter number', { pageTitle: "Baca I Became a Human's Daughter Chapter 58 Bahasa Indonesia - Kiryuu ID", url: 'https://v7.kiryuu.to/manga/i-became-a-humans-daughter/chapter-58.826511/' }, "I Became a Human's Daughter", 58],
    ['its tab title has no chapter but its breadcrumb and selected chapter have', { pageTitle: 'Lire Mariage Toxine Scan FR - Mangas Origines', url: 'https://mangas-origines.fr/oeuvre/marriage-toxin/chapitre-183/', ogTitle: 'Mariage Toxine Scan FR - Lire le manga sur Mangas Origines', breadcrumb: 'Accueil Catalogue Mariage Toxine Chapitre 183', selectedOptions: ['Chapitre 183', '1/18'] }, 'Mariage Toxine', 183],
  ])(
    'should record the reading its page signals agree on when %s',
    async (_, message, title, chapter) => {
      const { recordVisitedPage, scans, crashReporter } = setUp();
      const page = signalsOf(contentScriptMessage(message));

      await recordVisitedPage.execute(page);

      expect(await scans()).toEqual([
        aScan({ title, chapter, url: page.url, readAt: NOW }),
      ]);
      expect(crashReporter.reportedPages).toEqual([]);
    },
  );

  // prettier-ignore
  it.each<[string, object]>([
    ['a novel chapter of a scan website', { pageTitle: 'Chapter 19: Fan Hearts and True Hearts (2) - Crazy Doctor [19+ Uncensored Edition] | DivaScans', url: 'https://divascans.org/series/novel/crazy-doctor-19-uncensored-edition/chapter/19', ogTitle: 'Chapter 19: Fan Hearts and True Hearts (2) - Crazy Doctor [19+ Uncensored Edition]', structuredData: [{ type: 'ListItem', name: 'Crazy Doctor [19+ Uncensored Edition]' }, { type: 'ListItem', name: 'Chapter 19' }] }],
    ['a chapter whose tab title is the tagline of the website', { pageTitle: 'AstraToons - Leia seus mangás e webtoons favoritos online com a melhor qualidade.', url: 'https://new.astratoons.com/comics/o-cacador-de-destinos-rank-f/capitulo/95', ogTitle: 'AstraToons - Leia seus mangás e webtoons favoritos online com a melhor qualidade.', heading: 'Capítulo 95' }],
    ['a chapter whose series is named only in its url', { pageTitle: '99 | Team-X', url: 'https://olympustaff.com/series/the-academys-sashimi-sword-master/99', heading: '99', selectedOptions: ['فصل رقم : 99'] }],
    ['a chapter whose tab title alone shows the chapter number', { pageTitle: '목숨을 다해 꼬셔라 - 31화 | 카카오웹툰', url: 'https://webtoon.kakao.com/viewer/%EB%AA%A9%EC%88%A8%EC%9D%84-%EB%8B%A4%ED%95%B4-%EA%BC%AC%EC%85%94%EB%9D%BC-032/347694', ogTitle: '목숨을 다해 꼬셔라 - 31화 | 카카오웹툰' }],
  ])(
    'should ignore the page of a website outside the catalog without reporting it when it is %s',
    async (_, message) => {
      const { recordVisitedPage, scans, crashReporter } = setUp();

      await recordVisitedPage.execute(signalsOf(contentScriptMessage(message)));

      expect(await scans()).toEqual([]);
      expect(crashReporter.reportedPages).toEqual([]);
    },
  );

  it('should keep the reading when the tab title falls back to the website name after the chapter was recorded', async () => {
    const { recordVisitedPage, scans } = setUp();
    const url = 'https://arvenscans.net/series/secret-family/chapter-80';

    await recordVisitedPage.execute(
      signalsOf(
        contentScriptMessage({
          pageTitle: 'Secret Family — Chapter 80 | ARVENSCANS',
          url,
        }),
      ),
    );
    await recordVisitedPage.execute(
      signalsOf(
        contentScriptMessage({
          pageTitle: 'ARVENSCANS',
          url,
          ogTitle: 'ARVENSCANS',
          heading: 'Chapter reader',
        }),
      ),
    );

    expect(await scans()).toEqual([
      aScan({ title: 'Secret Family', chapter: 80, url, readAt: NOW }),
    ]);
  });

  it('should leave the library unchanged when the content script sends the same page again', async () => {
    const { recordVisitedPage, scans } = setUp();
    const message = {
      pageTitle: 'Nano Machine - Chapter 190 - Flame Comics',
      url: 'https://flamecomics.xyz/nano-machine-chapter-190/',
      ogTitle: 'Nano Machine - Chapter 190 - Flame Comics',
      structuredData: [],
      selectedOptions: [],
    };
    await recordVisitedPage.execute(signalsOf(message));
    const recordedOnce = await scans();

    await recordVisitedPage.execute(signalsOf(message));

    expect(await scans()).toEqual(recordedOnce);
    expect(recordedOnce).toEqual([
      aScan({
        title: 'Nano Machine',
        chapter: 190,
        url: message.url,
        readAt: NOW,
      }),
    ]);
  });

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

  // prettier-ignore
  it.each([
    ['case', 'Mount Hua sect Genius', 'Mount hua Sect genius'],
    ['a stored typographic apostrophe', 'The Player That Can’t Level Up', "The Player That Can't Level Up"],
    ['an article', 'The Beginning After the End', 'Beginning After The End'],
    ['spacing', 'Nano Machine', 'Nanomachine'],
    ['punctuation', 'The Breaker - New Waves', 'The Breaker: New Waves'],
    ['diacritics', 'Wu Lian Dian Feng', 'Wǔ Liàn Diānfēng'],
    ['a multiplication sign', 'Spy x Family', 'SPY×FAMILY'],
    ['an ampersand', 'Tales of Demons and Gods', 'Tales of Demons & Gods'],
    ['a roman numeral', 'Douluo Dalu II: Jueshi Tangmen', 'Douluo Dalu 2 - Jueshi Tangmen'],
    ['word order and a possessive', 'Return of the Mount Hua Sect', "Mount Hua Sect's Return"],
    ['a plural', 'Tales of Demons and Gods', 'Tale of Demons and Gods'],
  ])(
    'should update the followed scan and keep its title when the title read differs by %s',
    async (_, followedTitle, readTitle) => {
      const { recordVisitedPage, scans } = setUp([
        aScan({ title: followedTitle, chapter: 1 }),
      ]);

      await recordVisitedPage.execute(asuraPage(readTitle, '2'));

      expect(await scans()).toEqual([
        aScan({ title: followedTitle, chapter: 2, url: asuraUrl('2'), readAt: NOW }),
      ]);
    },
  );

  // prettier-ignore
  it.each([
    ['a sequel', 'Solo Leveling', 'Solo Leveling: Ragnarok'],
    ['a numbered sequel', 'The Breaker 2', 'The Breaker 3'],
    ['a sequel numbered in roman numerals', 'Kingdom Hearts II', 'Kingdom Hearts III'],
    ['a prequel', 'Jujutsu Kaisen', 'Jujutsu Kaisen 0'],
    ['a remake', "The Novel's Extra", "The Novel's Extra (Remake)"],
    ['a novel edition', 'Martial God Asura', 'Martial God Asura (Novel)'],
    ['a sequel marked by a suffix', 'Tokyo Ghoul', 'Tokyo Ghoul:re'],
    ['a look-alike title', 'Return of the Mount Hua Sect', "Mount Hua Sect's Genius Phantom Swordsman"],
    ['a look-alike title sharing its first words', 'Omniscient Reader', "Omniscient First-Person's Viewpoint"],
  ])(
    'should follow a new scan and leave the followed one unchanged when the title read is %s of it',
    async (_, followedTitle, readTitle) => {
      const followed = aScan({ title: followedTitle, chapter: 1 });
      const { recordVisitedPage, scans } = setUp([followed]);

      await recordVisitedPage.execute(asuraPage(readTitle, '2'));

      expect(await scans()).toEqual([
        followed,
        aScan({ title: readTitle, chapter: 2, url: asuraUrl('2'), readAt: NOW }),
      ]);
    },
  );

  it('should merge the followed scans with the same series key into the latest reading, favorite if either was', async () => {
    const latest = aScan({
      title: 'The Beginning After the End',
      chapter: 170,
      url: 'https://asuracomic.net/series/tbate/chapter/170',
      readAt: new Date('2024-12-01T00:00:00Z'),
    });
    const other = aScan({ title: 'Solo Leveling', chapter: 200 });
    const { recordVisitedPage, scans } = setUp([
      aScan({
        title: 'Beginning After The End',
        chapter: 150,
        url: 'https://flamecomics.xyz/beginning-after-the-end-chapter-150/',
        readAt: new Date('2024-06-01T00:00:00Z'),
        isFavorite: true,
      }),
      other,
      latest,
    ]);

    await recordVisitedPage.execute(asuraPage('Eleceed', '2'));

    expect(await scans()).toEqual([
      { ...latest, isFavorite: true },
      other,
      aScan({ title: 'Eleceed', chapter: 2, url: asuraUrl('2'), readAt: NOW }),
    ]);
  });

  it.each([
    ['only the earlier scan is rated', 4, undefined, 4],
    ['only the latest scan is rated', undefined, 8, 8],
    ['both scans are rated', 4, 8, 8],
  ])(
    'should keep the rating of the merged scans when %s',
    async (_, earlierRating, latestRating, mergedRating) => {
      const latest = aScan({
        title: 'Nano Machine',
        chapter: 190,
        readAt: new Date('2024-12-01T00:00:00Z'),
        rating: latestRating,
      });
      const { recordVisitedPage, scans } = setUp([
        latest,
        aScan({
          title: 'NANO MACHINE!',
          chapter: 150,
          readAt: new Date('2024-06-01T00:00:00Z'),
          rating: earlierRating,
        }),
      ]);

      await recordVisitedPage.execute(asuraPage('Eleceed', '2'));

      expect(await scans()).toEqual([
        { ...latest, rating: mergedRating },
        aScan({
          title: 'Eleceed',
          chapter: 2,
          url: asuraUrl('2'),
          readAt: NOW,
        }),
      ]);
    },
  );

  it('should leave a merged library unchanged when it is loaded and saved again', async () => {
    const latest = aScan({
      title: 'Return of The Mount Hua Sect',
      chapter: 121,
      readAt: new Date('2024-12-01T00:00:00Z'),
    });
    const eleceed = aScan({
      title: 'Eleceed',
      chapter: 2,
      url: asuraUrl('2'),
      readAt: NOW,
    });
    const { recordVisitedPage, scans } = setUp([
      aScan({
        title: 'Return of the Mount Hua Sect',
        chapter: 120,
        readAt: new Date('2024-06-01T00:00:00Z'),
      }),
      latest,
    ]);

    await recordVisitedPage.execute(asuraPage('Eleceed', '2'));
    await recordVisitedPage.execute(asuraPage('Eleceed', '2'));

    expect(await scans()).toEqual([latest, eleceed]);
  });

  it('should update the scan whose title matches exactly when several followed scans are the same series', async () => {
    const spaced = aScan({ title: 'Nano Machine', chapter: 1 });
    const joined = aScan({ title: 'Nanomachine', chapter: 1 });
    const { recordVisitedPage, scans } = setUp([spaced, joined]);

    await recordVisitedPage.execute(asuraPage('Nanomachine', '2'));

    expect(await scans()).toEqual([
      spaced,
      aScan({
        title: 'Nanomachine',
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

const contentScriptMessage = (signals: object) => ({
  structuredData: [],
  selectedOptions: [],
  ...signals,
});

const signalsOf = (message: unknown) => {
  const signals = parsePageSignals(message);
  if (!signals) {
    throw new Error('The content script message does not parse');
  }
  return signals;
};

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

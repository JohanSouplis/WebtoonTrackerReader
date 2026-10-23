import { parsePageSignals } from '../../../page-signals-message';
import { ScanSnapshot } from '../domain/scan-library';
import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryCrashReporter } from '../gateways/in-memory/in-memory-crash-reporter.gateway';
import { InMemoryReportSettingsRepository } from '../gateways/in-memory/in-memory-report-settings-repository.gateway';
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
      'Lore Olympus | WEBTOON',
      'https://www.webtoons.com/en/romance/lore-olympus/list?title_no=1320',
    ],
    [
      'รีวิว - 153 | เอาชีวิตรอดในเกมฉบับคนเถื่อน',
      'https://www.webtoons.com/th/fantasy/surviving-the-game-as-a-barbarian/%E0%B8%A3%E0%B8%A7%E0%B8%A7/viewer?title_no=5530&episode_no=153',
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

  it('should report no page when the reader turned parse reports off', async () => {
    const { recordVisitedPage, crashReporter } = setUp(
      [],
      new InMemoryReportSettingsRepository({ sendsParseReports: false }),
    );

    await recordVisitedPage.execute({
      pageTitle: 'Lore Olympus | WEBTOON',
      url: 'https://www.webtoons.com/en/romance/lore-olympus/list?title_no=1320',
    });

    expect(crashReporter.reportedPages).toEqual([]);
  });

  it.each([
    [
      'a redirect',
      'Disqus Comments',
      'https://disqus.com/embed/comments/?base=default&f=asura-scans-13&t_i=chapter-135-85&t_u=https%3A%2F%2Fasuracomic.net%2Fseries%2Facademys-genius-swordmaster-73f07cea%2Fchapter%2F85&t_e=Academy%27s%20Genius%20Swordmaster&t_d=Academy%27s%20Genius%20Swordmaster%20Chapter%2085%20-%20Asura%20Scans&t_t=Academy%27s%20Genius%20Swordmaster&s_o=default#version=2f54d43b17c298fa4a839abab8ed97ea',
    ],
    ['the home page of the website', 'Asura Scans', 'https://asuracomic.net/'],
    [
      'a chapter page whose title still shows only the website name',
      'MangaDex',
      'https://mangadex.org/chapter/8160d350-19a9-499c-88a8-c20a1cd7fe8b',
    ],
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
      'Solo Leveling - Chapter 3 - MANGA DISTRICT - Read Scan - Manhwa',
      'https://mangadistrict.com/series/undefined/chapter-3/',
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
    ['Scan One Piece 1196', 'https://lelscans.net/scan-one-piece/1196', 'One Piece', 1196],
    ['Sonic The Hedgehog #88 - ChaosTrad', 'https://chaostrad.fr/comics/sonic-idw/88', 'Sonic The Hedgehog', 88],
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
    ['a novel chapter whose tab title reads like a scan chapter', 'Super God System - chapter 85 - Dragon Tea', 'https://dragontea.ink/novel/super-god-system/chapter-85/'],
    ['a wiki page about a chapter', 'Chapter 110 | Solo Leveling Wiki | Fandom', 'https://solo-leveling.fandom.com/wiki/Chapter_110'],
    ['a discussion of a chapter', '[DISC] Solo Leveling - Chapter 110 : r/manga', 'https://www.reddit.com/r/manga/comments/xyz789/disc_solo_leveling_chapter_110/'],
    ['a lesson of an online course', 'Chapter 3 - Introduction to Manga Drawing | Udemy', 'https://www.udemy.com/course/manga-drawing/learn/lecture/chapter-3'],
    ['a tutorial whose title is missing from its url', 'Chapter 7 - Manga Studio Tutorial: Inking | Clip Studio Tips', 'https://tips.clip-studio.com/en-us/articles/chapter-7'],
    ['a page of a list whose url repeats the page number', 'Manhwa List - Page 12 - ManhwaClan', 'https://manhwaclan.com/manga/page/12/'],
    ['a volume whose url repeats the volume number', 'Berserk Vol. 3 - Manga Reader', 'https://mangareader.example/manga/berserk/3'],
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
    ['its tab title joins several names of the series and its heading shows one of them', { pageTitle: 'Чтение Манга Чёрный Клевер - Black Clover - Black Clover онлайн. Глава 393 - ZazaZa', url: 'https://a.zazaza.me/chernyi_klever__A5327/vol38/393', heading: 'Манга Чёрный Клевер 38 - 393' }, 'Чёрный Клевер', 393],
    ['its url is an opaque id and a section heading repeats the chapter while another names the series', { pageTitle: '金華の百年 - 枝屋初 / 第1話 | マグコミ', url: 'https://magcomi.com/episode/12207421984222612497', ogTitle: '金華の百年 - 枝屋初 / 第1話 | マグコミ', ogSiteName: 'マグコミ｜マッグガーデン発のWEBマンガサイト', heading: 'マグコミ – Mag Garden Comic Online', headings: ['マグコミ – Mag Garden Comic Online', 'NEW 無料配信中のおすすめ作品', '第1話', '金華の百年', 'マグコミ'] }, '金華の百年', 1],
    ['its tab title is the tagline of the website and a heading repeats the series of its url', { pageTitle: 'AstraToons - Leia seus mangás e webtoons favoritos online com a melhor qualidade.', url: 'https://new.astratoons.com/comics/o-cacador-de-destinos-rank-f/capitulo/95', heading: 'Capítulo 95', headings: ['Lista de Capítulos', 'Capítulo 95', 'Reportar um problema', 'O Caçador de Destinos Rank F'] }, 'O Caçador de Destinos Rank F', 95],
    ['its tab title puts the chapter in brackets before the series and its author', { pageTitle: '[第12話] 魔王の休日 - 山田太郎 | マンガサイト', url: 'https://manga.example/episode/90210', ogSiteName: 'マンガサイト', headings: ['マンガサイト', '[第12話] 魔王の休日', '魔王の休日', '山田太郎'] }, '魔王の休日', 12],
    ['only the navigation of the website names comics', { pageTitle: 'Ch.183 | Marriage Toxin | Blue Solo', url: 'https://bluesolo.org/read/marriage-toxin/fr/ch/183', ogSiteName: 'Blue Solo', links: [{ href: 'https://bluesolo.org/', text: 'Blue Solo' }, { href: 'https://bluesolo.org/mangas', text: 'Tous les mangas' }] }, 'Marriage Toxin', 183],
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
    ['a chapter whose only link to a series names part of the series of its url', { pageTitle: 'Chapitre 41', url: 'https://scanreader.net/chapitre/chapitre-41-the-abyssal-seed/', ogTitle: 'Chapitre 41', ogSiteName: 'Scan Reader', links: [{ href: 'https://scanreader.net/mangas/the-abyssal/', text: 'The Abyssal' }] }],
    ['a chapter whose tab title, og:title and heading all show the name of the chapter, not of the series', { pageTitle: 'Swimsuits | Team-X', url: 'https://teamx.example/series/my-dragon-girlfriend/8', ogTitle: 'Swimsuits', ogSiteName: 'Team-X Manga', heading: 'Swimsuits', selectedOptions: ['Chapter 8'] }],
    ['a chapter of a website whose navigation names novels next to manga', { pageTitle: 'The Primal Hunter Chapter 3', url: 'https://fictionsite.example/fiction/the-primal-hunter/chapter-3', links: [{ href: 'https://fictionsite.example/manga', text: 'Manga' }, { href: 'https://fictionsite.example/novels', text: 'Novels' }] }],
    ['a list whose selected page number the url repeats', { pageTitle: 'Latest Updates - Manga Corner', url: 'https://mangacorner.example/latest/2/', ogTitle: 'Latest Updates', selectedOptions: ['2'] }],
    ['a chapter whose tab title names the website, not the series, after the chapter', { pageTitle: 'Chapter 12 - Mangaku', url: 'https://mangaku.io/manga/the-tower-keeper/chapter-12/', structuredData: [{ type: 'ListItem', name: 'Mangaku', position: 1 }, { type: 'ListItem', name: 'Chapter 12', position: 2 }] }],
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

    await recordVisitedPage.execute(catalogPage('Title', '13'));

    expect(await scans()).toEqual([
      followed,
      aScan({
        title: 'Title',
        chapter: 13,
        url: catalogUrl('13'),
        readAt: NOW,
      }),
    ]);
  });

  it('should replace the chapter, url and date when a newer reading of a followed scan arrives', async () => {
    const { recordVisitedPage, scans } = setUp([
      aScan({ title: 'Title', chapter: 1 }),
    ]);

    await recordVisitedPage.execute(catalogPage('Title', '2'));

    expect(await scans()).toEqual([
      aScan({ title: 'Title', chapter: 2, url: catalogUrl('2'), readAt: NOW }),
    ]);
  });

  it('should keep the latest chapter when an older reading of the same scan arrives', async () => {
    const followed = aScan({
      title: 'Title',
      chapter: 1,
      readAt: new Date('2026-01-01T00:00:00Z'),
    });
    const { recordVisitedPage, scans } = setUp([followed]);

    await recordVisitedPage.execute(catalogPage('Title', '2'));

    expect(await scans()).toEqual([followed]);
  });

  it.each([
    ['the chapter is not a number', 'Episode abc | Title'],
    ['the title is empty', 'Episode 3 | '],
    ['the title and the chapter are empty', 'Episode x | '],
  ])(
    'should leave the followed scans unchanged when %s',
    async (_, pageTitle) => {
      const followed = aScan({ title: 'Title', chapter: 1 });
      const { recordVisitedPage, scans } = setUp([followed]);

      await recordVisitedPage.execute({ pageTitle, url: catalogUrl('3') });

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

      await recordVisitedPage.execute(catalogPage(readTitle, '2'));

      expect(await scans()).toEqual([
        aScan({ title: followedTitle, chapter: 2, url: catalogUrl('2'), readAt: NOW }),
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

      await recordVisitedPage.execute(catalogPage(readTitle, '2'));

      expect(await scans()).toEqual([
        followed,
        aScan({ title: readTitle, chapter: 2, url: catalogUrl('2'), readAt: NOW }),
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

    await recordVisitedPage.execute(catalogPage('Eleceed', '2'));

    expect(await scans()).toEqual([
      { ...latest, isFavorite: true },
      other,
      aScan({
        title: 'Eleceed',
        chapter: 2,
        url: catalogUrl('2'),
        readAt: NOW,
      }),
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

      await recordVisitedPage.execute(catalogPage('Eleceed', '2'));

      expect(await scans()).toEqual([
        { ...latest, rating: mergedRating },
        aScan({
          title: 'Eleceed',
          chapter: 2,
          url: catalogUrl('2'),
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
      url: catalogUrl('2'),
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

    await recordVisitedPage.execute(catalogPage('Eleceed', '2'));
    await recordVisitedPage.execute(catalogPage('Eleceed', '2'));

    expect(await scans()).toEqual([latest, eleceed]);
  });

  it('should update the scan whose title matches exactly when several followed scans are the same series', async () => {
    const spaced = aScan({ title: 'Nano Machine', chapter: 1 });
    const joined = aScan({ title: 'Nanomachine', chapter: 1 });
    const { recordVisitedPage, scans } = setUp([spaced, joined]);

    await recordVisitedPage.execute(catalogPage('Nanomachine', '2'));

    expect(await scans()).toEqual([
      spaced,
      aScan({
        title: 'Nanomachine',
        chapter: 2,
        url: catalogUrl('2'),
        readAt: NOW,
      }),
    ]);
  });

  it('should fill the url of a followed scan when its url is missing', async () => {
    const { recordVisitedPage, scans } = setUp([
      aScan({ title: 'Title', chapter: 1, url: '' }),
    ]);

    await recordVisitedPage.execute(catalogPage('Title', '1'));

    expect(await scans()).toEqual([
      aScan({ title: 'Title', chapter: 1, url: catalogUrl('1'), readAt: NOW }),
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

    await recordVisitedPage.execute(catalogPage('Title', '1'));

    expect(await scans()).toEqual([
      aScan({
        title: 'Title',
        chapter: 1,
        url: catalogUrl('1'),
        readAt: NOW,
        isFavorite: true,
        rating: 9,
      }),
    ]);
  });
  it('should read the series from the link to its page when the tab title shows only the chapter', async () => {
    const { recordVisitedPage, scans } = setUp();
    const url = 'https://scanreader.net/chapitre/chapitre-41-the-abyssal-seed/';
    const seriesUrl = 'https://scanreader.net/mangas/the-abyssal-seed/';

    await recordVisitedPage.execute(
      signalsOf(
        contentScriptMessage({
          pageTitle: 'Chapitre 41',
          url,
          ogTitle: 'Chapitre 41',
          ogSiteName: 'Scan Reader',
          links: [{ href: seriesUrl, text: 'The Abyssal seed' }],
        }),
      ),
    );

    expect(await scans()).toEqual([
      aScan({
        title: 'The Abyssal seed',
        chapter: 41,
        url,
        readAt: NOW,
        seriesUrl,
      }),
    ]);
  });

  it('should keep the series page the chapter page links to', async () => {
    const { recordVisitedPage, scans } = setUp();

    await recordVisitedPage.execute({
      ...catalogPage('Title', '12'),
      links: [{ href: CATALOG_SERIES_URL, text: 'Title', isBreadcrumb: true }],
    });

    expect(await scans()).toEqual([
      aScan({
        chapter: 12,
        url: catalogUrl('12'),
        readAt: NOW,
        seriesUrl: CATALOG_SERIES_URL,
      }),
    ]);
  });

  it.each`
    link                                                                                                                          | reason
    ${{ text: 'Title Episode 11', href: 'https://www.webtoons.com/en/fantasy/title/episode-11/viewer?title_no=1&episode_no=11' }} | ${'names a chapter'}
    ${{ text: 'Title', href: 'https://www.tappytoon.com/en/comics/title' }}                                                       | ${'leaves the website'}
    ${{ text: 'Title', href: 'https://www.webtoons.com/' }}                                                                       | ${'is the home page'}
  `(
    'should not keep a series page when the only link $reason',
    async ({ link }) => {
      const { recordVisitedPage, scans } = setUp();

      await recordVisitedPage.execute({
        ...catalogPage('Title', '12'),
        links: [{ ...link, isBreadcrumb: false }],
      });

      expect((await scans())[0].seriesUrl).toBeUndefined();
    },
  );

  // prettier-ignore
  it.each`
    website                  | pageTitle                              | url                                                                                        | seriesUrl
    ${'the same website'}    | ${'Episode 13 | Title'}                 | ${'https://www.webtoons.com/en/fantasy/title/episode-13/viewer?title_no=1&episode_no=13'} | ${'https://www.webtoons.com/en/fantasy/title/list?title_no=1'}
    ${'another website'}     | ${'Title Chapter 13 - Asura Scans'}    | ${'https://asuracomic.net/series/title-27f19aba/chapter/13'}                               | ${undefined}
  `(
    'should keep the series page $seriesUrl when a newer reading without one comes from $website',
    async ({ pageTitle, url, seriesUrl }) => {
      const { recordVisitedPage, scans } = setUp([
        aScan({
          url: catalogUrl('12'),
          readAt: new Date(0),
          seriesUrl: CATALOG_SERIES_URL,
        }),
      ]);

      await recordVisitedPage.execute({ pageTitle, url });

      expect(await scans()).toMatchObject([{ chapter: 13, seriesUrl }]);
    },
  );
});

const NOW = new Date('2025-01-01T09:00:10Z');
const CATALOG_SERIES_URL =
  'https://www.webtoons.com/en/fantasy/title/list?title_no=1';

const catalogUrl = (chapter: string): string =>
  `https://www.webtoons.com/en/fantasy/title/episode-${chapter}/viewer?title_no=1&episode_no=${chapter}`;

const catalogPage = (title: string, chapter: string) => ({
  pageTitle: `Episode ${chapter} | ${title}`,
  url: catalogUrl(chapter),
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

const setUp = (
  followed: ScanSnapshot[] = [],
  reportSettings = new InMemoryReportSettingsRepository(),
) => {
  const scanRepository = new InMemoryScanRepository(followed);
  const crashReporter = new InMemoryCrashReporter();
  return {
    crashReporter,
    scans: async () => (await scanRepository.load()).snapshot(),
    recordVisitedPage: new RecordVisitedPageUseCase(
      scanRepository,
      crashReporter,
      reportSettings,
      new FixedClock(NOW),
    ),
  };
};

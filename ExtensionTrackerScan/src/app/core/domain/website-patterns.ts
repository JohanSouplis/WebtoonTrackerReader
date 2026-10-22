export type WebsitePattern = {
  readonly host: string;
  readonly formats: readonly {
    readonly pageTitle: string;
    readonly url?: string;
  }[];
  readonly excludedUrlPart?: string;
  readonly excludedTitlePart?: string;
};

export const WEBSITE_PATTERNS: readonly WebsitePattern[] = [
  {
    host: 'toonily.com',
    formats: [
      {
        pageTitle: 't§ Manga - Chapter §c§ - ',
      },
      {
        pageTitle: 't§ Manga - Chapitre §c§ - ',
      },
    ],
  },
  {
    host: 'asuracomic.net',
    formats: [
      {
        pageTitle: 't§ Chapter §c§ - Asura Scans',
      },
    ],
  },
  {
    host: 'manhuatop.org',
    formats: [
      {
        pageTitle: 't§ Manhwa  -  Chapter §c§ - Top Manhua',
      },
      {
        pageTitle: 't§ Manhwa - Chapter §c§ - Top Manhua',
      },
    ],
  },
  {
    host: 'arvencomics.com',
    formats: [
      {
        pageTitle: 't§ Chapter §c§',
      },
    ],
  },
  {
    host: 'vortexscans.org',
    formats: [
      {
        pageTitle: 't§ Chapter §c§ - Vortex Scans',
      },
    ],
  },
  {
    host: 'manhuaus.com',
    formats: [
      {
        pageTitle: 't§ - Chapter §c§ - MANHUAUS.COM',
      },
    ],
  },
  {
    host: 'manhuafast.net',
    formats: [
      {
        pageTitle: 't§ - Chapter §c§ - MANHUAFAST.NET',
      },
    ],
  },
  {
    host: 'comick.io',
    formats: [
      {
        pageTitle: 'Chapter §c§ (English) - §t§ | ComicK',
      },
    ],
  },
  {
    host: 'reaper-scan.net',
    formats: [
      {
        pageTitle: 'Read §t§ Chapter §c§ ⚡ Reaper-scan | Read Manga Everyday',
      },
    ],
  },
  {
    host: 'en-thunderscans.com',
    formats: [
      {
        pageTitle: 't§ Chapter §c§ – Thunderscans EN',
      },
    ],
  },
  {
    host: 'dragontea.ink',
    formats: [
      {
        pageTitle: 't§ - chapter §c§ - Dragon Tea',
      },
    ],
  },
  {
    host: 'toongod.org',
    formats: [
      {
        pageTitle: 'Read §t§ Chapter §c§ Online - ToonGod',
      },
    ],
  },
  {
    host: 'mangadex.org',
    formats: [
      {
        pageTitle: 'Chapter §c§ - §t§ - MangaDex',
      },
      {
        pageTitle: 'Capítulo §c§ - §t§ - MangaDex',
      },
    ],
    excludedUrlPart: 'title',
    excludedTitlePart: 'Oneshot',
  },
  {
    host: 'chapmanganato.to',
    formats: [
      {
        pageTitle: 't§ Chapter §c§ - Manganato',
      },
    ],
  },
  {
    host: 'chapmanganelo.com',
    formats: [
      {
        pageTitle: 't§ Chapter §c§ - Manganelo',
      },
    ],
  },
  {
    host: 'scantrad-union.com',
    formats: [
      {
        pageTitle: 't§ - §c§ | Scantrad Union',
      },
    ],
  },
  {
    host: 'manta.net',
    formats: [
      {
        pageTitle: 'Episode §c§ - §t§ | Manta',
      },
    ],
  },
  {
    host: 'webtoons.com',
    formats: [
      {
        pageTitle: 'Episode §c§ | §t',
      },
      {
        pageTitle: 'Chapter §c§ | §t',
      },
      {
        pageTitle: 'Ep. §c§ | §t',
      },
      {
        pageTitle: 'Chapter §c§ | §t',
      },
      {
        pageTitle: 'Ep.§c§ | §t',
      },
      {
        pageTitle: 'Ep.§c§ - §c§ | §t',
      },
    ],
  },
  {
    host: 'tappytoon.com',
    formats: [
      {
        pageTitle: 'Read Episode §c§ - §t§  | Tappytoon',
      },
    ],
  },
  {
    host: 'mangapanda.in',
    formats: [
      {
        pageTitle: 'Read §t§ Chapter §c§ online free - MangaPanda.in',
      },
    ],
  },
  {
    host: 'toomics.com',
    formats: [
      {
        pageTitle: 't§ EP §c§ - Toomics',
      },
    ],
  },
  {
    host: 'comics.inkr.com',
    formats: [
      {
        pageTitle: 'Chapter §c§ • §t',
      },
    ],
  },
  {
    host: 'pocketcomics.com',
    formats: [
      {
        pageTitle: 't§ | Episode §c§ | POCKET COMICS',
      },
    ],
  },
  {
    host: 'bato.to',
    formats: [
      {
        pageTitle: 't§ - Chapter §c',
      },
      {
        pageTitle: 't§ - Episode §c',
      },
      {
        pageTitle: 't§ - Volume§ Y §Chapter §c',
      },
      {
        pageTitle: 't§ (Ch §c§',
      },
      {
        pageTitle: 't§ - episode §c§ - Read Free Manga Online at Bato.To',
      },
    ],
  },
  {
    host: 'mangapark',
    formats: [
      {
        pageTitle: 't§ - Chapter §c§ - Share Any Manga on MangaPark',
      },
      {
        pageTitle: 't§ - Ch.§c§ - Share Any Manga on MangaPark',
      },
      {
        pageTitle: 't§ - Vol.§ §Ch.§c§ - Share Any Manga on MangaPark',
      },
    ],
  },
  {
    host: 'manhuaplus.com',
    formats: [
      {
        pageTitle: 't§ - Chapter §c§ - ManhuaPlus',
      },
    ],
  },
  {
    host: 'manhuaplus.org',
    formats: [
      {
        pageTitle: 'Read §t§ Chapter §c§ [Read new chapter at ManhuaPlus]',
      },
    ],
  },
  {
    host: 'raijinscan',
    formats: [
      {
        pageTitle: 't§ - Chapter §c§ - Raijin Scan',
      },
      {
        pageTitle: 't§ - Chapitre §c§ - Raijin Scan',
      },
    ],
  },
  {
    host: 'mangaplus.shueisha.co.jp',
    formats: [
      {
        pageTitle: '[#§c§] §t§ | MANGA Plus',
      },
    ],
  },
  {
    host: 'mangainn.org',
    formats: [
      {
        pageTitle:
          'Read §t§ Comic Online § - §Chapter §c§ - Get the Latest Updates',
      },
    ],
  },
  {
    host: 'mangadistrict',
    formats: [
      {
        pageTitle: 't§ | MANGA DISTRICT',
        url: 'chapter-§c§/',
      },
    ],
  },
  {
    host: 'manhwahub',
    formats: [
      {
        pageTitle: 't§ Chapter §c§ - ManhwaHub',
      },
    ],
  },
  {
    host: 'mgeko.cc',
    formats: [
      {
        pageTitle: 'Manga: §t§ Chapter - §c§-',
      },
    ],
  },
  {
    host: 'templetoons',
    formats: [
      {
        pageTitle: 't§ - Chapter §c§ - Temple Scan',
      },
    ],
  },
  {
    host: '1st-kissmanga',
    formats: [
      {
        pageTitle: 't§ - Chapter §c§ - 1ST KISS MANGA',
      },
    ],
  },
  {
    host: 'mangafire.to',
    formats: [
      {
        pageTitle: 't§ chapter §c§ - Read Online on MangaFire',
      },
    ],
  },
  {
    host: 'kunmanga',
    formats: [
      {
        pageTitle: 't§ - Chapter §c§ - Kun Manga',
      },
    ],
  },
  {
    host: 'battwo.com',
    formats: [
      {
        pageTitle: 't§ - Volume§ §Chapter §c',
      },
    ],
  },
  {
    host: 'harimanga.me',
    formats: [
      {
        pageTitle: 't§ - Chapter §c§ - HARIMANGA',
      },
      {
        pageTitle: 't§ - chapter §c§ - HARIMANGA',
      },
    ],
  },
];

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
    host: 'comick',
    formats: [
      {
        pageTitle: 'Ch. §c§ (en) - §t§ - ',
      },
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
        pageTitle: 'EP §c§ | §t',
      },
      {
        pageTitle: '第§c§話§ | §t',
      },
    ],
  },
  {
    host: 'tappytoon.com',
    formats: [
      {
        pageTitle: 'Read Episode §c§ - §t§ | Tappytoon',
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
    host: 'mangaplus.shueisha.co.jp',
    formats: [
      {
        pageTitle: '[#§c§] §t§ | MANGA Plus',
      },
    ],
  },
  {
    host: 'mangadistrict',
    formats: [
      {
        pageTitle: 't§ - Chapter §c§ - MANGA DISTRICT',
      },
      {
        pageTitle: 't§ | MANGA DISTRICT',
        url: 'chapter-§c§/',
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
];

export const SUPPORTED_WEBSITES = WEBSITE_PATTERNS.map(({ host }) => host);

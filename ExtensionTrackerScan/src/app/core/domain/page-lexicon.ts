export const CHAPTER_WORDS = [
  'chapter',
  'chapitre',
  'capítulo',
  'capitulo',
  'capitolo',
  'chương',
  'kapitel',
  'episode',
  'épisode',
  'episodio',
  'bölüm',
  'bolum',
  'глава',
  'розділ',
  'الفصل',
  'فصل',
  'chap',
  'cap',
  'issue',
  'ch',
  'ep',
];

export const CHAPTER_SUFFIXES = ['話', '话', '章', '回', '화'];

export const URL_CHAPTER_WORDS = [
  'chapters',
  'chapter',
  'chapitre',
  'capitulo',
  'capitolo',
  'chuong',
  'kapitel',
  'bolum',
  'glava',
  'rozdil',
  'chap',
  'cap',
  'ch',
  'c',
  'episodes',
  'episode',
  'ep',
];

export const QUALIFIERS = [
  'online',
  'free',
  'vf',
  'fr',
  'en',
  'raw',
  'english',
  'eng',
  'vostfr',
  'español',
  'bahasa',
  'oku',
  'vip',
  'page',
  'next',
  'trailer',
  'manga',
  'scan',
  'ita',
  'مترجم',
];

export const OTHER_NUMBER_WORDS = [
  'page',
  'pagina',
  'página',
  'seite',
  'vol',
  'volume',
  'tome',
  'tomo',
  'том',
  'часть',
  'part',
  'season',
  'saison',
  'temporada',
];

export const TITLE_CONNECTORS = ['de', 'манги', 'манхвы', 'манхуа', 'من مانجا'];

export const READING_WORDS = [
  'manga',
  'manhwa',
  'manhua',
  'webtoon',
  'toon',
  'comic',
  'comics',
  'scan',
  'komik',
  'komix',
  'comix',
  'shojo',
  'shoujo',
];

export const READING_MARKS = [
  'truyentranh',
  '漫画',
  '漫畫',
  'マンガ',
  '만화',
  '웹툰',
  'манга',
  'манхв',
  'манги',
  'مانجا',
  'コミック',
];

export const READING_TYPES = ['ComicSeries', 'ComicIssue', 'ComicStory'];

export const OTHER_PAGE_TYPES = [
  'NewsArticle',
  'ReportageNewsArticle',
  'AnalysisNewsArticle',
  'Review',
  'DiscussionForumPosting',
  'TVEpisode',
  'TVSeries',
  'Movie',
  'VideoObject',
  'Product',
  'SearchResultsPage',
];

export const SERIES_TYPES = [
  'ComicSeries',
  'CreativeWorkSeries',
  'BookSeries',
  'Book',
];

export const WEBSITE_TYPES = [
  'WebSite',
  'Organization',
  'Corporation',
  'Person',
  'SoftwareApplication',
];

export const OTHER_MEDIA_WORDS = [
  'anime',
  'cartoon',
  'novel',
  'podcast',
  'wiki',
  'reddit',
  'youtube',
  'watch',
  'video',
];

export const ARTICLE_WORDS = [
  'review',
  'reviews',
  'spoiler',
  'spoilers',
  'discussion',
  'forum',
  'forums',
  'news',
  'release date',
  'recap',
  'summary',
  'preview',
  'reaction',
  'analysis',
  'explained',
  'predictions',
  'theory',
  'theories',
  'leaks',
  'delayed',
  'price guide',
];

export const ARTICLE_PATHS = [
  'news',
  'article',
  'articles',
  'review',
  'reviews',
  'spoilers',
  'forum',
  'forums',
  'threads',
];

export const NON_READING_PATHS = ['course'];

export const TITLE_STOP_WORDS = [
  ...CHAPTER_WORDS,
  ...READING_WORDS,
  'read',
  'online',
  'scans',
  'free',
];

export const TITLE_SEPARATOR = /\s+[-–—|•·»/]\s+|\s*[|｜»】」]\s*|\s+::\s+/;

export const TITLE_NOISE: readonly RegExp[] = [
  /^.*(?:^|[-|–:]\s*)(?:free\s+)?read(?:ing)?\s+/i,
  /^.*مترجم للعربي\s*/,
  /^(?:(?:lire|le|leer|ler|baca|komik|читать|чтение|онлайн|scan|manga|манга|manhwa|manhua|webtoon|مانجا|مانها|مانهوا):?\s+)+/iu,
  /^(?:その\d+)?[\s\]】」)]+/,
  /\s*\(\s*(?:manga|manhwa|manhua|webtoon|comic|raw|mtl|makine)\s*\)\s*$/i,
  /\[official\]|\(official\)/gi,
  /\s+(?:scans?\s+)?(?:fr|vf|vostfr)$/i,
  /^\s*\([^)]*\)/,
  /^(?:page|pagina|página|seite)\s*\d+(?:\s*\/\s*\d+)?\s*$/iu,
  /\(?\bs\d+\)?\s*$/i,
  /(?<!\p{L})(?:vol(?:ume)?|том|часть)[.:]?\s*\d+\.?\s*$/iu,
  /^[\s\-–—|:•·,(]+|[\s\-–—|:•·,(]+$/g,
  /(?:\s+(?:manga|manhwa|manhua|webtoon|comic|online|онлайн|бесплатно)\.?)+$/iu,
];

export const withoutTitleNoise = (text: string): string =>
  TITLE_NOISE.reduce((title, noise) => title.replace(noise, ''), text).trim();

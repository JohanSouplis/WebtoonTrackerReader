import { isChapterUrl, matchWebsites } from './site-request.rules';

describe('isChapterUrl', () => {
  it.each`
    text                                              | isUrl
    ${'https://example-scans.com/series/a/chapter-1'} | ${true}
    ${'  http://example-scans.com/chapter-1  '}       | ${true}
    ${'example-scans.com'}                            | ${false}
    ${'ftp://example-scans.com/chapter-1'}            | ${false}
    ${'https://localhost/chapter-1'}                  | ${false}
    ${'not a url at all'}                             | ${false}
  `('should say $isUrl when the text is "$text"', ({ text, isUrl }) => {
    expect(isChapterUrl(text)).toBe(isUrl);
  });
});

describe('matchWebsites', () => {
  it('should keep the websites containing the typed text whatever its case', () => {
    expect(matchWebsites(WEBSITES, 'MANGA')).toEqual([
      'mangadex.org',
      'mangapark.io',
    ]);
  });

  it('should match a pasted chapter address by its host only', () => {
    expect(
      matchWebsites(WEBSITES, 'https://www.mangadex.org/chapter/8160d350'),
    ).toEqual(['mangadex.org']);
  });

  it('should match an address pasted without its scheme by its host', () => {
    expect(matchWebsites(WEBSITES, 'toonily.com/webtoon/a/chapter-1')).toEqual([
      'toonily.com',
    ]);
  });

  it('should match nothing when the pasted address is on another site', () => {
    expect(
      matchWebsites(WEBSITES, 'https://unknown-scans.net/manga/chapter-3'),
    ).toEqual([]);
  });
});

const WEBSITES = ['toonily.com', 'mangadex.org', 'mangapark.io'];

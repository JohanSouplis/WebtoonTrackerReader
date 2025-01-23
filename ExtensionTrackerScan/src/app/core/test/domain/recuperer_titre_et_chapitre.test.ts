import { retrieveTitleAndChapter } from '../../src/domain/recuperer_titre_et_chapitre';

it.each<[string, string, [string, string]]>([
  [
    'The Beginning After the End Manga - Chapter 202 - Return to Ashber - Toonily',
    'https://toonily.com/webtoon/beginning-after-end/chapter-202/',
    ['The Beginning After the End Manga', '202'],
  ],
  [
    'Life of a Magic Academy Mage Chapter 111 - Asura Scans',
    'https://asuracomic.net/series/life-of-a-magic-academy-mage-27f19aba/chapter/111',
    ['Life of a Magic Academy Mage', '111'],
  ],
])('Should retrieve title and chapter', (title, url, result) => {
  expect(retrieveTitleAndChapter(title, url)).toEqual(result);
});

it('when parser is not known, should return empty', () => {
  expect(retrieveTitleAndChapter('', '')).toEqual([]);
});

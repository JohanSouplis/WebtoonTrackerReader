import { getUrlNextChapter } from '../../src/domain/get_next_chapter_url';

it.each<[string, string, string]>([
  [
    'https://toonily.com/webtoon/beginning-after-end/chapter-202/',
    '202',
    'https://toonily.com/webtoon/beginning-after-end/chapter-203/',
  ],
  [
    'https://asuracomic.net/series/life-of-a-magic-academy-mage-27f19aba/chapter/111',
    '111',
    'https://asuracomic.net/series/life-of-a-magic-academy-mage-27f19aba/chapter/112',
  ],
  [
    'https://manhuatop.org/manhua/the-zenith/chapter-17/',
    '17',
    'https://manhuatop.org/manhua/the-zenith/chapter-18/',
  ],
  [
    'https://manhuatop.org/manhua/to-hell-with-being-a-saint-im-a-doctor/chapter-38/',
    '38',
    'https://manhuatop.org/manhua/to-hell-with-being-a-saint-im-a-doctor/chapter-39/',
  ],
  [
    'https://manhuatop.org/manhua/solo-farming-in-the-tower/chapter-67/',
    '67',
    'https://manhuatop.org/manhua/solo-farming-in-the-tower/chapter-68/',
  ],
  // [
  //   'https://arvencomics.com/chapter/62c3ebda7bd-62c3ee090c2/',
  //   '1',
  //   'https://arvencomics.com/chapter/62c3ebda7bd-62c3ee090c3/',
  // ],
  [
    'https://vortexscans.org/series/regressing-as-the-reincarnated-bastard/chapter-35',
    '35',
    'https://vortexscans.org/series/regressing-as-the-reincarnated-bastard/chapter-36',
  ],
  [
    'https://manhuaus.com/manga/reborn-as-the-enemy-prince/chapter-64/',
    '64',
    'https://manhuaus.com/manga/reborn-as-the-enemy-prince/chapter-65/',
  ],
  [
    'https://manhuafast.net/manga/theres-no-such-thing-as-a-bad-hero-in-the-world/chapter-18/',
    '18',
    'https://manhuafast.net/manga/theres-no-such-thing-as-a-bad-hero-in-the-world/chapter-19/',
  ],
  // [
  //   'https://comick.io/comic/how-a-catastrophic-necromancer-retires/C4alZ_mw-chapter-1-en',
  //   '1',
  //   'https://comick.io/comic/how-a-catastrophic-necromancer-retires/C4alZ_mw-chapter-2-en',
  // ],
  [
    'https://reaper-scan.net/reborn-as-the-enemy-prince-chapter-64/',
    '64',
    'https://reaper-scan.net/reborn-as-the-enemy-prince-chapter-65/',
  ],
  [
    'https://en-thunderscans.com/0086250808-i-really-dont-want-to-learn-forbidden-spells-chapter-106/',
    '106',
    'https://en-thunderscans.com/0086250808-i-really-dont-want-to-learn-forbidden-spells-chapter-107/',
  ],
  [
    'https://dragontea.ink/novel/super-god-system/chapter-85/',
    '85',
    'https://dragontea.ink/novel/super-god-system/chapter-86/',
  ],
  [
    'https://www.toongod.org/webtoon/chronicles-of-the-reincarnated-demon-god/chapter-28/',
    '28',
    'https://www.toongod.org/webtoon/chronicles-of-the-reincarnated-demon-god/chapter-29/',
  ],
  // [
  //   'https://mangadex.org/chapter/323ab3fd-9f26-4429-b5e9-40c0ed6e1a0e',
  //   '104',
  //   'https://mangadex.org/chapter/323ab3fd-9f26-4429-b5e9-40c0ed6e1a0e/105',
  // ],
  // [
  //   'https://mangadex.org/chapter/c6a226c7-4bed-4ff6-8413-7510785ab363/20',
  //   '65',
  //   'https://mangadex.org/chapter/c6a226c7-4bed-4ff6-8413-7510785ab363/66',
  // ],
  [
    'https://chapmanganato.to/manga-hi985065/chapter-265',
    '265',
    'https://chapmanganato.to/manga-hi985065/chapter-266',
  ],
  [
    'https://chapmanganelo.com/manga-yr91037/chapter-129',
    '129',
    'https://chapmanganelo.com/manga-yr91037/chapter-130',
  ],
  [
    'https://chapmanganelo.com/manga-vb136495/chapter-51',
    '51',
    'https://chapmanganelo.com/manga-vb136495/chapter-52',
  ],
  [
    'https://chapmanganelo.com/manga-zj139777/chapter-6',
    '6',
    'https://chapmanganelo.com/manga-zj139777/chapter-7',
  ],
  // [
  //   'https://scantrad-union.com/read/star-martial-god-technique/chapter-244.00/page-1/',
  //   '4',
  //   'https://scantrad-union.com/read/star-martial-god-technique/chapter-5.00/page-1/',
  // ],
  // [
  //   'https://manta.net/en/series/solo-leveling/episodes/s1-episode-2?episodeId=119148',
  //   '2',
  //   'https://manta.net/en/series/solo-leveling/episodes/s1-episode-3?episodeId=119149',
  // ],
  // [
  //   'https://manta.net/en/series/the-hidden-muse/episodes/episode-3?episodeId=117732',
  //   '3',
  //   'https://manta.net/en/series/the-hidden-muse/episodes/episode-4?episodeId=117733',
  // ],
])('Get the url of the new chapter', (url, chapter, expected) => {
  expect(getUrlNextChapter(url, chapter)).toEqual(expected);
});

it('get the url of the new chapter for test purpose', () => {
  expect(
    getUrlNextChapter(
      'https://toonily.com/webtoon/beginning-after-end/chapter-202/',
      '202'
    )
  ).toEqual('https://toonily.com/webtoon/beginning-after-end/chapter-203/');
});

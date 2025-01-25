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
  [
    'The Zenith Manhwa  -  Chapter 17 - Top Manhua',
    'https://manhuatop.org/manhua/the-zenith/chapter-17/',
    ['The Zenith', '17'],
  ],
  [
    'Legendary hearts Transplant Reincarnation Chapter 1',
    'https://arvencomics.com/chapter/62c3ebda7bd-62c3ee090c2/',
    ['Legendary hearts Transplant Reincarnation', '1'],
  ],
  [
    'Regressing as the Reincarnated Bastard of the Sword Clan Chapter 35 - Vortex Scans',
    'https://vortexscans.org/series/regressing-as-the-reincarnated-bastard/chapter-35',
    ['Regressing as the Reincarnated Bastard of the Sword Clan', '35'],
  ],
  [
    'Reborn as the Enemy Prince - Chapter 64 - MANHUAUS.COM',
    'https://manhuaus.com/manga/reborn-as-the-enemy-prince/chapter-64/',
    ['Reborn as the Enemy Prince', '64'],
  ],
  [
    'There’s No Such Thing as a Bad Hero in the World - Chapter 18 - MANHUAFAST.NET',
    'https://manhuafast.net/manga/theres-no-such-thing-as-a-bad-hero-in-the-world/chapter-18/',
    ['There’s No Such Thing as a Bad Hero in the World', '18'],
  ],
  [
    'Chapter 1 (English) - How a Catastrophic Necromancer Retires | ComicK',
    'https://comick.io/comic/how-a-catastrophic-necromancer-retires/C4alZ_mw-chapter-1-en',
    ['How a Catastrophic Necromancer Retires', '1'],
  ],
  [
    'Read Reformation Of The Deadbeat Noble Chapter 134 ⚡ Reaper-scan | Read Manga Everyday',
    'https://reaper-scan.net/reborn-as-the-enemy-prince-chapter-64/',
    ['Reformation Of The Deadbeat Noble', '134'],
  ],
  [
    'I Really Don’t Want to Learn Forbidden Spells Chapter 106 – Thunderscans EN',
    'https://en-thunderscans.com/0086250808-i-really-dont-want-to-learn-forbidden-spells-chapter-106/',
    ['I Really Don’t Want to Learn Forbidden Spells', '106'],
  ],
  [
    'Super God System - chapter 85 - Dragon Tea',
    'https://dragontea.ink/novel/super-god-system/chapter-85/',
    ['Super God System', '85'],
  ],
  [
    'Read Chronicles of the Reincarnated Demon God Chapter 28 Online - ToonGod',
    'https://www.toongod.org/webtoon/chronicles-of-the-reincarnated-demon-god/chapter-28/',
    ['Chronicles of the Reincarnated Demon God', '28'],
  ],
  [
    '1 | Chapter 104 - Tensei Kizoku, Kantei Skill de Nariagaru ~Jakushou Ryouchi o Uketsuida node, Yuushuu na Jinzai o Fuyashiteitara, Saikyou Ryouchi ni Natteta~ - MangaDex',
    'https://mangadex.org/chapter/323ab3fd-9f26-4429-b5e9-40c0ed6e1a0e',
    [
      'Tensei Kizoku, Kantei Skill de Nariagaru ~Jakushou Ryouchi o Uketsuida node, Yuushuu na Jinzai o Fuyashiteitara, Saikyou Ryouchi ni Natteta~',
      '104',
    ],
  ],
  [
    'Overgeared Chapter 266 - Manganato',
    'https://chapmanganato.to/manga-hi985065/chapter-266',
    ['Overgeared', '266'],
  ],
  [
    "Mix Chapter 129: Because He's Tachibana Souichirou - Manganelo",
    'https://chapmanganelo.com/manga-yr91037/chapter-129',
    ['Mix', '129'],
  ],
  [
    'I Thought I Tamed The Villain Chapter 51 - Manganelo',
    'https://chapmanganelo.com/manga-vb136495/chapter-51',
    ['I Thought I Tamed The Villain', '51'],
  ],
  [
    'Record Of Ragnarok: The Apocalypse Of The Gods Chapter 6: The God Who Rebelled Against The Gods - Manganelo',
    'https://chapmanganelo.com/manga-zj139777/chapter-6',
    ['Record Of Ragnarok: The Apocalypse Of The Gods', '6'],
  ],
  [
    ' \nStar Martial God Technique - 4 | Scantrad Union',
    'https://scantrad-union.com/read/star-martial-god-technique/chapter-244.00/page-1/',
    ['Star Martial God Technique', '4'],
  ],
  [
    'Read S1 Episode 2 - Solo Leveling | Manta',
    'https://manta.net/en/series/solo-leveling/episodes/s1-episode-2?episodeId=119148',
    ['Solo Leveling', '2'],
  ],
  [
    'Read Episode 3 - The Hidden Muse | Manta',
    'https://manta.net/en/series/the-hidden-muse/episodes/episode-3?episodeId=117732',
    ['The Hidden Muse', '3'],
  ],
  [
    "Episode 70 | The Academy's Genius Swordsman",
    'https://www.webtoons.com/en/fantasy/the-academys-genius-swordsman/episode-70/viewer?title_no=5752&episode_no=70',
    ["The Academy's Genius Swordsman", '70'],
  ],
  [
    "Episode 70 | The Academy's Genius Swordsman",
    'https://www.webtoons.com/en/fantasy/the-academys-genius-swordsman/episode-70/viewer?title_no=5752&episode_no=70',
    ["The Academy's Genius Swordsman", '70'],
  ],
  [
    '(S2) Ep. 57 - First Request | Surviving the Game as a Barbarian',
    'https://www.webtoons.com/en/fantasy/surviving-the-game-as-a-barbarian/s2-ep-57-first-request/viewer?title_no=5515&episode_no=57',
    ['Surviving the Game as a Barbarian', '57'],
  ],
  [
    '(S2) Ep. 57 - First Request | Surviving the Game as a Barbarian',
    'https://www.webtoons.com/en/fantasy/a-spell-for-a-smith/chapter-46/viewer?title_no=6078&episode_no=46',
    ['Surviving the Game as a Barbarian', '57'],
  ],
  [
    'Chapter 46 | A Spell for a Smith',
    'https://www.webtoons.com/en/fantasy/surviving-the-game-as-a-barbarian/s2-ep-57-first-request/viewer?title_no=5515&episode_no=57',
    ['A Spell for a Smith', '46'],
  ],
  [
    'Read Episode 2 -  I Have Been Trapped In This Day for Three Thousand Years  | Tappytoon',
    'https://www.tappytoon.com/en/chapters/463602739?',
    ['I Have Been Trapped In This Day for Three Thousand Years', '2'],
  ],
  [
    'Read Evolution Begins With A Big Tree Chapter 323 online free - MangaPanda.in',
    'https://www.mangapanda.in/evolution-begins-with-a-big-tree-chapter-323#1',
    ['Evolution Begins With A Big Tree', '323'],
  ],
  [
    'High School Devil EP 1 - Toomics',
    'https://toomics.com/en/webtoon/detail/code/38718/ep/1/toon/1695',
    ['High School Devil', '1'],
  ],
  [
    'Chapter 1 • Frenzy Leveling Up System',
    'https://comics.inkr.com/title/4014-frenzy-leveling-up-system/chapter/176053-chapter-1?progress=2.506',
    ['Frenzy Leveling Up System', '1'],
  ],
  [
    "Surviving as a Tyrant's Daughter | Episode 3 | POCKET COMICS",
    'https://www.pocketcomics.com/comic/8199/chapter/3/product',
    ["Surviving as a Tyrant's Daughter", '3'],
  ],
  [
    "The Player Who Can't Level Up [Official] - Chapter 170 : S3 Finale",
    'https://bato.to/chapter/3186773',
    ["The Player Who Can't Level Up", '170'],
  ],
  [
    'I Have Never Abandoned the Tyrant - Chapter 45',
    'https://bato.to/chapter/3156483',
    ['I Have Never Abandoned the Tyrant', '45'],
  ],
  // [
  //   'Rettou Hito no Maken Tsukai Sukiruboudo o Kushi Shite Saikyou ni Itaru 90  - Read Rettou Hito no Maken Tsukai Sukiruboudo o Kushi Shite Saikyou ni Itaru 90 Online - Page 1',
  //   'https://fanfox.net/manga/rettou_hito_no_maken_tsukai_sukiruboudo_o_kushi_shite_saikyou_ni_itaru/c090/1.html',
  //   [
  //     'Rettou Hito no Maken Tsukai Sukiruboudo o Kushi Shite Saikyou ni Itaru',
  //     '90',
  //   ],
  // ],
  // [
  //   'Star Martial God Technique 771  - Read Star Martial God Technique 771 Online - Page 1',
  //   'https://fanfox.net/manga/star_martial_god_technique/c771/1.html#ipg2',
  //   ['Star Martial God Technique', '771'],
  // ],
  [
    'Overgeared (Team Argo) - Chapter 263 - Share Any Manga on MangaPark',
    'https://mangapark.org/title/115720-en-overgeared-team-argo/9365944-chapter-263',
    ['Overgeared (Team Argo)', '263'],
  ],
  [
    'The Max Level Hero Has Returned! - Chapter 179 - Share Any Manga on MangaPark',
    'https://mangapark.org/title/103422-en-the-max-level-hero-has-returned/9038456-chapter-179',
    ['The Max Level Hero Has Returned!', '179'],
  ],
  [
    'Love is an Illusion! - Superstar [Official] - Chapter 10 - Share Any Manga on MangaPark',
    'https://mangapark.net/title/419532-en-love-is-an-illusion-superstar/9395342-chapter-10',
    ['Love is an Illusion! - Superstar [Official]', '10'],
  ],
  [
    'Chronicles Of The Demon Faction - Ch.102 - Share Any Manga on MangaPark',
    'https://mangapark.org/title/341611-en-chronicles-of-the-demon-faction/9404698-ch-102',
    ['Chronicles Of The Demon Faction', '102'],
  ],
])('Should retrieve title and chapter', (title, url, result) => {
  expect(retrieveTitleAndChapter(title, url)).toEqual(result);
});

it('when parser is not known, should return empty', () => {
  expect(retrieveTitleAndChapter('', '')).toEqual([]);
});

it('when in a website of scan but there is no scan, should return empty', () => {
  expect(
    retrieveTitleAndChapter(
      'Stories that change your world, Tappytoon Comics & Novels | Official English',
      'https://www.tappytoon.com/en/comics/home'
    )
  ).toEqual([]);
});

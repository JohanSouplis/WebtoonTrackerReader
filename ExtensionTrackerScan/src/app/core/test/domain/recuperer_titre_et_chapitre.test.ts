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
    '(S2) Ep. 57 | Surviving the Game as a Barbarian',
    'https://www.webtoons.com/en/fantasy/surviving-the-game-as-a-barbarian/s2-ep-57-first-request/viewer?title_no=5515&episode_no=57',
    ['Surviving the Game as a Barbarian', '57'],
  ],
])('Should retrieve title and chapter', (title, url, result) => {
  expect(retrieveTitleAndChapter(title, url)).toEqual(result);
});

it('when parser is not known, should return empty', () => {
  expect(retrieveTitleAndChapter('', '')).toEqual([]);
});

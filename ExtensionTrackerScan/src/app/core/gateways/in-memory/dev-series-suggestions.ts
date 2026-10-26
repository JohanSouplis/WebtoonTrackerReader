import { SeriesSuggestionsSnapshot } from '../../domain/series-suggestions';

export const DEV_SERIES_SUGGESTIONS: SeriesSuggestionsSnapshot = {
  pending: [
    {
      title: 'Doberman Online Free',
      chapter: 88,
      url: 'https://manhwareads.com/manga/doberman/doberman-chapter-88/',
      host: 'manhwareads.com',
      seenAt: new Date('2025-03-10T10:42:00Z'),
      origin: 'this-device',
      source: 'page',
    },
    {
      title: 'Solo Leveling: Ragnarok IT',
      chapter: 61,
      url: 'https://www.infinitymanga.com/it/solo-leveling-ragnarok-it/solo-leveling-ragnarok-it-capitolo-61.html',
      host: 'infinitymanga.com',
      seenAt: new Date('2025-03-09T21:10:00Z'),
      origin: 'unknown',
      source: 'history',
    },
    {
      title: 'Divine Spirit Martial Emperor',
      chapter: 430,
      url: 'https://manhwareads.com/manga/divine-spirit-martial-emperor/ch-430/',
      host: 'manhwareads.com',
      seenAt: new Date('2025-03-08T18:05:00Z'),
      origin: 'unknown',
      source: 'history',
    },
    {
      title:
        'Tensei Kizoku Kantei Sukiru de Nariagaru ~ Jakushou Ryouchi o Uketsuidanode, Yuushuuna Jinzai o Fuyashite Itara, Saikyou Ryouchi ni Natteta ~ (MANGA) - RAW',
      chapter: 184,
      url: 'https://klz9.com/tensei-kizoku-kantei-sukiru-de-nariagaru-manga-raw-chapter-184.html',
      host: 'klz9.com',
      seenAt: new Date('2025-03-06T08:30:00Z'),
      origin: 'unknown',
      source: 'history',
    },
  ],
  hosts: [
    {
      host: 'mangathrill.com',
      confirmedInARow: 0,
      dismissedInARow: 2,
      dismissedTitles: ['solo leveling spoilers', 'one piece raw scans'],
    },
  ],
};

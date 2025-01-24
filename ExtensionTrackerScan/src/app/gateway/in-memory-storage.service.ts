import { Observable, of } from 'rxjs';
import { StorageInterface } from '../angular/port/storage.interface';
import { Scan } from '../core/src/domain/scan.type';

export class InMemoryStorageService implements StorageInterface {
  updateScan(scan: Scan): void {
    console.log('scan is updated');
  }

  getScans(): Observable<Scan[]> {
    return of([
      {
        chapter: '9999',
        title: 'Local',
        url: 'Localhost:4200',
        isFavorite: true,
        whenWasItRead:
          'Fri Jan 24 2025 18:02:54 GMT+0100 (Central European Standard Time)',
      },
      {
        chapter: '142',
        title: "The Heavenly Demon Can't Live a Normal Life",
        url: 'https://asuracomic.net/series/the-heavenly-demon-cant-live-a-normal-life-f04530a5/chapter/139',
        isFavorite: false,
        whenWasItRead:
          'Tue Jan 21 2024 12:30:15 GMT+0100 (Central European Standard Time)',
        rating: 9,
      },
      {
        chapter: '38',
        title: 'Solo Leveling: Ragnarok',
        url: 'https://asuracomic.net/series/solo-leveling-ragnarok-29d48e23/chapter/37',
        isFavorite: true,
        whenWasItRead:
          'Sat Jul 13 2024 09:45:30 GMT+0100 (Central European Standard Time)',
      },
      {
        chapter: '124',
        title: 'SSS-Class Suicide Hunter',
        url: 'https://asuracomic.net/series/sss-class-suicide-hunter-c35bcf93/chapter/124',
        isFavorite: false,
        whenWasItRead:
          'Mon Jan 29 2024 15:02:10 GMT+0100 (Central European Standard Time)',
        rating: 10,
      },
      {
        chapter: '50',
        title: 'The Reincarnated Assassin is a Genius Swordsman',
        url: 'https://asuracomic.net/series/the-reincarnated-assassin-is-a-genius-swordsman-983c6d17/chapter/50',
        isFavorite: true,
        whenWasItRead:
          'Tue Jun 18 2024 16:30:20 GMT+0100 (Central European Standard Time)',
        rating: 8,
      },
      {
        chapter: '68',
        title: 'Worthless Regression',
        url: 'https://asuracomic.net/series/worthless-regression-50201282/chapter/68',
        isFavorite: false,
        whenWasItRead:
          'Sun Aug 05 2024 17:15:05 GMT+0100 (Central European Standard Time)',
        rating: 6,
      },
      {
        chapter: '46',
        title: 'The Executioner',
        url: 'https://asuracomic.net/series/the-executioner-472e692a/chapter/46',
        isFavorite: true,
        whenWasItRead:
          'Fri Nov 22 2024 14:50:00 GMT+0100 (Central European Standard Time)',
        rating: 7,
      },
      {
        chapter: '141',
        title: 'Return of the SSS-Class Ranker',
        url: 'https://asuracomic.net/series/return-of-the-sss-class-ranker-d51a3031/chapter/141',
        isFavorite: false,
        whenWasItRead:
          'Thu May 09 2024 18:05:45 GMT+0100 (Central European Standard Time)',
        rating: 9,
      },
      {
        chapter: '136',
        title: 'Trash of the Count’s Family',
        url: 'https://asuracomic.net/series/trash-of-the-counts-family-38493e56/chapter/136',
        isFavorite: true,
        whenWasItRead:
          'Sun Mar 17 2024 11:25:55 GMT+0100 (Central European Standard Time)',
      },
      {
        chapter: '132',
        title: 'Pick Me Up, Infinite Gacha',
        url: 'https://asuracomic.net/series/pick-me-up-infinite-gacha-5803ee65/chapter/132',
        isFavorite: true,
        whenWasItRead:
          'Tue Apr 02 2024 13:00:40 GMT+0100 (Central European Standard Time)',
        rating: 10,
      },
      {
        chapter: '110',
        title: 'Return of the Disaster-Class Hero',
        url: 'https://asuracomic.net/series/return-of-the-disaster-class-hero-a31a2306/chapter/110',
        isFavorite: false,
        whenWasItRead:
          'Thu Feb 20 2024 08:30:25 GMT+0100 (Central European Standard Time)',
      },
      {
        chapter: '72',
        title: 'The Priest of Corruption',
        url: 'https://asuracomic.net/series/the-priest-of-corruption-7e4b6868/chapter/72',
        isFavorite: false,
        whenWasItRead:
          'Mon Jun 25 2024 19:00:35 GMT+0100 (Central European Standard Time)',
        rating: 6,
      },
      {
        chapter: '120',
        title: 'Duke Pendragon',
        url: 'https://asuracomic.net/series/duke-pendragon-353743ee/chapter/120',
        isFavorite: true,
        whenWasItRead:
          'Fri Jul 19 2024 10:40:00 GMT+0100 (Central European Standard Time)',
      },
      {
        chapter: '118',
        title: 'Dungeon Odyssey',
        url: 'https://asuracomic.net/series/dungeon-odyssey-b688584e/chapter/118',
        isFavorite: true,
        whenWasItRead:
          'Wed Sep 03 2024 11:10:15 GMT+0100 (Central European Standard Time)',
        rating: 10,
      },
      {
        chapter: '23',
        title: "A Dragonslayer's Peerless Regression",
        url: 'https://asuracomic.net/series/a-dragonslayers-peerless-regression-aaa07236/chapter/23',
        isFavorite: false,
        whenWasItRead:
          'Wed Aug 14 2024 07:25:05 GMT+0100 (Central European Standard Time)',
        rating: 5,
      },
      {
        chapter: '115',
        title: 'I Obtained a Mythic Item',
        url: 'https://asuracomic.net/series/i-obtained-a-mythic-item-09437f9f/chapter/115',
        isFavorite: true,
        whenWasItRead:
          'Thu Oct 10 2024 15:20:00 GMT+0100 (Central European Standard Time)',
        rating: 9,
      },
      {
        chapter: '117',
        title: 'Absolute Sword Sense',
        url: 'https://asuracomic.net/series/absolute-sword-sense-6617ba0b/chapter/117',
        isFavorite: false,
        whenWasItRead:
          'Tue Nov 04 2024 09:35:10 GMT+0100 (Central European Standard Time)',
        rating: 7,
      },
      {
        chapter: '16',
        title: 'The Heavenly Demon Wants a Quiet Life',
        url: 'https://asuracomic.net/series/the-heavenly-demon-wants-a-quiet-life-71be586c/chapter/16',
        isFavorite: true,
        whenWasItRead:
          'Mon Mar 12 2024 17:50:30 GMT+0100 (Central European Standard Time)',
        rating: 8,
      },
      {
        chapter: '96',
        title:
          'My School Life Pretending To Be a Worthless Person - My School Life Pretending To Be a Worthless Person - My School Life Pretending To Be a Worthless Person - My School Life Pretending To Be a Worthless Person - My School Life Pretending To Be a Worthless Person',
        url: 'https://asuracomic.net/series/my-school-life-pretending-to-be-a-worthless-person-4fbaf58c/chapter/96',
        isFavorite: false,
        whenWasItRead:
          'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)',
        rating: 6,
      },
      {
        chapter: '246',
        title: 'Omniscient Reader’s Viewpoint',
        url: 'https://asuracomic.net/series/omniscient-readers-viewpoint-7fc01755/chapter/246',
        isFavorite: true,
        whenWasItRead:
          'Sun Dec 01 2024 19:15:25 GMT+0100 (Central European Standard Time)',
        rating: 9,
      },
    ]);
  }
}

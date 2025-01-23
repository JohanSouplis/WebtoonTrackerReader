import { Observable, of } from 'rxjs';
import { StorageInterface } from '../angular/port/storage.interface';
import { Scan } from '../core/src/domain/scan.type';

export class InMemoryStorageService implements StorageInterface {
  getScans(): Observable<Scan[]> {
    return of([
      {
        chapter: '9999',
        title: 'Local',
        url: 'Localhost:4200',
      },
      {
        chapter: '142',
        title: "The Heavenly Demon Can't Live a Normal Life",
        url: 'https://asuracomic.net/series/the-heavenly-demon-cant-live-a-normal-life-f04530a5/chapter/139',
      },
      {
        chapter: '38',
        title: 'Solo Leveling: Ragnarok',
        url: 'https://asuracomic.net/series/solo-leveling-ragnarok-29d48e23/chapter/37',
      },
      {
        chapter: '124',
        title: 'SSS-Class Suicide Hunter',
        url: 'https://asuracomic.net/series/sss-class-suicide-hunter-c35bcf93/chapter/124',
      },
      {
        chapter: '50',
        title: 'The Reincarnated Assassin is a Genius Swordsman',
        url: 'https://asuracomic.net/series/the-reincarnated-assassin-is-a-genius-swordsman-983c6d17/chapter/50',
      },
      {
        chapter: '68',
        title: 'Worthless Regression',
        url: 'https://asuracomic.net/series/worthless-regression-50201282/chapter/68',
      },
      {
        chapter: '46',
        title: 'The Executioner',
        url: 'https://asuracomic.net/series/the-executioner-472e692a/chapter/46',
      },
      {
        chapter: '141',
        title: 'Return of the SSS-Class Ranker',
        url: 'https://asuracomic.net/series/return-of-the-sss-class-ranker-d51a3031/chapter/141',
      },
      {
        chapter: '136',
        title: 'Trash of the Count’s Family',
        url: 'https://asuracomic.net/series/trash-of-the-counts-family-38493e56/chapter/136',
      },
      {
        chapter: '132',
        title: 'Pick Me Up, Infinite Gacha',
        url: 'https://asuracomic.net/series/pick-me-up-infinite-gacha-5803ee65/chapter/132',
      },
      {
        chapter: '110',
        title: 'Return of the Disaster-Class Hero',
        url: 'https://asuracomic.net/series/return-of-the-disaster-class-hero-a31a2306/chapter/110',
      },
      {
        chapter: '72',
        title: 'The Priest of Corruption',
        url: 'https://asuracomic.net/series/the-priest-of-corruption-7e4b6868/chapter/72',
      },
      {
        chapter: '120',
        title: 'Duke Pendragon',
        url: 'https://asuracomic.net/series/duke-pendragon-353743ee/chapter/120',
      },
      {
        chapter: '118',
        title: 'Dungeon Odyssey',
        url: 'https://asuracomic.net/series/dungeon-odyssey-b688584e/chapter/118',
      },
      {
        chapter: '23',
        title: "A Dragonslayer's Peerless Regression",
        url: 'https://asuracomic.net/series/a-dragonslayers-peerless-regression-aaa07236/chapter/23',
      },
      {
        chapter: '115',
        title: 'I Obtained a Mythic Item',
        url: 'https://asuracomic.net/series/i-obtained-a-mythic-item-09437f9f/chapter/115',
      },
      {
        chapter: '117',
        title: 'Absolute Sword Sense',
        url: 'https://asuracomic.net/series/absolute-sword-sense-6617ba0b/chapter/117',
      },
      {
        chapter: '16',
        title: 'The Heavenly Demon Wants a Quiet Life',
        url: 'https://asuracomic.net/series/the-heavenly-demon-wants-a-quiet-life-71be586c/chapter/16',
      },
      {
        chapter: '96',
        title: 'My School Life Pretending To Be a Worthless Person',
        url: 'https://asuracomic.net/series/my-school-life-pretending-to-be-a-worthless-person-4fbaf58c/chapter/96',
      },
      {
        chapter: '76',
        title: 'Killer Pietro',
        url: 'https://asuracomic.net/series/killer-pietro-1cda91f1/chapter/76',
      },
      {
        chapter: '139',
        title: 'The Return of the Crazy Demon',
        url: 'https://asuracomic.net/series/the-return-of-the-crazy-demon-489af68a/chapter/139',
      },
      {
        chapter: '102',
        title: 'Chronicles of the Demon Faction',
        url: 'https://asuracomic.net/series/chronicles-of-the-demon-faction-550ca017/chapter/102',
      },
      {
        chapter: '41',
        title: 'Eternally Regressing Knight',
        url: 'https://asuracomic.net/series/eternally-regressing-knight-c2d73eda/chapter/41',
      },
      {
        chapter: '108',
        title: 'Star Instructor, Master Baek',
        url: 'https://asuracomic.net/series/star-instructor-master-baek-77df230c/chapter/108',
      },
      {
        chapter: '243',
        title: 'Nano Machine',
        url: 'https://asuracomic.net/series/nano-machine-d4aa23c3/chapter/243',
      },
      {
        chapter: '16',
        title: 'Night of the Soulless Heathens',
        url: 'https://asuracomic.net/series/night-of-the-soulless-heathens-82837273/chapter/16',
      },
      {
        chapter: '159',
        title: 'Return of The Unrivaled Spear Knight',
        url: 'https://asuracomic.net/series/return-of-the-unrivaled-spear-knight-05356d71/chapter/159',
      },
      {
        chapter: '24',
        title: 'Emperor of Steel',
        url: 'https://asuracomic.net/series/emperor-of-steel-56d9a254/chapter/24',
      },
      {
        chapter: '76',
        title: 'Star-Embracing Swordmaster',
        url: 'https://asuracomic.net/series/star-embracing-swordmaster-3fde1f56/chapter/76',
      },
      {
        chapter: '69',
        title: 'I Killed an Academy Player',
        url: 'https://asuracomic.net/series/i-killed-an-academy-player-2d06cc0a/chapter/69',
      },
      {
        chapter: '220',
        title: 'I Am the Fated Villain',
        url: 'https://asuracomic.net/series/i-am-the-fated-villain-109a5591/chapter/220',
      },
      {
        chapter: '127',
        title: 'Standard of Reincarnation',
        url: 'https://asuracomic.net/series/standard-of-reincarnation-d76a64fa/chapter/127',
      },
      {
        chapter: '91',
        title: 'Dragon-Devouring Mage',
        url: 'https://asuracomic.net/series/dragon-devouring-mage-41413291/chapter/91',
      },
      {
        chapter: '63',
        title: 'Reborn as the Enemy Prince',
        url: 'https://asuracomic.net/series/reborn-as-the-enemy-prince-08b109ad/chapter/63',
      },
      {
        chapter: '246',
        title: 'Omniscient Reader’s Viewpoint',
        url: 'https://asuracomic.net/series/omniscient-readers-viewpoint-7fc01755/chapter/246',
      },
      {
        chapter: '187',
        title: 'Logging 10,000 Years into the Future',
        url: 'https://asuracomic.net/series/logging-10000-years-into-the-future-8508e2aa/chapter/187',
      },
      {
        chapter: '102',
        title: 'Infinite Mage',
        url: 'https://asuracomic.net/series/infinite-mage-f968e02b/chapter/102',
      },
      {
        chapter: '14',
        title: 'The Ultimate Shut-In',
        url: 'https://asuracomic.net/series/the-ultimate-shut-in-df343cb8/chapter/14',
      },
    ]);
  }
}

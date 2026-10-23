import { ChapterWatch } from '../domain/chapter-watch';
import { Cover, Thumbnail } from '../domain/cover';
import { ScanSnapshot } from '../domain/scan-library';
import { MergedScans } from '../domain/scan-merge';
import { ScanTitle } from '../domain/scan-title';
import { InMemoryChapterWatchRepository } from '../gateways/in-memory/in-memory-chapter-watch-repository.gateway';
import { InMemoryCoverRepository } from '../gateways/in-memory/in-memory-cover-repository.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { MergeScansUseCase } from './merge-scans.use-case';
import { aScan } from './scans.fixture';
import { UnmergeScansUseCase } from './unmerge-scans.use-case';

describe('UnmergeScansUseCase', () => {
  it('should bring back both scans as they were before the merge', async () => {
    const eleceed = aScan({ title: 'Eleceed' });
    const target = aScan({
      title: 'One Punch-Man',
      chapter: 150,
      readAt: EARLIER,
      rating: 7,
      aliases: ['Onepunch-Man'],
    });
    const source = aScan({
      title: 'Punch',
      chapter: 200,
      readAt: LATER,
      isFavorite: true,
    });
    const { merge, unmerge, scans } = setUp([target, eleceed, source]);
    const { merged } = await merge('Punch', 'One Punch-Man');

    const library = await unmerge(merged);

    expect(library).toEqual([target, eleceed, source]);
    expect(await scans()).toEqual(library);
  });

  it('should give each scan back its own cover and watch', async () => {
    const { merge, unmerge, coverRepository, watchRepository } = setUp(
      [
        aScan({ title: 'One Punch-Man', readAt: EARLIER }),
        aScan({ title: 'Punch', readAt: LATER }),
      ],
      { 'One Punch-Man': OTHER_FOUND, Punch: FOUND },
      { 'One Punch-Man': UP_TO_DATE, Punch: NEW_CHAPTER },
    );
    const { merged } = await merge('Punch', 'One Punch-Man');

    await unmerge(merged);

    expect(await coverRepository.find(BOTH_TITLES)).toEqual(
      new Map([
        ['Punch', FOUND],
        ['One Punch-Man', OTHER_FOUND],
      ]),
    );
    expect(await watchRepository.find(BOTH_TITLES)).toEqual(
      new Map([
        ['Punch', NEW_CHAPTER],
        ['One Punch-Man', UP_TO_DATE],
      ]),
    );
  });

  it('should take back the cover and watch the merge gave to a target that had none', async () => {
    const { merge, unmerge, coverRepository, watchRepository } = setUp(
      [aScan({ title: 'One Punch-Man' }), aScan({ title: 'Punch' })],
      { Punch: FOUND },
      { Punch: NEW_CHAPTER },
    );
    const { merged } = await merge('Punch', 'One Punch-Man');

    await unmerge(merged);

    expect(await coverRepository.find(BOTH_TITLES)).toEqual(
      new Map([['Punch', FOUND]]),
    );
    expect(await watchRepository.find(BOTH_TITLES)).toEqual(
      new Map([['Punch', NEW_CHAPTER]]),
    );
  });

  it('should bring the source back when the merged scan was deleted before the undo', async () => {
    const target = aScan({ title: 'One Punch-Man' });
    const source = aScan({ title: 'Punch' });

    const library = await new UnmergeScansUseCase(
      new InMemoryScanRepository(),
      new InMemoryCoverRepository(),
      new InMemoryChapterWatchRepository(),
    ).execute({ source: { scan: source }, target: { scan: target } });

    expect(library).toEqual([target, source]);
  });
});

const EARLIER = new Date('2025-03-01T12:00:00Z');
const LATER = new Date('2025-03-05T12:00:00Z');
const BOTH_TITLES = [ScanTitle.of('Punch'), ScanTitle.of('One Punch-Man')];

const thumbnail = (dataUrl: string): Thumbnail => {
  const parsed = Thumbnail.parse(dataUrl);
  if (!parsed) {
    throw new Error('The thumbnail does not parse');
  }
  return parsed;
};

const FOUND: Cover = {
  kind: 'found',
  thumbnail: thumbnail('data:image/webp;base64,UklGRg=='),
  from: 'page',
  at: EARLIER,
};

const OTHER_FOUND: Cover = {
  kind: 'found',
  thumbnail: thumbnail('data:image/webp;base64,T1RIRVI='),
  from: 'series-page',
  at: EARLIER,
};

const UP_TO_DATE: ChapterWatch = {
  kind: 'up-to-date',
  site: 'webtoons.com',
  latest: 12,
  checkedAt: EARLIER,
};

const NEW_CHAPTER: ChapterWatch = {
  kind: 'new',
  site: 'webtoons.com',
  latest: 13,
  url: 'https://www.webtoons.com/en/fantasy/punch/episode-13',
  foundAt: LATER,
  checkedAt: LATER,
};

const setUp = (
  followed: ScanSnapshot[],
  covers: Readonly<Record<string, Cover>> = {},
  watches: Readonly<Record<string, ChapterWatch>> = {},
) => {
  const scanRepository = new InMemoryScanRepository(followed);
  const coverRepository = new InMemoryCoverRepository(covers);
  const watchRepository = new InMemoryChapterWatchRepository(watches);
  const mergeScans = new MergeScansUseCase(
    scanRepository,
    coverRepository,
    watchRepository,
  );
  const unmergeScans = new UnmergeScansUseCase(
    scanRepository,
    coverRepository,
    watchRepository,
  );
  return {
    coverRepository,
    watchRepository,
    scans: async () => (await scanRepository.load()).snapshot(),
    merge: (source: string, target: string) =>
      mergeScans.execute(ScanTitle.of(source), ScanTitle.of(target)),
    unmerge: (merged: MergedScans) => unmergeScans.execute(merged),
  };
};

import { ChapterWatch } from '../domain/chapter-watch';
import { Cover, Thumbnail } from '../domain/cover';
import { ScanTitle } from '../domain/scan-title';
import { InMemoryChapterWatchRepository } from '../gateways/in-memory/in-memory-chapter-watch-repository.gateway';
import { InMemoryCoverRepository } from '../gateways/in-memory/in-memory-cover-repository.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { DeleteScanUseCase } from './delete-scan.use-case';
import { RestoreScanUseCase } from './restore-scan.use-case';
import { aScan } from './scans.fixture';

describe('RestoreScanUseCase', () => {
  it('should bring back a deleted scan with its favorite, rating, cover and watch', async () => {
    const soloLeveling = aScan({
      title: 'Solo Leveling',
      isFavorite: true,
      rating: 9,
    });
    const nanoMachine = aScan({ title: 'Nano Machine' });
    const scanRepository = new InMemoryScanRepository([
      soloLeveling,
      nanoMachine,
    ]);
    const coverRepository = new InMemoryCoverRepository({
      'Solo Leveling': FOUND,
    });
    const watchRepository = new InMemoryChapterWatchRepository({
      'Solo Leveling': NEW_CHAPTER,
    });
    const { removed } = await new DeleteScanUseCase(
      scanRepository,
      coverRepository,
      watchRepository,
    ).execute(ScanTitle.of('Solo Leveling'));

    const library = await new RestoreScanUseCase(
      scanRepository,
      coverRepository,
      watchRepository,
    ).execute(removed);

    expect(library).toEqual([nanoMachine, soloLeveling]);
    expect((await scanRepository.load()).snapshot()).toEqual(library);
    expect(await coverRepository.find([ScanTitle.of('Solo Leveling')])).toEqual(
      new Map([['Solo Leveling', FOUND]]),
    );
    expect(await watchRepository.find([ScanTitle.of('Solo Leveling')])).toEqual(
      new Map([['Solo Leveling', NEW_CHAPTER]]),
    );
  });

  it('should keep the newer reading and the deleted favorite when the series was read again before the undo', async () => {
    const deleted = aScan({
      title: 'Solo Leveling',
      chapter: 10,
      readAt: new Date('2025-03-10T10:00:00Z'),
      isFavorite: true,
    });
    const readAgain = aScan({
      title: 'Solo Leveling',
      chapter: 11,
      readAt: new Date('2025-03-10T10:01:00Z'),
    });
    const scanRepository = new InMemoryScanRepository([readAgain]);

    const library = await new RestoreScanUseCase(
      scanRepository,
      new InMemoryCoverRepository(),
      new InMemoryChapterWatchRepository(),
    ).execute({ scan: deleted });

    expect(library).toEqual([{ ...readAgain, isFavorite: true }]);
  });

  it('should keep a cover found after the deletion when the deleted scan had none', async () => {
    const coverRepository = new InMemoryCoverRepository({
      'Solo Leveling': FOUND,
    });

    await new RestoreScanUseCase(
      new InMemoryScanRepository(),
      coverRepository,
      new InMemoryChapterWatchRepository(),
    ).execute({ scan: aScan({ title: 'Solo Leveling' }), cover: MISSING });

    expect(await coverRepository.find([ScanTitle.of('Solo Leveling')])).toEqual(
      new Map([['Solo Leveling', FOUND]]),
    );
  });
});

const thumbnail = (): Thumbnail => {
  const parsed = Thumbnail.parse('data:image/webp;base64,UklGRg==');
  if (!parsed) {
    throw new Error('The thumbnail does not parse');
  }
  return parsed;
};

const FOUND: Cover = {
  kind: 'found',
  thumbnail: thumbnail(),
  from: 'page',
  at: new Date('2025-03-10T12:00:00Z'),
};

const MISSING: Cover = {
  kind: 'missing',
  triedAt: new Date('2025-03-10T12:00:00Z'),
};

const NEW_CHAPTER: ChapterWatch = {
  kind: 'new',
  site: 'scans.org',
  latest: 13,
  url: 'https://scans.org/solo-leveling/chapter-13',
  foundAt: new Date('2025-03-10T10:00:00Z'),
  checkedAt: new Date('2025-03-10T10:00:00Z'),
};

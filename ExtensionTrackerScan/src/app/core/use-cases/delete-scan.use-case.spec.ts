import { ChapterWatch } from '../domain/chapter-watch';
import { Cover } from '../domain/cover';
import { ScanNotFound } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { InMemoryChapterWatchRepository } from '../gateways/in-memory/in-memory-chapter-watch-repository.gateway';
import { InMemoryCoverRepository } from '../gateways/in-memory/in-memory-cover-repository.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { InMemorySeriesSuggestionsRepository } from '../gateways/in-memory/in-memory-series-suggestions-repository.gateway';
import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryCrashReporter } from '../gateways/in-memory/in-memory-crash-reporter.gateway';
import { InMemoryReportSettingsRepository } from '../gateways/in-memory/in-memory-report-settings-repository.gateway';
import { InMemoryTelemetryRecorder } from '../gateways/in-memory/in-memory-telemetry-recorder.gateway';
import { DeleteScanUseCase } from './delete-scan.use-case';
import { RecordVisitedPageUseCase } from './record-visited-page.use-case';
import { aScan } from './scans.fixture';

describe('DeleteScanUseCase', () => {
  it('should remove the scan with the same title whatever its chapter', async () => {
    const kept = aScan({ title: 'Solo leveling', chapter: 2 });
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: "Mount Hua Sect's Genius Phantom Swordsman", chapter: 3 }),
      kept,
    ]);

    const { library } = await new DeleteScanUseCase(
      scanRepository,
      new InMemoryCoverRepository(),
      new InMemoryChapterWatchRepository(),
    ).execute(ScanTitle.of("Mount Hua Sect's Genius Phantom Swordsman"));

    expect(library).toEqual([kept]);
    expect((await scanRepository.load()).snapshot()).toEqual([kept]);
  });

  it('should forget the aliases of the deleted scan so a later reading under one starts a new scan', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'One Punch-Man', aliases: ['Punch'] }),
    ]);
    await new DeleteScanUseCase(
      scanRepository,
      new InMemoryCoverRepository(),
      new InMemoryChapterWatchRepository(),
    ).execute(ScanTitle.of('One Punch-Man'));
    const page = {
      pageTitle: 'Episode 2 | Punch',
      url: 'https://www.webtoons.com/en/action/punch/episode-2/viewer?title_no=1&episode_no=2',
    };

    await new RecordVisitedPageUseCase(
      scanRepository,
      new InMemorySeriesSuggestionsRepository(),
      new InMemoryCrashReporter(),
      new InMemoryReportSettingsRepository(),
      new FixedClock(NOW),
      new InMemoryTelemetryRecorder(),
    ).execute(page);

    expect((await scanRepository.load()).snapshot()).toEqual([
      aScan({ title: 'Punch', chapter: 2, url: page.url, readAt: NOW }),
    ]);
  });

  it('should delete the cover of the series of the deleted scan and keep the others', async () => {
    const coverRepository = new InMemoryCoverRepository({
      'Solo Leveling': MISSING,
      'Nano Machine': MISSING,
    });

    await new DeleteScanUseCase(
      new InMemoryScanRepository([
        aScan({ title: 'Solo Leveling' }),
        aScan({ title: 'Nano Machine' }),
      ]),
      coverRepository,
      new InMemoryChapterWatchRepository(),
    ).execute(ScanTitle.of('solo leveling'));

    expect(
      await coverRepository.find([
        ScanTitle.of('Solo Leveling'),
        ScanTitle.of('Nano Machine'),
      ]),
    ).toEqual(new Map([['Nano Machine', MISSING]]));
  });

  it('should stop watching the chapters of the deleted scan and keep the others', async () => {
    const watchRepository = new InMemoryChapterWatchRepository({
      'Solo Leveling': UP_TO_DATE,
      'Nano Machine': UP_TO_DATE,
    });

    await new DeleteScanUseCase(
      new InMemoryScanRepository([
        aScan({ title: 'Solo Leveling' }),
        aScan({ title: 'Nano Machine' }),
      ]),
      new InMemoryCoverRepository(),
      watchRepository,
    ).execute(ScanTitle.of('solo leveling'));

    expect(
      await watchRepository.find([
        ScanTitle.of('Solo Leveling'),
        ScanTitle.of('Nano Machine'),
      ]),
    ).toEqual(new Map([['Nano Machine', UP_TO_DATE]]));
  });

  it('should hand back the removed scan with its cover and watch so it can be restored', async () => {
    const removed = aScan({ title: 'Solo Leveling', isFavorite: true });

    const removal = await new DeleteScanUseCase(
      new InMemoryScanRepository([removed]),
      new InMemoryCoverRepository({ 'Solo Leveling': MISSING }),
      new InMemoryChapterWatchRepository({ 'Solo Leveling': UP_TO_DATE }),
    ).execute(ScanTitle.of('solo leveling'));

    expect(removal.removed).toEqual({
      scan: removed,
      cover: MISSING,
      watch: UP_TO_DATE,
    });
  });

  it('should fail with ScanNotFound and keep every scan and cover when no scan has the title', async () => {
    const followed = [
      aScan({ title: 'Genius phantom swordsman' }),
      aScan({ title: 'Solo leveling' }),
    ];
    const scanRepository = new InMemoryScanRepository(followed);
    const coverRepository = new InMemoryCoverRepository({
      "Mount Hua Sect's Genius Phantom Swordsman": MISSING,
    });

    await expect(
      new DeleteScanUseCase(
        scanRepository,
        coverRepository,
        new InMemoryChapterWatchRepository(),
      ).execute(ScanTitle.of("Mount Hua Sect's Genius Phantom Swordsman")),
    ).rejects.toThrow(ScanNotFound);
    expect((await scanRepository.load()).snapshot()).toEqual(followed);
    expect(
      await coverRepository.find([
        ScanTitle.of("Mount Hua Sect's Genius Phantom Swordsman"),
      ]),
    ).toEqual(
      new Map([["Mount Hua Sect's Genius Phantom Swordsman", MISSING]]),
    );
  });
});

const NOW = new Date('2025-03-10T12:00:00Z');

const MISSING: Cover = {
  kind: 'missing',
  triedAt: new Date('2025-03-10T12:00:00Z'),
};

const UP_TO_DATE: ChapterWatch = {
  kind: 'up-to-date',
  site: 'scans.org',
  latest: 12,
  checkedAt: new Date('2026-10-23T10:00:00Z'),
};

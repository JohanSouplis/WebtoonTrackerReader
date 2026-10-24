import { inject, Provider } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ChromeStorageChapterWatchRepository } from '../../../core/gateways/chrome-storage-chapter-watch-repository.gateway';
import { ChromeStorageCoverRepository } from '../../../core/gateways/chrome-storage-cover-repository.gateway';
import { ChromeStorageScanRepository } from '../../../core/gateways/chrome-storage-scan-repository.gateway';
import { ChromeStorageWatchSettingsRepository } from '../../../core/gateways/chrome-storage-watch-settings-repository.gateway';
import { ConsoleScanRepository } from '../../../core/gateways/console-scan-repository.gateway';
import { SystemClock } from '../../../core/gateways/system-clock.gateway';
import { DEV_COVERS } from '../../../core/gateways/in-memory/dev-covers';
import { DEV_SCANS } from '../../../core/gateways/in-memory/dev-scans';
import { DEV_WATCHES } from '../../../core/gateways/in-memory/dev-watches';
import { InMemoryChapterWatchRepository } from '../../../core/gateways/in-memory/in-memory-chapter-watch-repository.gateway';
import { InMemoryCoverRepository } from '../../../core/gateways/in-memory/in-memory-cover-repository.gateway';
import { InMemoryScanRepository } from '../../../core/gateways/in-memory/in-memory-scan-repository.gateway';
import { InMemoryWatchSettingsRepository } from '../../../core/gateways/in-memory/in-memory-watch-settings-repository.gateway';
import { ScanRepository } from '../../../core/ports/scan-repository.port';
import { AskForRatingUseCase } from '../../../core/use-cases/ask-for-rating.use-case';
import { ChangeCheckIntervalUseCase } from '../../../core/use-cases/change-check-interval.use-case';
import { ClearRatingUseCase } from '../../../core/use-cases/clear-rating.use-case';
import { ConfirmPendingSeriesUseCase } from '../../../core/use-cases/confirm-pending-series.use-case';
import { ConfirmSiteSeriesUseCase } from '../../../core/use-cases/confirm-site-series.use-case';
import { DeleteScanUseCase } from '../../../core/use-cases/delete-scan.use-case';
import { DismissPendingSeriesUseCase } from '../../../core/use-cases/dismiss-pending-series.use-case';
import { MergeScansUseCase } from '../../../core/use-cases/merge-scans.use-case';
import { RateScanUseCase } from '../../../core/use-cases/rate-scan.use-case';
import { RecordNewChapterOpenedUseCase } from '../../../core/use-cases/record-new-chapter-opened.use-case';
import { RenameScanUseCase } from '../../../core/use-cases/rename-scan.use-case';
import { RestoreScanUseCase } from '../../../core/use-cases/restore-scan.use-case';
import { StopIgnoringSiteUseCase } from '../../../core/use-cases/stop-ignoring-site.use-case';
import { ToggleFavoriteUseCase } from '../../../core/use-cases/toggle-favorite.use-case';
import { UnmergeScansUseCase } from '../../../core/use-cases/unmerge-scans.use-case';
import {
  CHAPTER_WATCH_REPOSITORY,
  CLOCK,
  COVER_BACKFILL,
  COVER_REPOSITORY,
  NOTIFICATION_PERMISSION,
  RATE_PROMPT_REPOSITORY,
  SCAN_REPOSITORY,
  SERIES_SUGGESTIONS_REPOSITORY,
  TELEMETRY_RECORDER,
  WATCH_SETTINGS_REPOSITORY,
} from '../../injection-tokens';
import { ChromeNotificationPermission } from './gateways/chrome-notification-permission.gateway';
import { ChromeRuntimeCoverBackfill } from './gateways/chrome-runtime-cover-backfill.gateway';
import { InMemoryCoverBackfill } from './gateways/in-memory-cover-backfill.gateway';
import { InMemoryNotificationPermission } from './gateways/in-memory-notification-permission.gateway';

const announcingSaves = (
  scanRepository: ScanRepository,
  savedMessage: string,
): ScanRepository =>
  environment.production
    ? scanRepository
    : new ConsoleScanRepository(scanRepository, savedMessage);

export const SCAN_LIST_PROVIDERS: Provider[] = [
  { provide: CLOCK, useFactory: () => new SystemClock() },
  {
    provide: SCAN_REPOSITORY,
    useFactory: () =>
      environment.production
        ? new ChromeStorageScanRepository()
        : new InMemoryScanRepository(DEV_SCANS),
  },
  {
    provide: COVER_REPOSITORY,
    useFactory: () =>
      environment.production
        ? new ChromeStorageCoverRepository()
        : new InMemoryCoverRepository(DEV_COVERS),
  },
  {
    provide: CHAPTER_WATCH_REPOSITORY,
    useFactory: () =>
      environment.production
        ? new ChromeStorageChapterWatchRepository()
        : new InMemoryChapterWatchRepository(DEV_WATCHES),
  },
  {
    provide: WATCH_SETTINGS_REPOSITORY,
    useFactory: () =>
      environment.production
        ? new ChromeStorageWatchSettingsRepository()
        : new InMemoryWatchSettingsRepository(),
  },
  {
    provide: NOTIFICATION_PERMISSION,
    useFactory: () =>
      environment.production
        ? new ChromeNotificationPermission()
        : new InMemoryNotificationPermission(),
  },
  {
    provide: ChangeCheckIntervalUseCase,
    useFactory: () =>
      new ChangeCheckIntervalUseCase(inject(WATCH_SETTINGS_REPOSITORY)),
  },
  {
    provide: COVER_BACKFILL,
    useFactory: () =>
      environment.production
        ? new ChromeRuntimeCoverBackfill()
        : new InMemoryCoverBackfill(),
  },
  {
    provide: DeleteScanUseCase,
    useFactory: () =>
      new DeleteScanUseCase(
        announcingSaves(inject(SCAN_REPOSITORY), 'scan is deleted'),
        inject(COVER_REPOSITORY),
        inject(CHAPTER_WATCH_REPOSITORY),
      ),
  },
  {
    provide: RestoreScanUseCase,
    useFactory: () =>
      new RestoreScanUseCase(
        announcingSaves(inject(SCAN_REPOSITORY), 'scan is restored'),
        inject(COVER_REPOSITORY),
        inject(CHAPTER_WATCH_REPOSITORY),
      ),
  },
  {
    provide: RenameScanUseCase,
    useFactory: () =>
      new RenameScanUseCase(
        announcingSaves(inject(SCAN_REPOSITORY), 'scan is renamed'),
        inject(COVER_REPOSITORY),
        inject(CHAPTER_WATCH_REPOSITORY),
      ),
  },
  {
    provide: MergeScansUseCase,
    useFactory: () =>
      new MergeScansUseCase(
        announcingSaves(inject(SCAN_REPOSITORY), 'scans are merged'),
        inject(COVER_REPOSITORY),
        inject(CHAPTER_WATCH_REPOSITORY),
      ),
  },
  {
    provide: UnmergeScansUseCase,
    useFactory: () =>
      new UnmergeScansUseCase(
        announcingSaves(inject(SCAN_REPOSITORY), 'scans are unmerged'),
        inject(COVER_REPOSITORY),
        inject(CHAPTER_WATCH_REPOSITORY),
      ),
  },
  {
    provide: ConfirmPendingSeriesUseCase,
    useFactory: () =>
      new ConfirmPendingSeriesUseCase(
        announcingSaves(inject(SCAN_REPOSITORY), 'series is added'),
        inject(SERIES_SUGGESTIONS_REPOSITORY),
        inject(TELEMETRY_RECORDER),
      ),
  },
  {
    provide: ConfirmSiteSeriesUseCase,
    useFactory: () =>
      new ConfirmSiteSeriesUseCase(
        announcingSaves(inject(SCAN_REPOSITORY), 'series are added'),
        inject(SERIES_SUGGESTIONS_REPOSITORY),
        inject(TELEMETRY_RECORDER),
      ),
  },
  {
    provide: DismissPendingSeriesUseCase,
    useFactory: () =>
      new DismissPendingSeriesUseCase(
        inject(SERIES_SUGGESTIONS_REPOSITORY),
        inject(TELEMETRY_RECORDER),
      ),
  },
  {
    provide: StopIgnoringSiteUseCase,
    useFactory: () =>
      new StopIgnoringSiteUseCase(inject(SERIES_SUGGESTIONS_REPOSITORY)),
  },
  {
    provide: ToggleFavoriteUseCase,
    useFactory: () =>
      new ToggleFavoriteUseCase(
        announcingSaves(inject(SCAN_REPOSITORY), 'scan is updated'),
      ),
  },
  {
    provide: ClearRatingUseCase,
    useFactory: () =>
      new ClearRatingUseCase(
        announcingSaves(inject(SCAN_REPOSITORY), 'scan is updated'),
      ),
  },
  {
    provide: RateScanUseCase,
    useFactory: () =>
      new RateScanUseCase(
        announcingSaves(inject(SCAN_REPOSITORY), 'scan is updated'),
      ),
  },
  {
    provide: AskForRatingUseCase,
    useFactory: () =>
      new AskForRatingUseCase(
        inject(RATE_PROMPT_REPOSITORY),
        inject(SCAN_REPOSITORY),
        inject(CLOCK),
      ),
  },
  {
    provide: RecordNewChapterOpenedUseCase,
    useFactory: () =>
      new RecordNewChapterOpenedUseCase(inject(RATE_PROMPT_REPOSITORY)),
  },
];

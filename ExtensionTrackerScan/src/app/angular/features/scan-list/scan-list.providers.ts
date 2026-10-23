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
import { ChangeCheckIntervalUseCase } from '../../../core/use-cases/change-check-interval.use-case';
import { ClearRatingUseCase } from '../../../core/use-cases/clear-rating.use-case';
import { DeleteScanUseCase } from '../../../core/use-cases/delete-scan.use-case';
import { RateScanUseCase } from '../../../core/use-cases/rate-scan.use-case';
import { RestoreScanUseCase } from '../../../core/use-cases/restore-scan.use-case';
import { ToggleFavoriteUseCase } from '../../../core/use-cases/toggle-favorite.use-case';
import {
  CHAPTER_WATCH_REPOSITORY,
  CLOCK,
  COVER_BACKFILL,
  COVER_REPOSITORY,
  NOTIFICATION_PERMISSION,
  SCAN_REPOSITORY,
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
];

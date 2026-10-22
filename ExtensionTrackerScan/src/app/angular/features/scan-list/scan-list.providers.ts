import { inject, Provider } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ChromeStorageCoverRepository } from '../../../core/gateways/chrome-storage-cover-repository.gateway';
import { ChromeStorageScanRepository } from '../../../core/gateways/chrome-storage-scan-repository.gateway';
import { ConsoleScanRepository } from '../../../core/gateways/console-scan-repository.gateway';
import { SystemClock } from '../../../core/gateways/system-clock.gateway';
import { DEV_COVERS } from '../../../core/gateways/in-memory/dev-covers';
import { DEV_SCANS } from '../../../core/gateways/in-memory/dev-scans';
import { InMemoryCoverRepository } from '../../../core/gateways/in-memory/in-memory-cover-repository.gateway';
import { InMemoryScanRepository } from '../../../core/gateways/in-memory/in-memory-scan-repository.gateway';
import { ScanRepository } from '../../../core/ports/scan-repository.port';
import { DeleteScanUseCase } from '../../../core/use-cases/delete-scan.use-case';
import { RateScanUseCase } from '../../../core/use-cases/rate-scan.use-case';
import { ToggleFavoriteUseCase } from '../../../core/use-cases/toggle-favorite.use-case';
import {
  CLOCK,
  COVER_BACKFILL,
  COVER_REPOSITORY,
  SCAN_REPOSITORY,
} from '../../injection-tokens';
import { ChromeRuntimeCoverBackfill } from './gateways/chrome-runtime-cover-backfill.gateway';
import { InMemoryCoverBackfill } from './gateways/in-memory-cover-backfill.gateway';

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
    provide: RateScanUseCase,
    useFactory: () =>
      new RateScanUseCase(
        announcingSaves(inject(SCAN_REPOSITORY), 'scan is updated'),
      ),
  },
];

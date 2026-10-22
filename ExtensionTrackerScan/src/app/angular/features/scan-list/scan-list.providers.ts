import { inject, Provider } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ChromeStorageScanRepository } from '../../../core/gateways/chrome-storage-scan-repository.gateway';
import { ConsoleScanRepository } from '../../../core/gateways/console-scan-repository.gateway';
import { DEV_SCANS } from '../../../core/gateways/in-memory/dev-scans';
import { InMemoryScanRepository } from '../../../core/gateways/in-memory/in-memory-scan-repository.gateway';
import { ScanRepository } from '../../../core/ports/scan-repository.port';
import { DeleteScanUseCase } from '../../../core/use-cases/delete-scan.use-case';
import { RateScanUseCase } from '../../../core/use-cases/rate-scan.use-case';
import { ToggleFavoriteUseCase } from '../../../core/use-cases/toggle-favorite.use-case';
import { SCAN_REPOSITORY } from '../../injection-tokens';

const announcingSaves = (
  scanRepository: ScanRepository,
  savedMessage: string,
): ScanRepository =>
  environment.production
    ? scanRepository
    : new ConsoleScanRepository(scanRepository, savedMessage);

export const SCAN_LIST_PROVIDERS: Provider[] = [
  {
    provide: SCAN_REPOSITORY,
    useFactory: () =>
      environment.production
        ? new ChromeStorageScanRepository()
        : new InMemoryScanRepository(DEV_SCANS),
  },
  {
    provide: DeleteScanUseCase,
    useFactory: () =>
      new DeleteScanUseCase(
        announcingSaves(inject(SCAN_REPOSITORY), 'scan is deleted'),
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

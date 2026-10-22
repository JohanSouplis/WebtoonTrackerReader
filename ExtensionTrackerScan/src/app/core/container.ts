import { Container } from 'inversify';

import { ChromeBrowserHistory } from './gateways/chrome-browser-history.gateway';
import { ChromeCoverImages } from './gateways/chrome-cover-image.gateway';
import { ChromeOffscreenPageReader } from './gateways/chrome-offscreen-page-reader.gateway';
import { ChromeStorageCoverRepository } from './gateways/chrome-storage-cover-repository.gateway';
import { ChromeStorageScanRepository } from './gateways/chrome-storage-scan-repository.gateway';
import { DiscordCrashReporter } from './gateways/discord-crash-reporter.gateway';
import { SystemClock } from './gateways/system-clock.gateway';
import { BackfillCoversUseCase } from './use-cases/backfill-covers.use-case';
import { ImportReadingHistoryUseCase } from './use-cases/import-reading-history.use-case';
import { RecordCoverUseCase } from './use-cases/record-cover.use-case';
import { RecordVisitedPageUseCase } from './use-cases/record-visited-page.use-case';

const container = new Container();
container
  .bind(RecordVisitedPageUseCase)
  .toDynamicValue(
    () =>
      new RecordVisitedPageUseCase(
        new ChromeStorageScanRepository(),
        new DiscordCrashReporter(),
        new SystemClock(),
      ),
  );
container
  .bind(ImportReadingHistoryUseCase)
  .toDynamicValue(
    () =>
      new ImportReadingHistoryUseCase(
        new ChromeBrowserHistory(),
        new ChromeStorageScanRepository(),
        new DiscordCrashReporter(),
      ),
  );
container
  .bind(RecordCoverUseCase)
  .toDynamicValue(
    () =>
      new RecordCoverUseCase(
        new ChromeStorageScanRepository(),
        new ChromeStorageCoverRepository(),
        new ChromeOffscreenPageReader(),
        new ChromeCoverImages(),
        new SystemClock(),
      ),
  );
container
  .bind(BackfillCoversUseCase)
  .toDynamicValue(
    () =>
      new BackfillCoversUseCase(
        new ChromeStorageScanRepository(),
        new ChromeStorageCoverRepository(),
        new ChromeOffscreenPageReader(),
        new ChromeCoverImages(),
        new SystemClock(),
      ),
  );

export { container };

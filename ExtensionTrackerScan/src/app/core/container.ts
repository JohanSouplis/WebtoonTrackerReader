import { Container } from 'inversify';

import { ChromeBrowserHistory } from './gateways/chrome-browser-history.gateway';
import { ChromeNewChapterAlerts } from './gateways/chrome-new-chapter-alerts.gateway';
import { ChromeCoverImages } from './gateways/chrome-cover-image.gateway';
import { ChromeOffscreenPageReader } from './gateways/chrome-offscreen-page-reader.gateway';
import { ChromeStorageChapterWatchRepository } from './gateways/chrome-storage-chapter-watch-repository.gateway';
import { ChromeStorageCoverRepository } from './gateways/chrome-storage-cover-repository.gateway';
import { ChromeStorageHostProfileRepository } from './gateways/chrome-storage-host-profile-repository.gateway';
import { ChromeStorageReportSettingsRepository } from './gateways/chrome-storage-report-settings-repository.gateway';
import { ChromeStorageScanRepository } from './gateways/chrome-storage-scan-repository.gateway';
import { ChromeStorageWatchSettingsRepository } from './gateways/chrome-storage-watch-settings-repository.gateway';
import { DiscordCrashReporter } from './gateways/discord-crash-reporter.gateway';
import { FetchWebPages } from './gateways/fetch-web-page.gateway';
import { SystemClock } from './gateways/system-clock.gateway';
import { SystemTimer } from './gateways/system-timer.gateway';
import { BackfillCoversUseCase } from './use-cases/backfill-covers.use-case';
import { CheckNewChaptersUseCase } from './use-cases/check-new-chapters.use-case';
import { ImportReadingHistoryUseCase } from './use-cases/import-reading-history.use-case';
import { RecordCoverUseCase } from './use-cases/record-cover.use-case';
import { RecordVisitedPageUseCase } from './use-cases/record-visited-page.use-case';
import { ShowNewChapterCountUseCase } from './use-cases/show-new-chapter-count.use-case';

const container = new Container();
container
  .bind(RecordVisitedPageUseCase)
  .toDynamicValue(
    () =>
      new RecordVisitedPageUseCase(
        new ChromeStorageScanRepository(),
        new DiscordCrashReporter(),
        new ChromeStorageReportSettingsRepository(),
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
        new ChromeStorageReportSettingsRepository(),
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

container
  .bind(CheckNewChaptersUseCase)
  .toDynamicValue(
    () =>
      new CheckNewChaptersUseCase(
        new ChromeStorageScanRepository(),
        new ChromeStorageChapterWatchRepository(),
        new ChromeStorageHostProfileRepository(),
        new ChromeStorageWatchSettingsRepository(),
        new FetchWebPages(),
        new SystemTimer(),
        new ChromeNewChapterAlerts(),
        new SystemClock(),
      ),
  );
container
  .bind(ShowNewChapterCountUseCase)
  .toDynamicValue(
    () =>
      new ShowNewChapterCountUseCase(
        new ChromeStorageScanRepository(),
        new ChromeStorageChapterWatchRepository(),
        new ChromeNewChapterAlerts(),
      ),
  );

export { container };

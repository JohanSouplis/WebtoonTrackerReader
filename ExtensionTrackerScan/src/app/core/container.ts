import { Container } from 'inversify';

import { ChromeBrowserHistory } from './gateways/chrome-browser-history.gateway';
import { ChromeStorageScanRepository } from './gateways/chrome-storage-scan-repository.gateway';
import { DiscordCrashReporter } from './gateways/discord-crash-reporter.gateway';
import { SystemClock } from './gateways/system-clock.gateway';
import { ImportReadingHistoryUseCase } from './use-cases/import-reading-history.use-case';
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

export { container };

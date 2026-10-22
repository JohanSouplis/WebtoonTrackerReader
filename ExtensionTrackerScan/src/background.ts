import { container } from './app/core/container';
import { VisitedPage } from './app/core/domain/parsed-page';
import { ImportReadingHistoryUseCase } from './app/core/use-cases/import-reading-history.use-case';
import { RecordVisitedPageUseCase } from './app/core/use-cases/record-visited-page.use-case';

const IMPORT_INTERVAL_MS = 3600000;

const recordVisitedPage = container.get(RecordVisitedPageUseCase);
const importReadingHistory = container.get(ImportReadingHistoryUseCase);

const parseVisitedPage = (message: unknown): VisitedPage | undefined =>
  typeof message === 'object' &&
  message !== null &&
  'pageTitle' in message &&
  'url' in message &&
  typeof message.pageTitle === 'string' &&
  message.pageTitle !== '' &&
  typeof message.url === 'string'
    ? { pageTitle: message.pageTitle, url: message.url }
    : undefined;

const importHistory = (): void => {
  void importReadingHistory.execute();
};

chrome.runtime.onMessage.addListener((message: unknown) => {
  const visitedPage = parseVisitedPage(message);
  if (visitedPage) {
    void recordVisitedPage.execute(visitedPage);
  }
});

importHistory();
setInterval(importHistory, IMPORT_INTERVAL_MS);

import { container } from './app/core/container';
import { ImportReadingHistoryUseCase } from './app/core/use-cases/import-reading-history.use-case';
import { RecordVisitedPageUseCase } from './app/core/use-cases/record-visited-page.use-case';
import { parsePageSignals } from './page-signals-message';

const IMPORT_INTERVAL_MS = 3600000;

const recordVisitedPage = container.get(RecordVisitedPageUseCase);
const importReadingHistory = container.get(ImportReadingHistoryUseCase);

const importHistory = (): void => {
  void importReadingHistory.execute();
};

chrome.runtime.onMessage.addListener((message: unknown) => {
  const page = parsePageSignals(message);
  if (page) {
    void recordVisitedPage.execute(page);
  }
});

importHistory();
setInterval(importHistory, IMPORT_INTERVAL_MS);

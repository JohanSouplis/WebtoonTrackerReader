import { container } from './app/core/container';
import { BackfillCoversUseCase } from './app/core/use-cases/backfill-covers.use-case';
import { ImportReadingHistoryUseCase } from './app/core/use-cases/import-reading-history.use-case';
import { RecordCoverUseCase } from './app/core/use-cases/record-cover.use-case';
import { RecordVisitedPageUseCase } from './app/core/use-cases/record-visited-page.use-case';
import { parseCoverBackfillMessage } from './cover-backfill-message';
import { parsePageSignals } from './page-signals-message';

const IMPORT_INTERVAL_MS = 3600000;

const recordVisitedPage = container.get(RecordVisitedPageUseCase);
const importReadingHistory = container.get(ImportReadingHistoryUseCase);
const recordCover = container.get(RecordCoverUseCase);
const backfillCovers = container.get(BackfillCoversUseCase);

const importHistory = (): void => {
  void importReadingHistory.execute();
};

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse) => {
    const page = parsePageSignals(message);
    if (page) {
      void recordVisitedPage
        .execute(page)
        .then(() => recordCover.execute(page));
      return false;
    }
    const titles = parseCoverBackfillMessage(message);
    if (titles) {
      void backfillCovers.execute(titles).finally(() => sendResponse());
      return true;
    }
    return false;
  },
);

importHistory();
setInterval(importHistory, IMPORT_INTERVAL_MS);

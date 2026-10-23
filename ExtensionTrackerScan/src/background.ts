import { container } from './app/core/container';
import { BackfillCoversUseCase } from './app/core/use-cases/backfill-covers.use-case';
import { CheckNewChaptersUseCase } from './app/core/use-cases/check-new-chapters.use-case';
import { ImportReadingHistoryUseCase } from './app/core/use-cases/import-reading-history.use-case';
import { RecordCoverUseCase } from './app/core/use-cases/record-cover.use-case';
import { RecordFirstUseUseCase } from './app/core/use-cases/record-first-use.use-case';
import { RecordTelemetryUseCase } from './app/core/use-cases/record-telemetry.use-case';
import { RecordVisitedPageUseCase } from './app/core/use-cases/record-visited-page.use-case';
import { SendDailyDigestUseCase } from './app/core/use-cases/send-daily-digest.use-case';
import { ShowNewChapterCountUseCase } from './app/core/use-cases/show-new-chapter-count.use-case';
import { parseCoverBackfillMessage } from './cover-backfill-message';
import { watchNewChapters } from './new-chapters-alarm';
import { parsePageSignals } from './page-signals-message';
import { watchTelemetry } from './telemetry-alarm';

const IMPORT_INTERVAL_MS = 3600000;

watchTelemetry(
  container.get(RecordTelemetryUseCase),
  container.get(SendDailyDigestUseCase),
);

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

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    void container.get(RecordFirstUseUseCase).execute();
  }
});

importHistory();
setInterval(importHistory, IMPORT_INTERVAL_MS);
watchNewChapters(
  container.get(CheckNewChaptersUseCase),
  container.get(ShowNewChapterCountUseCase),
);

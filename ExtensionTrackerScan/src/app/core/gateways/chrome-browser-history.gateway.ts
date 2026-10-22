import {
  BrowserHistoryPort,
  HistoryVisit,
} from '../ports/browser-history.port';

const LAST_IMPORT_KEY = 'dateLastSearch';
const MAX_RESULTS = 100000;

const toStoredPrecision = (lastVisitTime?: number): Date =>
  new Date(lastVisitTime ? Math.floor(lastVisitTime / 1000) * 1000 : NaN);

export class ChromeBrowserHistory implements BrowserHistoryPort {
  async findPagesVisitedSinceLastImport(): Promise<HistoryVisit[]> {
    const { dateLastSearch } = await chrome.storage.local.get<{
      dateLastSearch: unknown;
    }>([LAST_IMPORT_KEY]);
    const items = await chrome.history.search({
      text: '',
      maxResults: MAX_RESULTS,
      startTime: typeof dateLastSearch === 'number' ? dateLastSearch : 0,
    });
    await chrome.storage.local.set({ [LAST_IMPORT_KEY]: Date.now() });
    return items.flatMap(({ title, url, lastVisitTime }) =>
      title && url
        ? [
            {
              page: { pageTitle: title, url },
              readAt: toStoredPrecision(lastVisitTime),
            },
          ]
        : [],
    );
  }
}

import { ChromeBrowserHistory } from './chrome-browser-history.gateway';
import { FakeChromeStorage, installChrome } from './fake-chrome.fixture';

describe('ChromeBrowserHistory', () => {
  it('should search the history visited since the last import and remember this import', async () => {
    const { storage, queries } = useChrome(
      { dateLastSearch: 1700000000000 },
      [],
    );
    const importStart = Date.now();

    await new ChromeBrowserHistory().findPagesVisitedSinceLastImport();

    expect(queries).toEqual([
      { text: '', maxResults: 100000, startTime: 1700000000000 },
    ]);
    expect(storage.items['dateLastSearch']).toBeGreaterThanOrEqual(importStart);
  });

  it('should search the whole history when no import happened yet', async () => {
    const { queries } = useChrome({}, []);

    await new ChromeBrowserHistory().findPagesVisitedSinceLastImport();

    expect(queries).toEqual([{ text: '', maxResults: 100000, startTime: 0 }]);
  });

  it('should date each visit to the second and skip the pages without title or url', async () => {
    useChrome({}, [
      {
        title: 'Overgeared Chapter 266 - Manganato',
        url: 'url.com',
        lastVisitTime: 1741600000900,
      },
      { title: 'Overgeared Chapter 265 - Manganato', url: 'url2.com' },
      { title: '', url: 'url3.com', lastVisitTime: 1741600000900 },
      { title: 'No url', lastVisitTime: 1741600000900 },
    ]);

    const visits =
      await new ChromeBrowserHistory().findPagesVisitedSinceLastImport();

    expect(
      visits.map(({ page, readAt }) => ({ page, readAt: readAt.getTime() })),
    ).toEqual([
      {
        page: {
          pageTitle: 'Overgeared Chapter 266 - Manganato',
          url: 'url.com',
        },
        readAt: 1741600000000,
      },
      {
        page: {
          pageTitle: 'Overgeared Chapter 265 - Manganato',
          url: 'url2.com',
        },
        readAt: NaN,
      },
    ]);
  });
});

const useChrome = (
  items: Record<string, unknown>,
  historyItems: Pick<
    chrome.history.HistoryItem,
    'title' | 'url' | 'lastVisitTime'
  >[],
) => {
  const storage = new FakeChromeStorage(items);
  const queries: chrome.history.HistoryQuery[] = [];
  installChrome({
    storage: { local: storage },
    history: {
      search: async (query: chrome.history.HistoryQuery) => {
        queries.push(query);
        return historyItems;
      },
    },
  });
  return { storage, queries };
};

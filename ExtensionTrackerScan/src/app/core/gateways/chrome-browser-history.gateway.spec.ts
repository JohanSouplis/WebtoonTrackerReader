import { ClockPort } from '../ports/clock.port';
import { ChromeBrowserHistory } from './chrome-browser-history.gateway';
import { FakeChromeStorage, installChrome } from './fake-chrome.fixture';

describe('ChromeBrowserHistory', () => {
  it('should import a visit that another device synced after the previous import', async () => {
    const { history, clock, sync } = useChrome({});
    clock.set(at('10:15'));
    await history.findVisitsNotYetImported();
    sync(item(PHONE_CHAPTER, at('10:00')));
    clock.set(at('11:15'));

    const visits = await history.findVisitsNotYetImported();

    expect(visits).toEqual([visitOf(PHONE_CHAPTER, at('10:00'))]);
  });

  it('should never deliver the same visit twice across imports', async () => {
    const { history, clock, sync } = useChrome({});
    sync(item(PHONE_CHAPTER, at('10:00')));
    clock.set(at('10:15'));
    const first = await history.findVisitsNotYetImported();
    clock.set(at('11:15'));

    const second = await history.findVisitsNotYetImported();

    expect(first).toEqual([visitOf(PHONE_CHAPTER, at('10:00'))]);
    expect(second).toEqual([]);
  });

  it('should deliver a page again when the reader visits it again', async () => {
    const { history, clock, sync } = useChrome({});
    sync(item(PHONE_CHAPTER, at('10:00')));
    clock.set(at('10:15'));
    await history.findVisitsNotYetImported();
    sync(item(PHONE_CHAPTER, at('11:00')));
    clock.set(at('11:15'));

    const visits = await history.findVisitsNotYetImported();

    expect(visits).toEqual([visitOf(PHONE_CHAPTER, at('11:00'))]);
  });

  it('should search the whole history when no import happened yet', async () => {
    const { history, queries } = useChrome({});

    await history.findVisitsNotYetImported();

    expect(queries).toEqual([{ text: '', maxResults: 100000, startTime: 0 }]);
  });

  it('should remember this import and only the visits that may still sync late', async () => {
    const { history, clock, storage, sync } = useChrome({});
    sync(item(PHONE_CHAPTER, at('10:00') - FOUR_DAYS));
    sync(item(PC_CHAPTER, at('10:00')));
    clock.set(at('10:15'));

    await history.findVisitsNotYetImported();

    expect(storage.items['history-import']).toEqual({
      coveredUntil: at('10:15'),
      delivered: [`${PC_CHAPTER.url}|${at('10:00')}`],
    });
  });

  it('should resume from the date of the last import of the published version, without importing its visits again', async () => {
    const { history, clock, storage, sync, queries } = useChrome({
      dateLastSearch: at('10:15'),
    });
    sync(item(PHONE_CHAPTER, at('10:00')));
    sync(item(PC_CHAPTER, at('10:30')));
    clock.set(at('11:15'));

    const first = await history.findVisitsNotYetImported();
    clock.set(at('12:15'));
    const second = await history.findVisitsNotYetImported();

    expect(queries[0]?.startTime).toBe(at('10:15') - THREE_DAYS);
    expect(first).toEqual([visitOf(PC_CHAPTER, at('10:30'))]);
    expect(second).toEqual([]);
    expect(storage.items['dateLastSearch']).toBeUndefined();
  });

  it('should date each visit to the second and skip the pages without title, url or date', async () => {
    const { history, sync } = useChrome({});
    sync({
      title: 'Overgeared Chapter 266 - Manganato',
      url: 'url.com',
      lastVisitTime: 1741600000900,
    });
    sync({ title: 'Overgeared Chapter 265 - Manganato', url: 'url2.com' });
    sync({ title: '', url: 'url3.com', lastVisitTime: 1741600000900 });
    sync({ title: 'No url', lastVisitTime: 1741600000900 });

    const visits = await history.findVisitsNotYetImported();

    expect(visits).toEqual([
      {
        page: {
          pageTitle: 'Overgeared Chapter 266 - Manganato',
          url: 'url.com',
        },
        readAt: new Date(1741600000000),
      },
    ]);
  });
});

type FakeHistoryItem = Pick<
  chrome.history.HistoryItem,
  'title' | 'url' | 'lastVisitTime'
>;

type Page = { readonly title: string; readonly url: string };

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
const FOUR_DAYS = 4 * 24 * 60 * 60 * 1000;

const PHONE_CHAPTER: Page = {
  title: 'Overgeared Chapter 266 - Manganato',
  url: 'https://chapmanganato.to/manga-hi985065/chapter-266',
};

const PC_CHAPTER: Page = {
  title: 'Nano Machine - Chapter 190 - Flame Comics',
  url: 'https://flamecomics.xyz/nano-machine-chapter-190/',
};

const at = (time: string): number =>
  new Date(`2025-03-10T${time}:00.250Z`).getTime();

const item = (page: Page, lastVisitTime: number): FakeHistoryItem => ({
  ...page,
  lastVisitTime,
});

const visitOf = (page: Page, lastVisitTime: number) => ({
  page: { pageTitle: page.title, url: page.url },
  readAt: new Date(Math.floor(lastVisitTime / 1000) * 1000),
});

const useChrome = (items: Record<string, unknown>) => {
  const storage = new FakeChromeStorage(items);
  const queries: chrome.history.HistoryQuery[] = [];
  const byUrl = new Map<string | undefined, FakeHistoryItem>();
  let now = 0;
  const clock: ClockPort = { now: () => new Date(now) };
  installChrome({
    storage: { local: storage },
    history: {
      search: async (query: chrome.history.HistoryQuery) => {
        queries.push(query);
        return Array.from(byUrl.values()).filter(
          ({ lastVisitTime }) =>
            lastVisitTime === undefined ||
            lastVisitTime >= (query.startTime ?? 0),
        );
      },
    },
  });
  return {
    storage,
    queries,
    history: new ChromeBrowserHistory(clock),
    clock: {
      set: (time: number) => {
        now = time;
      },
    },
    sync: (historyItem: FakeHistoryItem) => {
      byUrl.set(historyItem.url ?? historyItem.title, historyItem);
    },
  };
};

import {
  BrowserHistoryPort,
  HistoryVisit,
} from '../ports/browser-history.port';
import { ClockPort } from '../ports/clock.port';

const IMPORT_KEY = 'history-import';
const LEGACY_IMPORT_KEY = 'dateLastSearch';
const MAX_RESULTS = 100000;
const SYNC_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

type ImportLedger = {
  readonly coveredUntil: number;
  readonly delivered: ReadonlySet<string>;
  readonly deliveredBefore: number;
};

type DatedItem = {
  readonly title: string;
  readonly url: string;
  readonly lastVisitTime: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const keysOf = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((key): key is string => typeof key === 'string')
    : [];

const ledgerOf = (stored: unknown, legacy: unknown): ImportLedger => {
  if (isRecord(stored) && typeof stored['coveredUntil'] === 'number') {
    return {
      coveredUntil: stored['coveredUntil'],
      delivered: new Set(keysOf(stored['delivered'])),
      deliveredBefore: 0,
    };
  }
  const coveredUntil = typeof legacy === 'number' ? legacy : 0;
  return { coveredUntil, delivered: new Set(), deliveredBefore: coveredUntil };
};

const datedItemOf = ({
  title,
  url,
  lastVisitTime,
}: chrome.history.HistoryItem): DatedItem[] =>
  title && url && lastVisitTime !== undefined
    ? [{ title, url, lastVisitTime }]
    : [];

const keyOf = ({ url, lastVisitTime }: DatedItem): string =>
  `${url}|${lastVisitTime}`;

const isDelivered = (ledger: ImportLedger, item: DatedItem): boolean =>
  ledger.delivered.has(keyOf(item)) ||
  item.lastVisitTime < ledger.deliveredBefore;

const visitOf = ({ title, url, lastVisitTime }: DatedItem): HistoryVisit => ({
  page: { pageTitle: title, url },
  readAt: new Date(Math.floor(lastVisitTime / 1000) * 1000),
});

export class ChromeBrowserHistory implements BrowserHistoryPort {
  constructor(private readonly clock: ClockPort) {}

  async findVisitsNotYetImported(): Promise<HistoryVisit[]> {
    const importStart = this.clock.now().getTime();
    const stored = await chrome.storage.local.get([
      IMPORT_KEY,
      LEGACY_IMPORT_KEY,
    ]);
    const ledger = ledgerOf(stored[IMPORT_KEY], stored[LEGACY_IMPORT_KEY]);
    const items = (
      await chrome.history.search({
        text: '',
        maxResults: MAX_RESULTS,
        startTime: Math.max(0, ledger.coveredUntil - SYNC_GRACE_MS),
      })
    ).flatMap(datedItemOf);
    await chrome.storage.local.set({
      [IMPORT_KEY]: {
        coveredUntil: importStart,
        delivered: items
          .filter(
            ({ lastVisitTime }) => lastVisitTime >= importStart - SYNC_GRACE_MS,
          )
          .map(keyOf),
      },
    });
    await chrome.storage.local.remove(LEGACY_IMPORT_KEY);
    return items.filter((item) => !isDelivered(ledger, item)).map(visitOf);
  }
}

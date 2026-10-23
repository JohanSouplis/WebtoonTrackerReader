import {
  ChapterWatch,
  ChapterWatches,
  NewChapterWatch,
  UpToDateWatch,
} from '../domain/chapter-watch';
import { UNSUPPORTED_REASONS } from '../domain/chapter-check';
import { ScanTitle } from '../domain/scan-title';
import { ChapterWatchRepository } from '../ports/chapter-watch-repository.port';

const WATCH_KEY_PREFIX = 'watch:';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const dateOf = (value: unknown): Date | undefined => {
  const date = new Date(typeof value === 'string' ? value : NaN);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const keyOf = (title: ScanTitle): string =>
  `${WATCH_KEY_PREFIX}${title.seriesKey.value}`;

const lastKnownOf = (
  stored: Record<string, unknown>,
  site: string,
): UpToDateWatch | NewChapterWatch | undefined => {
  const latest = stored['latest'];
  const checkedAt = dateOf(stored['checkedAt']);
  if (typeof latest !== 'number' || !checkedAt) {
    return undefined;
  }
  if (stored['kind'] === 'up-to-date') {
    return { kind: 'up-to-date', site, latest, checkedAt };
  }
  const foundAt = dateOf(stored['foundAt']);
  const url = stored['url'];
  if (stored['kind'] !== 'new' || !foundAt) {
    return undefined;
  }
  return typeof url === 'string'
    ? { kind: 'new', site, latest, url, foundAt, checkedAt }
    : { kind: 'new', site, latest, foundAt, checkedAt };
};

const toWatch = (stored: unknown): ChapterWatch | undefined => {
  if (!isRecord(stored) || typeof stored['site'] !== 'string') {
    return undefined;
  }
  const site = stored['site'];
  switch (stored['kind']) {
    case 'unsupported': {
      const reason = UNSUPPORTED_REASONS.find(
        (known) => known === stored['reason'],
      );
      const checkedAt = dateOf(stored['checkedAt']);
      return reason && checkedAt
        ? { kind: 'unsupported', site, reason, checkedAt }
        : undefined;
    }
    case 'failing': {
      const since = dateOf(stored['since']);
      const nextAttemptAt = dateOf(stored['nextAttemptAt']);
      const attempts = stored['attempts'];
      const lastKnown = isRecord(stored['lastKnown'])
        ? lastKnownOf(stored['lastKnown'], site)
        : undefined;
      if (!since || !nextAttemptAt || typeof attempts !== 'number') {
        return undefined;
      }
      return lastKnown
        ? { kind: 'failing', site, since, attempts, nextAttemptAt, lastKnown }
        : { kind: 'failing', site, since, attempts, nextAttemptAt };
    }
    default:
      return lastKnownOf(stored, site);
  }
};

export class ChromeStorageChapterWatchRepository implements ChapterWatchRepository {
  async find(titles: readonly ScanTitle[]): Promise<ChapterWatches> {
    const stored = await chrome.storage.local.get(titles.map(keyOf));
    return new Map(
      titles.flatMap((title) => {
        const watch = toWatch(stored[keyOf(title)]);
        return watch ? [[title.value, watch]] : [];
      }),
    );
  }

  async save(title: ScanTitle, watch: ChapterWatch): Promise<void> {
    await chrome.storage.local.set({
      [keyOf(title)]: JSON.parse(JSON.stringify(watch)),
    });
  }

  async remove(title: ScanTitle): Promise<void> {
    await chrome.storage.local.remove(keyOf(title));
  }
}

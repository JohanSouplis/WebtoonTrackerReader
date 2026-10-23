import {
  ChapterCheck,
  CheckOutcome,
  currentLessons,
  HostLessons,
  LessonsLearned,
  lessonsAfter,
  UnsupportedReason,
  WatchedScan,
} from './chapter-check';
import { ScanSnapshot } from './scan-library';
import { ScanTitle } from './scan-title';
import { siteOf } from './site';

type Checked = {
  readonly site: string;
  readonly checkedAt: Date;
};

export type UpToDateWatch = Checked & {
  readonly kind: 'up-to-date';
  readonly latest: number;
};

export type NewChapterWatch = Checked & {
  readonly kind: 'new';
  readonly latest: number;
  readonly url: string;
  readonly foundAt: Date;
};

export type ChapterWatch =
  | UpToDateWatch
  | NewChapterWatch
  | (Checked & {
      readonly kind: 'unsupported';
      readonly reason: UnsupportedReason;
    })
  | {
      readonly kind: 'failing';
      readonly site: string;
      readonly since: Date;
      readonly attempts: number;
      readonly nextAttemptAt: Date;
      readonly lastKnown?: UpToDateWatch | NewChapterWatch;
    };

export type ChapterWatches = ReadonlyMap<string, ChapterWatch>;

export type HostProfile = {
  readonly lessons: HostLessons;
  readonly backoff?: { readonly strikes: number; readonly until: Date };
};

export type HostProfiles = ReadonlyMap<string, HostProfile>;

export type CheckInterval = '1h' | '6h' | '24h';

export type CheckFrequency = CheckInterval | 'off';

export type WatchSettings = {
  readonly checkEvery: CheckFrequency;
};

export type NewChapter = {
  readonly title: string;
  readonly chapter: number;
  readonly url: string;
};

export type WatchStatus =
  | { readonly kind: 'new'; readonly chapter: number; readonly url: string }
  | { readonly kind: 'unsupported' }
  | { readonly kind: 'quiet' };

export type PlannedCheck = {
  readonly scan: WatchedScan;
  readonly knownLatest: number;
  readonly previous?: ChapterWatch;
};

export const DEFAULT_WATCH_SETTINGS: WatchSettings = { checkEvery: '6h' };

export const CHECK_FREQUENCIES: readonly CheckFrequency[] = [
  '1h',
  '6h',
  '24h',
  'off',
];

const CHECKS_PER_SWEEP = 50;

export const REQUEST_SPACING = { atLeastMs: 3000, jitterMs: 2000 };

const HOUR_MS = 60 * 60 * 1000;

const INTERVAL_MS: Readonly<Record<CheckFrequency, number>> = {
  '1h': HOUR_MS,
  '6h': 6 * HOUR_MS,
  '24h': 24 * HOUR_MS,
  off: Number.POSITIVE_INFINITY,
};

const UNSUPPORTED_RECHECK_MS = 7 * 24 * HOUR_MS;

const FIRST_RETRY_MS = 15 * 60 * 1000;

const FIRST_BACKOFF_MS = HOUR_MS;

const LONGEST_BACKOFF_MS = 24 * HOUR_MS;

const lastKnownOf = (
  watch: ChapterWatch | undefined,
): UpToDateWatch | NewChapterWatch | undefined => {
  switch (watch?.kind) {
    case 'up-to-date':
    case 'new':
      return watch;
    case 'failing':
      return watch.lastKnown;
    default:
      return undefined;
  }
};

const watchOnSite = (
  watches: ChapterWatches,
  scan: ScanSnapshot,
): ChapterWatch | undefined => {
  const watch = watches.get(scan.title);
  return watch && watch.site === siteOf(scan.url) ? watch : undefined;
};

export const watchStatusOf = (
  scan: ScanSnapshot,
  watches: ChapterWatches,
): WatchStatus => {
  if (!scan.isFavorite) {
    return { kind: 'quiet' };
  }
  const watch = watchOnSite(watches, scan);
  if (watch?.kind === 'unsupported') {
    return { kind: 'unsupported' };
  }
  const known = lastKnownOf(watch);
  return known?.kind === 'new' && known.latest > scan.chapter
    ? {
        kind: 'new',
        chapter: known.latest,
        url: known.url,
      }
    : { kind: 'quiet' };
};

export const newChaptersOf = (
  scans: readonly ScanSnapshot[],
  watches: ChapterWatches,
): NewChapter[] =>
  scans.flatMap((scan) => {
    const status = watchStatusOf(scan, watches);
    return status.kind === 'new'
      ? [{ title: scan.title, chapter: status.chapter, url: status.url }]
      : [];
  });

const dueTimeOf = (
  watch: ChapterWatch | undefined,
  settings: WatchSettings,
): number => {
  if (!watch) {
    return 0;
  }
  switch (watch.kind) {
    case 'failing':
      return watch.nextAttemptAt.getTime();
    case 'unsupported':
      return watch.checkedAt.getTime() + UNSUPPORTED_RECHECK_MS;
    default:
      return watch.checkedAt.getTime() + INTERVAL_MS[settings.checkEvery];
  }
};

const isBackingOff = (profile: HostProfile | undefined, now: Date): boolean =>
  profile?.backoff !== undefined && profile.backoff.until > now;

export const planChapterChecks = (
  scans: readonly ScanSnapshot[],
  watches: ChapterWatches,
  hosts: HostProfiles,
  settings: WatchSettings,
  now: Date,
): PlannedCheck[][] => {
  if (settings.checkEvery === 'off') {
    return [];
  }
  const lanes = new Map<string, PlannedCheck[]>();
  scans
    .flatMap((scan) => {
      const site = siteOf(scan.url);
      if (!scan.isFavorite || !site || isBackingOff(hosts.get(site), now)) {
        return [];
      }
      const previous = watchOnSite(watches, scan);
      const dueTime = dueTimeOf(previous, settings);
      return dueTime <= now.getTime()
        ? [{ scan, site, previous, dueTime }]
        : [];
    })
    .sort((a, b) => a.dueTime - b.dueTime)
    .slice(0, CHECKS_PER_SWEEP)
    .forEach(({ scan, site, previous }) => {
      const planned: PlannedCheck = {
        scan: {
          title: ScanTitle.of(scan.title),
          site,
          chapter: scan.chapter,
          url: scan.url,
          seriesUrl: scan.seriesUrl,
        },
        knownLatest: Math.max(
          scan.chapter,
          lastKnownOf(previous)?.latest ?? scan.chapter,
        ),
        previous,
      };
      lanes.set(site, [...(lanes.get(site) ?? []), planned]);
    });
  return [...lanes.values()];
};

export const startCheck = (
  { scan, knownLatest }: PlannedCheck,
  host: HostProfile | undefined,
  now: Date,
): ChapterCheck =>
  new ChapterCheck(scan, knownLatest, currentLessons(host?.lessons ?? {}, now));

const retryDelayOf = (attempts: number, settings: WatchSettings): number =>
  Math.min(
    FIRST_RETRY_MS * 2 ** (attempts - 1),
    INTERVAL_MS[settings.checkEvery],
  );

export const watchAfter = (
  previous: ChapterWatch | undefined,
  { site, chapter }: WatchedScan,
  outcome: CheckOutcome,
  settings: WatchSettings,
  now: Date,
): ChapterWatch => {
  switch (outcome.kind) {
    case 'answered': {
      if (outcome.latest <= chapter) {
        return {
          kind: 'up-to-date',
          site,
          latest: outcome.latest,
          checkedAt: now,
        };
      }
      const known = lastKnownOf(previous);
      const isKnown = known?.kind === 'new' && known.latest === outcome.latest;
      return {
        kind: 'new',
        site,
        latest: outcome.latest,
        url: isKnown ? known.url : outcome.url,
        foundAt: isKnown ? known.foundAt : now,
        checkedAt: now,
      };
    }
    case 'unsupported':
      return {
        kind: 'unsupported',
        site,
        reason: outcome.reason,
        checkedAt: now,
      };
    default: {
      const attempts = previous?.kind === 'failing' ? previous.attempts + 1 : 1;
      return {
        kind: 'failing',
        site,
        since: previous?.kind === 'failing' ? previous.since : now,
        attempts,
        nextAttemptAt: new Date(
          now.getTime() + retryDelayOf(attempts, settings),
        ),
        lastKnown: lastKnownOf(previous),
      };
    }
  }
};

export const newlyFoundChapter = (
  previous: ChapterWatch | undefined,
  next: ChapterWatch,
  { title }: WatchedScan,
): NewChapter | undefined => {
  const known = lastKnownOf(previous);
  return next.kind === 'new' &&
    !(known?.kind === 'new' && known.latest >= next.latest)
    ? {
        title: title.value,
        chapter: next.latest,
        url: next.url,
      }
    : undefined;
};

export const hostAfter =
  (outcome: CheckOutcome, lessons: LessonsLearned, now: Date) =>
  (stored: HostProfile | undefined): HostProfile => {
    const merged = lessonsAfter(stored?.lessons ?? {}, lessons, now);
    if (outcome.kind !== 'blocked') {
      return { lessons: merged };
    }
    const strikes = (stored?.backoff?.strikes ?? 0) + 1;
    return {
      lessons: merged,
      backoff: {
        strikes,
        until: new Date(
          now.getTime() +
            Math.min(FIRST_BACKOFF_MS * 2 ** (strikes - 1), LONGEST_BACKOFF_MS),
        ),
      },
    };
  };

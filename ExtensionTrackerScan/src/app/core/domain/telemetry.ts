import { CheckOutcome, StrategyKind } from './chapter-check';
import { ChapterWatch } from './chapter-watch';
import { Cover } from './cover';
import { FetchedPage } from './fetched-page';

export const ERROR_CONTEXTS = [
  'service-worker',
  'popup',
  'content-script',
  'offscreen',
] as const;

export type ErrorContext = (typeof ERROR_CONTEXTS)[number];

export const STORAGE_FAILURES = ['quota', 'io', 'corruption'] as const;

export type StorageFailure = (typeof STORAGE_FAILURES)[number];

export const CHECK_RESULTS = [
  'new',
  'up-to-date',
  'unsupported',
  'failing',
] as const satisfies readonly ChapterWatch['kind'][];

export type CheckResult = ChapterWatch['kind'];

const STRATEGIES = [
  'feed',
  'series-page',
  'next-chapter-url',
] as const satisfies readonly StrategyKind[];

export const COVER_SEARCH_OUTCOMES = [
  'found-page',
  'found-series-page',
  'missing',
] as const;

export type CoverSearchOutcome = (typeof COVER_SEARCH_OUTCOMES)[number];

export type ErrorEvent =
  | {
      readonly kind: 'unhandled-error';
      readonly context: ErrorContext;
      readonly errorName: string;
      readonly messageHash: string;
      readonly stackTop?: string;
    }
  | {
      readonly kind: 'storage-error';
      readonly context: ErrorContext;
      readonly failure: StorageFailure;
    };

export type TelemetryEvent =
  | ErrorEvent
  | { readonly kind: 'parse-miss'; readonly host: string }
  | {
      readonly kind: 'chapter-check';
      readonly host: string;
      readonly outcome: CheckResult;
      readonly strategy?: StrategyKind;
      readonly httpStatus?: number;
    }
  | { readonly kind: 'cover-search'; readonly outcome: CoverSearchOutcome }
  | { readonly kind: 'proposal-send-failed' };

export type TelemetryEventKind = TelemetryEvent['kind'];

export const TELEMETRY_EVENT_KINDS = [
  'unhandled-error',
  'storage-error',
  'parse-miss',
  'chapter-check',
  'cover-search',
  'proposal-send-failed',
] as const satisfies readonly TelemetryEventKind[];

export type Counts = Readonly<Record<string, number>>;

export type DayTally = {
  readonly day: string;
  readonly events: Counts;
  readonly checks: Readonly<Record<string, Counts>>;
  readonly strategies: Counts;
  readonly httpStatuses: Counts;
  readonly parseMisses: Counts;
  readonly covers: Counts;
  readonly errors: Counts;
  readonly reported: readonly string[];
};

export type PendingDigest = {
  readonly tally: DayTally;
  readonly status: 'waiting' | 'sending';
};

export type TelemetryLog = {
  readonly today?: DayTally;
  readonly pending?: PendingDigest;
  readonly lastDigestDay?: string;
  readonly pausedUntil?: Date;
};

export type Count = { readonly key: string; readonly count: number };

export type HostChecks = {
  readonly host: string;
  readonly total: number;
  readonly outcomes: readonly Count[];
};

export type DailyDigest = {
  readonly day: string;
  readonly events: readonly Count[];
  readonly checkOutcomes: readonly Count[];
  readonly strategies: readonly Count[];
  readonly httpStatuses: readonly Count[];
  readonly topCheckedHosts: readonly HostChecks[];
  readonly topParseMissHosts: readonly Count[];
  readonly covers: readonly Count[];
  readonly topErrors: readonly Count[];
};

export type ErrorReport = { readonly day: string; readonly event: ErrorEvent };

export type TelemetryReport =
  | ({ readonly kind: 'error-report' } & ErrorReport)
  | { readonly kind: 'daily-digest'; readonly digest: DailyDigest };

export type SendResult =
  | { readonly kind: 'sent' }
  | { readonly kind: 'rate-limited'; readonly retryAfterMs: number }
  | { readonly kind: 'offline' }
  | { readonly kind: 'failed' };

export type ThrownError = {
  readonly name: string;
  readonly message: string;
  readonly stack?: string;
};

export const MAX_ERROR_REPORTS_PER_DAY = 5;

export const TOP_COUNT = 10;

const MAX_KEYS = 100;

const OTHER_KEY = '(other)';

export const EMPTY_TELEMETRY_LOG: TelemetryLog = {};

const ERROR_NAME = /^[A-Za-z][A-Za-z0-9]{0,39}$/;

const MESSAGE_HASH = /^[0-9a-f]{8}$/;

const STACK_TOP = /^[\w.-]{1,60}\.js:\d{1,7}:\d{1,7}$/;

const EXTENSION_FRAME =
  /chrome-extension:\/\/[a-p]{32}\/(?:[\w.-]+\/)*([\w.-]{1,60}\.js):(\d{1,7}):(\d{1,7})/;

const STORAGE_FAILURE_PATTERNS: readonly [StorageFailure, RegExp][] = [
  ['quota', /QUOTA_BYTES|quota exceeded/i],
  ['io', /^IO error/i],
  ['corruption', /corruption/i],
];

export const isErrorName = (text: string): boolean => ERROR_NAME.test(text);

export const isMessageHash = (text: string): boolean => MESSAGE_HASH.test(text);

export const isStackTop = (text: string): boolean => STACK_TOP.test(text);

export const dayOf = (date: Date): string => date.toISOString().slice(0, 10);

const templateOf = (message: string): string =>
  message
    .replace(/[a-z][a-z\d+.-]*:\/\/\S+/gi, '<url>')
    .replace(/"[^"]*"|'[^']*'|“[^”]*”|‘[^’]*’/g, '<text>')
    .replace(/\d+/g, '#');

const hashOf = (text: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

const stackTopOf = (stack: string | undefined): string | undefined => {
  const frame = stack?.match(EXTENSION_FRAME);
  return frame ? `${frame[1]}:${frame[2]}:${frame[3]}` : undefined;
};

export const errorEventOf = (
  context: ErrorContext,
  thrown: ThrownError,
): ErrorEvent => {
  const storageFailure = STORAGE_FAILURE_PATTERNS.find(([, pattern]) =>
    pattern.test(thrown.message),
  );
  if (storageFailure) {
    return { kind: 'storage-error', context, failure: storageFailure[0] };
  }
  const stackTop = stackTopOf(thrown.stack);
  return {
    kind: 'unhandled-error',
    context,
    errorName: isErrorName(thrown.name) ? thrown.name : 'Error',
    messageHash: hashOf(templateOf(thrown.message)),
    ...(stackTop ? { stackTop } : {}),
  };
};

export const chapterCheckEvent = (
  host: string,
  outcome: CheckOutcome,
  watch: ChapterWatch,
  lastPage: FetchedPage | undefined,
): TelemetryEvent => ({
  kind: 'chapter-check',
  host,
  outcome: watch.kind,
  ...(outcome.kind === 'answered' ? { strategy: outcome.strategy } : {}),
  ...(watch.kind === 'failing' && lastPage?.kind === 'page'
    ? { httpStatus: lastPage.status }
    : {}),
});

export const coverSearchEvent = (cover: Cover): TelemetryEvent => ({
  kind: 'cover-search',
  outcome: cover.kind === 'found' ? `found-${cover.from}` : 'missing',
});

const fingerprintOf = (event: ErrorEvent): string =>
  event.kind === 'storage-error'
    ? `${event.context} storage ${event.failure}`
    : `${event.context} ${event.errorName} ${event.messageHash}`;

const isErrorEvent = (event: TelemetryEvent): event is ErrorEvent =>
  event.kind === 'unhandled-error' || event.kind === 'storage-error';

const emptyTally = (day: string): DayTally => ({
  day,
  events: {},
  checks: {},
  strategies: {},
  httpStatuses: {},
  parseMisses: {},
  covers: {},
  errors: {},
  reported: [],
});

const increment = (counts: Counts, key: string): Counts => {
  const counted =
    key in counts || Object.keys(counts).length < MAX_KEYS ? key : OTHER_KEY;
  return { ...counts, [counted]: (counts[counted] ?? 0) + 1 };
};

const tallyEvent = (tally: DayTally, event: TelemetryEvent): DayTally => {
  const counted = { ...tally, events: increment(tally.events, event.kind) };
  switch (event.kind) {
    case 'unhandled-error':
    case 'storage-error':
      return {
        ...counted,
        errors: increment(counted.errors, fingerprintOf(event)),
      };
    case 'parse-miss':
      return {
        ...counted,
        parseMisses: increment(counted.parseMisses, event.host),
      };
    case 'chapter-check': {
      const host =
        event.host in counted.checks ||
        Object.keys(counted.checks).length < MAX_KEYS
          ? event.host
          : OTHER_KEY;
      return {
        ...counted,
        checks: {
          ...counted.checks,
          [host]: increment(counted.checks[host] ?? {}, event.outcome),
        },
        strategies: event.strategy
          ? increment(counted.strategies, event.strategy)
          : counted.strategies,
        httpStatuses:
          event.httpStatus === undefined
            ? counted.httpStatuses
            : increment(counted.httpStatuses, String(event.httpStatus)),
      };
    }
    case 'cover-search':
      return { ...counted, covers: increment(counted.covers, event.outcome) };
    case 'proposal-send-failed':
      return counted;
  }
};

const isEmptyTally = (tally: DayTally): boolean =>
  Object.keys(tally.events).length === 0;

const isPaused = (log: TelemetryLog, now: Date): boolean =>
  log.pausedUntil !== undefined && log.pausedUntil > now;

const rollOver = (log: TelemetryLog, now: Date): TelemetryLog => {
  const day = dayOf(now);
  if (!log.today || log.today.day >= day) {
    return log;
  }
  const closed = log.today;
  const isDigestible =
    !isEmptyTally(closed) &&
    (log.lastDigestDay === undefined || closed.day > log.lastDigestDay);
  return {
    ...log,
    today: undefined,
    pending: isDigestible ? { tally: closed, status: 'waiting' } : undefined,
  };
};

export const recordEvent = (
  log: TelemetryLog,
  event: TelemetryEvent,
  now: Date,
): { readonly log: TelemetryLog; readonly report?: ErrorReport } => {
  const rolled = rollOver(log, now);
  const today = tallyEvent(rolled.today ?? emptyTally(dayOf(now)), event);
  if (
    !isErrorEvent(event) ||
    isPaused(rolled, now) ||
    today.reported.includes(fingerprintOf(event)) ||
    today.reported.length >= MAX_ERROR_REPORTS_PER_DAY
  ) {
    return { log: { ...rolled, today } };
  }
  return {
    log: {
      ...rolled,
      today: { ...today, reported: [...today.reported, fingerprintOf(event)] },
    },
    report: { day: today.day, event },
  };
};

export const claimDigest = (
  log: TelemetryLog,
  now: Date,
): { readonly log: TelemetryLog; readonly tally?: DayTally } => {
  const rolled = rollOver(log, now);
  const { pending } = rolled;
  if (pending?.status === 'sending') {
    return {
      log: { ...rolled, pending: undefined, lastDigestDay: pending.tally.day },
    };
  }
  if (!pending || isPaused(rolled, now)) {
    return { log: rolled };
  }
  return {
    log: { ...rolled, pending: { ...pending, status: 'sending' } },
    tally: pending.tally,
  };
};

const pausedAfter = (
  log: TelemetryLog,
  result: SendResult,
  now: Date,
): TelemetryLog =>
  result.kind === 'rate-limited'
    ? { ...log, pausedUntil: new Date(now.getTime() + result.retryAfterMs) }
    : log;

export const settleErrorReport = (
  log: TelemetryLog,
  result: SendResult,
  now: Date,
): { readonly log: TelemetryLog } => ({ log: pausedAfter(log, result, now) });

export const settleDigest = (
  log: TelemetryLog,
  day: string,
  result: SendResult,
  now: Date,
): { readonly log: TelemetryLog } => {
  const paused = pausedAfter(log, result, now);
  if (paused.pending?.tally.day !== day) {
    return { log: paused };
  }
  switch (result.kind) {
    case 'rate-limited':
    case 'offline':
      return {
        log: { ...paused, pending: { ...paused.pending, status: 'waiting' } },
      };
    case 'sent':
    case 'failed':
      return { log: { ...paused, pending: undefined, lastDigestDay: day } };
  }
};

export const forgetTelemetry = (
  log: TelemetryLog,
): { readonly log: TelemetryLog } => ({
  log: {
    ...(log.lastDigestDay ? { lastDigestDay: log.lastDigestDay } : {}),
    ...(log.pausedUntil ? { pausedUntil: log.pausedUntil } : {}),
  },
});

const countsOf = (keys: readonly string[], counts: Counts): readonly Count[] =>
  keys.map((key) => ({ key, count: counts[key] ?? 0 }));

const sumOf = (counts: Counts): number =>
  Object.values(counts).reduce((sum, count) => sum + count, 0);

const topOf = (counts: Counts): readonly Count[] =>
  Object.entries(counts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, TOP_COUNT);

export const digestOf = (tally: DayTally): DailyDigest => {
  const checks = Object.values(tally.checks);
  return {
    day: tally.day,
    events: countsOf(TELEMETRY_EVENT_KINDS, tally.events),
    checkOutcomes: CHECK_RESULTS.map((key) => ({
      key,
      count: checks.reduce((sum, counts) => sum + (counts[key] ?? 0), 0),
    })),
    strategies: countsOf(STRATEGIES, tally.strategies),
    httpStatuses: topOf(tally.httpStatuses),
    topCheckedHosts: Object.entries(tally.checks)
      .map(([host, counts]) => ({
        host,
        total: sumOf(counts),
        outcomes: countsOf(CHECK_RESULTS, counts),
      }))
      .sort((a, b) => b.total - a.total || a.host.localeCompare(b.host))
      .slice(0, TOP_COUNT),
    topParseMissHosts: topOf(tally.parseMisses),
    covers: countsOf(COVER_SEARCH_OUTCOMES, tally.covers),
    topErrors: topOf(tally.errors),
  };
};

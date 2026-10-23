import {
  Counts,
  DayTally,
  EMPTY_TELEMETRY_LOG,
  PendingDigest,
  TelemetryLog,
} from '../domain/telemetry';
import { TelemetryLogRepository } from '../ports/telemetry-log-repository.port';

const TELEMETRY_KEY = 'telemetry';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toDay = (value: unknown): string | undefined =>
  typeof value === 'string' && DAY.test(value) ? value : undefined;

const toCounts = (value: unknown): Counts =>
  isRecord(value)
    ? Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, number] =>
            typeof entry[1] === 'number' && entry[1] > 0,
        ),
      )
    : {};

const toTally = (value: unknown): DayTally | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }
  const day = toDay(value['day']);
  const checks = value['checks'];
  const reported = value['reported'];
  return day
    ? {
        day,
        events: toCounts(value['events']),
        checks: isRecord(checks)
          ? Object.fromEntries(
              Object.entries(checks).map(([host, counts]) => [
                host,
                toCounts(counts),
              ]),
            )
          : {},
        strategies: toCounts(value['strategies']),
        httpStatuses: toCounts(value['httpStatuses']),
        parseMisses: toCounts(value['parseMisses']),
        covers: toCounts(value['covers']),
        errors: toCounts(value['errors']),
        reported: Array.isArray(reported)
          ? reported.filter((item) => typeof item === 'string')
          : [],
      }
    : undefined;
};

const toPending = (value: unknown): PendingDigest | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }
  const tally = toTally(value['tally']);
  const status = value['status'];
  return tally && (status === 'waiting' || status === 'sending')
    ? { tally, status }
    : undefined;
};

const toDate = (value: unknown): Date | undefined => {
  const date = typeof value === 'string' ? new Date(value) : undefined;
  return date && !Number.isNaN(date.getTime()) ? date : undefined;
};

const toLog = (stored: unknown): TelemetryLog => {
  if (!isRecord(stored)) {
    return EMPTY_TELEMETRY_LOG;
  }
  const today = toTally(stored['today']);
  const pending = toPending(stored['pending']);
  const lastDigestDay = toDay(stored['lastDigestDay']);
  const pausedUntil = toDate(stored['pausedUntil']);
  return {
    ...(today ? { today } : {}),
    ...(pending ? { pending } : {}),
    ...(lastDigestDay ? { lastDigestDay } : {}),
    ...(pausedUntil ? { pausedUntil } : {}),
  };
};

const toStored = ({ pausedUntil, ...log }: TelemetryLog) => ({
  ...log,
  ...(pausedUntil ? { pausedUntil: pausedUntil.toISOString() } : {}),
});

export class ChromeStorageTelemetryLog implements TelemetryLogRepository {
  private static updates: Promise<unknown> = Promise.resolve();

  update<T extends { readonly log: TelemetryLog }>(
    change: (log: TelemetryLog) => T,
  ): Promise<T> {
    const update = ChromeStorageTelemetryLog.updates.then(async () => {
      const stored = await chrome.storage.local.get([TELEMETRY_KEY]);
      const changed = change(toLog(stored[TELEMETRY_KEY]));
      await chrome.storage.local.set({
        [TELEMETRY_KEY]: toStored(changed.log),
      });
      return changed;
    });
    ChromeStorageTelemetryLog.updates = update.catch(() => undefined);
    return update;
  }
}

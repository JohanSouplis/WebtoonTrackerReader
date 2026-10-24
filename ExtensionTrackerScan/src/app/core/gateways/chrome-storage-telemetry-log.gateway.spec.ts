import { TelemetryLog } from '../domain/telemetry';
import { ChromeStorageTelemetryLog } from './chrome-storage-telemetry-log.gateway';
import { FakeChromeStorage, installChrome } from './fake-chrome.fixture';

describe('ChromeStorageTelemetryLog', () => {
  it('should read back the log it saved under the telemetry key', async () => {
    const storage = useStorage({});
    const repository = new ChromeStorageTelemetryLog();

    await repository.update(() => ({ log: LOG }));
    const { log } = await repository.update((stored) => ({ log: stored }));

    expect(log).toEqual(LOG);
    expect(Object.keys(storage.items)).toEqual(['telemetry']);
  });

  it('should read a day counted before new series to confirm were counted', async () => {
    useStorage({
      telemetry: { today: { ...LOG.today, pendingSeries: undefined } },
    });

    const { log } = await new ChromeStorageTelemetryLog().update((stored) => ({
      log: stored,
    }));

    expect(log.today).toEqual({ ...LOG.today, pendingSeries: {} });
  });

  it('should start from an empty log when the stored one is unreadable', async () => {
    useStorage({
      telemetry: {
        today: { day: 'yesterday', events: { 'parse-miss': 'two' } },
        pending: { tally: LOG.today, status: 'lost' },
        pausedUntil: 'never',
      },
    });

    const { log } = await new ChromeStorageTelemetryLog().update((stored) => ({
      log: stored,
    }));

    expect(log).toEqual({});
  });

  it('should apply each update to the log the previous one stored, across repositories', async () => {
    useStorage({});
    const countOne = (log: TelemetryLog) => ({
      log: {
        ...log,
        lastDigestDay: `2026-10-${String(Number(log.lastDigestDay?.slice(8) ?? 0) + 1).padStart(2, '0')}`,
      },
    });

    await Promise.all([
      new ChromeStorageTelemetryLog().update(countOne),
      new ChromeStorageTelemetryLog().update(countOne),
      new ChromeStorageTelemetryLog().update(countOne),
    ]);
    const { log } = await new ChromeStorageTelemetryLog().update((stored) => ({
      log: stored,
    }));

    expect(log.lastDigestDay).toEqual('2026-10-03');
  });
});

const LOG: TelemetryLog = {
  today: {
    day: '2026-10-23',
    events: { 'chapter-check': 2, 'unhandled-error': 1 },
    checks: { 'toonily.com': { 'up-to-date': 2 } },
    strategies: { feed: 2 },
    httpStatuses: {},
    parseMisses: {},
    covers: {},
    pendingSeries: { 'manhwareads.com': { added: 1, dismissed: 2 } },
    errors: { 'popup TypeError 0badc0de': 1 },
    reported: ['popup TypeError 0badc0de'],
  },
  pending: {
    status: 'waiting',
    tally: {
      day: '2026-10-22',
      events: { 'parse-miss': 1 },
      checks: {},
      strategies: {},
      httpStatuses: {},
      parseMisses: { 'mangapark.org': 1 },
      covers: {},
      pendingSeries: {},
      errors: {},
      reported: [],
    },
  },
  lastDigestDay: '2026-10-21',
  pausedUntil: new Date('2026-10-23T08:00:30Z'),
};

const useStorage = (items: Record<string, unknown>): FakeChromeStorage => {
  const storage = new FakeChromeStorage(items);
  installChrome({ storage: { local: storage } });
  return storage;
};

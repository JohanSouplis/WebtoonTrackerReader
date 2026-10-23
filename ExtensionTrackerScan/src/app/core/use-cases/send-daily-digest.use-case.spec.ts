import {
  errorEventOf,
  SendResult,
  TelemetryEvent,
  TelemetryLog,
  TelemetryReport,
} from '../domain/telemetry';
import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryReportSettingsRepository } from '../gateways/in-memory/in-memory-report-settings-repository.gateway';
import { InMemoryTelemetryLog } from '../gateways/in-memory/in-memory-telemetry-log.gateway';
import { InMemoryTelemetry } from '../gateways/in-memory/in-memory-telemetry.gateway';
import { RecordTelemetryUseCase } from './record-telemetry.use-case';
import { SendDailyDigestUseCase } from './send-daily-digest.use-case';

describe('SendDailyDigestUseCase', () => {
  it("should send the previous day's counts per event, outcome, strategy, host, cover and error", async () => {
    const { digests, recordAt, sendDigestAt } = aTelemetry();
    const events: TelemetryEvent[] = [
      check('asuracomic.net', 'up-to-date', 'feed'),
      check('asuracomic.net', 'new', 'series-page'),
      check('asuracomic.net', 'failing', undefined, 503),
      check('toonily.com', 'up-to-date', 'next-chapter-url'),
      check('toonily.com', 'unsupported'),
      { kind: 'parse-miss', host: 'mangapark.org' },
      { kind: 'parse-miss', host: 'mangapark.org' },
      { kind: 'parse-miss', host: 'toonily.com' },
      { kind: 'cover-search', outcome: 'found-page' },
      { kind: 'cover-search', outcome: 'found-series-page' },
      { kind: 'cover-search', outcome: 'missing' },
      { kind: 'proposal-send-failed' },
      errorEventOf('popup', { name: 'TypeError', message: 'Failed to fetch' }),
      errorEventOf('popup', { name: 'TypeError', message: 'Failed to fetch' }),
      errorEventOf('offscreen', {
        name: 'Error',
        message: 'QUOTA_BYTES quota exceeded',
      }),
    ];
    for (const event of events) {
      await recordAt('2026-10-22T10:00:00Z', event);
    }

    await sendDigestAt('2026-10-23T00:10:00Z');

    expect(digests()).toEqual([
      {
        day: '2026-10-22',
        events: [
          { key: 'unhandled-error', count: 2 },
          { key: 'storage-error', count: 1 },
          { key: 'parse-miss', count: 3 },
          { key: 'chapter-check', count: 5 },
          { key: 'cover-search', count: 3 },
          { key: 'proposal-send-failed', count: 1 },
        ],
        checkOutcomes: [
          { key: 'new', count: 1 },
          { key: 'up-to-date', count: 2 },
          { key: 'unsupported', count: 1 },
          { key: 'failing', count: 1 },
        ],
        strategies: [
          { key: 'feed', count: 1 },
          { key: 'series-page', count: 1 },
          { key: 'next-chapter-url', count: 1 },
        ],
        httpStatuses: [{ key: '503', count: 1 }],
        topCheckedHosts: [
          {
            host: 'asuracomic.net',
            total: 3,
            outcomes: [
              { key: 'new', count: 1 },
              { key: 'up-to-date', count: 1 },
              { key: 'unsupported', count: 0 },
              { key: 'failing', count: 1 },
            ],
          },
          {
            host: 'toonily.com',
            total: 2,
            outcomes: [
              { key: 'new', count: 0 },
              { key: 'up-to-date', count: 1 },
              { key: 'unsupported', count: 1 },
              { key: 'failing', count: 0 },
            ],
          },
        ],
        topParseMissHosts: [
          { key: 'mangapark.org', count: 2 },
          { key: 'toonily.com', count: 1 },
        ],
        covers: [
          { key: 'found-page', count: 1 },
          { key: 'found-series-page', count: 1 },
          { key: 'missing', count: 1 },
        ],
        topErrors: [
          {
            key: expect.stringMatching(/^popup TypeError [0-9a-f]{8}$/),
            count: 2,
          },
          { key: 'offscreen storage quota', count: 1 },
        ],
      },
    ]);
  });

  it('should keep the ten most checked sites of the day', async () => {
    const { digests, recordAt, sendDigestAt } = aTelemetry();
    for (let site = 1; site <= 12; site++) {
      for (let checks = 0; checks < site; checks++) {
        await recordAt(
          '2026-10-22T10:00:00Z',
          check(`site${site}.com`, 'up-to-date'),
        );
      }
    }

    await sendDigestAt('2026-10-23T00:10:00Z');

    expect(digests()[0]?.topCheckedHosts.map(({ host }) => host)).toEqual([
      'site12.com',
      'site11.com',
      'site10.com',
      'site9.com',
      'site8.com',
      'site7.com',
      'site6.com',
      'site5.com',
      'site4.com',
      'site3.com',
    ]);
  });

  it("should send a day's digest only once", async () => {
    const { digests, recordAt, sendDigestAt } = aTelemetry();
    await recordAt('2026-10-22T10:00:00Z', check('toonily.com', 'up-to-date'));

    await sendDigestAt('2026-10-23T00:10:00Z');
    await sendDigestAt('2026-10-23T01:10:00Z');
    await recordAt('2026-10-23T02:00:00Z', check('toonily.com', 'up-to-date'));
    await sendDigestAt('2026-10-23T03:10:00Z');

    expect(digests().map(({ day }) => day)).toEqual(['2026-10-22']);
  });

  it('should close the day on its own when nothing happened since midnight', async () => {
    const { digests, recordAt, sendDigestAt } = aTelemetry();
    await recordAt('2026-10-22T23:59:00Z', check('toonily.com', 'new', 'feed'));

    await sendDigestAt('2026-10-22T23:59:30Z');
    await sendDigestAt('2026-10-23T00:00:30Z');

    expect(digests().map(({ day }) => day)).toEqual(['2026-10-22']);
  });

  it('should send no digest for a day without events', async () => {
    const { telemetry, sendDigestAt } = aTelemetry();

    await sendDigestAt('2026-10-22T10:00:00Z');
    await sendDigestAt('2026-10-23T10:00:00Z');

    expect(telemetry.sentReports).toEqual([]);
  });

  it('should send the digest after the delay Discord asked for', async () => {
    const { digests, recordAt, sendDigestAt } = aTelemetry({
      answers: [{ kind: 'rate-limited', retryAfterMs: 90 * 60 * 1000 }],
    });
    await recordAt('2026-10-22T10:00:00Z', check('toonily.com', 'up-to-date'));

    await sendDigestAt('2026-10-23T00:10:00Z');
    await sendDigestAt('2026-10-23T01:10:00Z');
    expect(digests()).toEqual([]);
    await sendDigestAt('2026-10-23T02:10:00Z');

    expect(digests().map(({ day }) => day)).toEqual(['2026-10-22']);
  });

  it('should keep the digest while the browser is offline', async () => {
    const { digests, recordAt, sendDigestAt } = aTelemetry({
      answers: [{ kind: 'offline' }, { kind: 'offline' }],
    });
    await recordAt('2026-10-22T10:00:00Z', check('toonily.com', 'up-to-date'));

    await sendDigestAt('2026-10-23T00:10:00Z');
    await sendDigestAt('2026-10-23T01:10:00Z');
    await sendDigestAt('2026-10-23T02:10:00Z');

    expect(digests().map(({ day }) => day)).toEqual(['2026-10-22']);
  });

  it('should drop a digest still unsent when the next day closes', async () => {
    const { digests, recordAt, sendDigestAt } = aTelemetry({
      answers: [{ kind: 'offline' }],
    });
    await recordAt('2026-10-22T10:00:00Z', check('toonily.com', 'up-to-date'));
    await sendDigestAt('2026-10-23T00:10:00Z');
    await recordAt('2026-10-23T10:00:00Z', check('asuracomic.net', 'new'));

    await sendDigestAt('2026-10-24T00:10:00Z');

    expect(digests().map(({ day }) => day)).toEqual(['2026-10-23']);
  });

  it('should not send again a digest whose sending failed', async () => {
    const { telemetry, recordAt, sendDigestAt } = aTelemetry({
      answers: [{ kind: 'failed' }],
    });
    await recordAt('2026-10-22T10:00:00Z', check('toonily.com', 'up-to-date'));

    await sendDigestAt('2026-10-23T00:10:00Z');
    await sendDigestAt('2026-10-23T01:10:00Z');

    expect(telemetry.sentReports).toEqual([]);
  });

  it('should count a digest left sending by a stopped service worker as sent', async () => {
    const { telemetry, sendDigestAt } = aTelemetry({
      log: {
        pending: {
          status: 'sending',
          tally: {
            day: '2026-10-22',
            events: { 'chapter-check': 1 },
            checks: { 'toonily.com': { 'up-to-date': 1 } },
            strategies: {},
            httpStatuses: {},
            parseMisses: {},
            covers: {},
            errors: {},
            reported: [],
          },
        },
      },
    });

    await sendDigestAt('2026-10-23T01:10:00Z');
    await sendDigestAt('2026-10-23T02:10:00Z');

    expect(telemetry.sentReports).toEqual([]);
  });

  it('should send nothing and forget the counts when the reader turned reports off', async () => {
    const settings = new InMemoryReportSettingsRepository();
    const { telemetry, recordAt, sendDigestAt } = aTelemetry({ settings });
    await recordAt('2026-10-22T10:00:00Z', check('toonily.com', 'up-to-date'));
    await settings.save({ sendsParseReports: false });

    await sendDigestAt('2026-10-23T00:10:00Z');
    await settings.save({ sendsParseReports: true });
    await sendDigestAt('2026-10-23T01:10:00Z');

    expect(telemetry.sentReports).toEqual([]);
  });
});

const check = (
  host: string,
  outcome: 'new' | 'up-to-date' | 'unsupported' | 'failing',
  strategy?: 'feed' | 'series-page' | 'next-chapter-url',
  httpStatus?: number,
): TelemetryEvent => ({
  kind: 'chapter-check',
  host,
  outcome,
  ...(strategy ? { strategy } : {}),
  ...(httpStatus ? { httpStatus } : {}),
});

const aTelemetry = ({
  settings = new InMemoryReportSettingsRepository(),
  answers = [],
  log,
}: {
  settings?: InMemoryReportSettingsRepository;
  answers?: SendResult[];
  log?: TelemetryLog;
} = {}) => {
  const telemetryLog = new InMemoryTelemetryLog(log);
  const telemetry = new InMemoryTelemetry(answers);
  const recordAt = (at: string, event: TelemetryEvent) =>
    new RecordTelemetryUseCase(
      settings,
      telemetryLog,
      new InMemoryTelemetry(),
      new FixedClock(new Date(at)),
    ).execute(event);
  const sendDigestAt = (at: string) =>
    new SendDailyDigestUseCase(
      settings,
      telemetryLog,
      telemetry,
      new FixedClock(new Date(at)),
    ).execute();
  const digests = () =>
    telemetry.sentReports.flatMap((report: TelemetryReport) =>
      report.kind === 'daily-digest' ? [report.digest] : [],
    );
  return { telemetry, digests, recordAt, sendDigestAt };
};

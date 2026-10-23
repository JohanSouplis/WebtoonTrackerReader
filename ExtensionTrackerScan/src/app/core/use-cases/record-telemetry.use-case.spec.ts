import { ReportSettings } from '../domain/report-settings';
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

describe('RecordTelemetryUseCase', () => {
  it('should send an error report with only its name, message hash and place the first time it happens in a day', async () => {
    const { telemetry, recordAt } = aTelemetry();

    await recordAt('2026-10-22T08:00:00Z', SERVICE_WORKER_ERROR);

    expect(telemetry.sentReports).toEqual([
      {
        kind: 'error-report',
        day: '2026-10-22',
        event: {
          kind: 'unhandled-error',
          context: 'service-worker',
          errorName: 'TypeError',
          messageHash: expect.stringMatching(/^[0-9a-f]{8}$/),
          stackTop: 'background.js:2:31337',
        },
      },
    ]);
    expect(JSON.stringify(telemetry.sentReports)).not.toContain('asura');
  });

  it('should send an error once a day when only an address or a title changes in its message', async () => {
    const { telemetry, recordAt } = aTelemetry();

    await recordAt('2026-10-22T08:00:00Z', SERVICE_WORKER_ERROR);
    await recordAt(
      '2026-10-22T09:00:00Z',
      errorEventOf('service-worker', {
        name: 'TypeError',
        message:
          "Cannot read 'Omniscient Reader' of https://mangadex.org/title/42",
      }),
    );

    expect(telemetry.sentReports).toHaveLength(1);
  });

  it('should send two errors whose messages differ beyond addresses and titles', async () => {
    const { telemetry, recordAt } = aTelemetry();

    await recordAt('2026-10-22T08:00:00Z', SERVICE_WORKER_ERROR);
    await recordAt(
      '2026-10-22T09:00:00Z',
      errorEventOf('service-worker', {
        name: 'TypeError',
        message: 'Failed to fetch',
      }),
    );

    expect(telemetry.sentReports).toHaveLength(2);
  });

  it('should send the same error again on the next day', async () => {
    const { telemetry, recordAt } = aTelemetry();

    await recordAt('2026-10-22T08:00:00Z', SERVICE_WORKER_ERROR);
    await recordAt('2026-10-23T00:30:00Z', SERVICE_WORKER_ERROR);

    expect(telemetry.sentReports.map(dayOfReport)).toEqual([
      '2026-10-22',
      '2026-10-23',
    ]);
  });

  it('should send at most five error reports a day', async () => {
    const { telemetry, recordAt } = aTelemetry();

    for (const name of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
      await recordAt(
        '2026-10-22T08:00:00Z',
        errorEventOf('popup', { name: `${name}Error`, message: 'boom' }),
      );
    }

    expect(telemetry.sentReports).toHaveLength(5);
  });

  it('should send a storage failure as a storage error, without its message', async () => {
    const { telemetry, recordAt } = aTelemetry();

    await recordAt(
      '2026-10-22T08:00:00Z',
      errorEventOf('popup', {
        name: 'Error',
        message:
          'IO error: /home/reader/.config/chromium/Local Extension Settings/LOCK',
      }),
    );

    expect(telemetry.sentReports).toEqual([
      {
        kind: 'error-report',
        day: '2026-10-22',
        event: { kind: 'storage-error', context: 'popup', failure: 'io' },
      },
    ]);
  });

  it('should only count the events that are not errors', async () => {
    const { telemetry, recordAt } = aTelemetry();

    await recordAt('2026-10-22T08:00:00Z', {
      kind: 'chapter-check',
      host: 'asuracomic.net',
      outcome: 'failing',
      httpStatus: 503,
    });
    await recordAt('2026-10-22T08:00:00Z', { kind: 'proposal-send-failed' });

    expect(telemetry.sentReports).toEqual([]);
  });

  it('should send nothing when the reader turned reports off', async () => {
    const { telemetry, recordAt } = aTelemetry({
      settings: { sendsParseReports: false },
    });

    await recordAt('2026-10-22T08:00:00Z', SERVICE_WORKER_ERROR);

    expect(telemetry.sentReports).toEqual([]);
  });

  it('should send no error while Discord asks to wait, then send the next one', async () => {
    const { telemetry, recordAt } = aTelemetry({
      answers: [{ kind: 'rate-limited', retryAfterMs: 30000 }],
    });

    await recordAt('2026-10-22T08:00:00Z', SERVICE_WORKER_ERROR);
    await recordAt(
      '2026-10-22T08:00:20Z',
      errorEventOf('popup', { name: 'RangeError', message: 'boom' }),
    );
    await recordAt(
      '2026-10-22T08:00:31Z',
      errorEventOf('offscreen', { name: 'SyntaxError', message: 'boom' }),
    );

    expect(telemetry.sentReports.map(contextOfReport)).toEqual(['offscreen']);
  });

  it('should not send again an error whose report failed the same day', async () => {
    const { telemetry, recordAt } = aTelemetry({
      answers: [{ kind: 'failed' }],
    });

    await recordAt('2026-10-22T08:00:00Z', SERVICE_WORKER_ERROR);
    await recordAt('2026-10-22T09:00:00Z', SERVICE_WORKER_ERROR);

    expect(telemetry.sentReports).toEqual([]);
  });
});

const SERVICE_WORKER_ERROR = errorEventOf('service-worker', {
  name: 'TypeError',
  message: "Cannot read 'Solo Leveling' of https://asuracomic.net/series/1",
  stack: [
    "TypeError: Cannot read 'Solo Leveling' of https://asuracomic.net/series/1",
    '    at e.execute (chrome-extension://abcdefghijklmnopabcdefghijklmnop/background.js:2:31337)',
  ].join('\n'),
});

const dayOfReport = (report: TelemetryReport) =>
  report.kind === 'error-report' ? report.day : report.digest.day;

const contextOfReport = (report: TelemetryReport) =>
  report.kind === 'error-report' ? report.event.context : 'digest';

const aTelemetry = ({
  settings = { sendsParseReports: true },
  answers = [],
  log,
}: {
  settings?: ReportSettings;
  answers?: SendResult[];
  log?: TelemetryLog;
} = {}) => {
  const reportSettings = new InMemoryReportSettingsRepository(settings);
  const telemetryLog = new InMemoryTelemetryLog(log);
  const telemetry = new InMemoryTelemetry(answers);
  const recordAt = (at: string, event: TelemetryEvent) =>
    new RecordTelemetryUseCase(
      reportSettings,
      telemetryLog,
      telemetry,
      new FixedClock(new Date(at)),
    ).execute(event);
  return { telemetry, recordAt };
};

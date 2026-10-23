import {
  claimDigest,
  digestOf,
  forgetTelemetry,
  settleDigest,
} from '../domain/telemetry';
import { ClockPort } from '../ports/clock.port';
import { ReportSettingsRepository } from '../ports/report-settings-repository.port';
import { TelemetryLogRepository } from '../ports/telemetry-log-repository.port';
import { TelemetryPort } from '../ports/telemetry.port';

export class SendDailyDigestUseCase {
  constructor(
    private readonly reportSettings: ReportSettingsRepository,
    private readonly telemetryLog: TelemetryLogRepository,
    private readonly telemetry: TelemetryPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(): Promise<void> {
    if (!(await this.reportSettings.load()).sendsParseReports) {
      await this.telemetryLog.update(forgetTelemetry);
      return;
    }
    const { tally } = await this.telemetryLog.update((log) =>
      claimDigest(log, this.clock.now()),
    );
    if (!tally) {
      return;
    }
    const result = await this.telemetry.send({
      kind: 'daily-digest',
      digest: digestOf(tally),
    });
    await this.telemetryLog.update((log) =>
      settleDigest(log, tally.day, result, this.clock.now()),
    );
  }
}

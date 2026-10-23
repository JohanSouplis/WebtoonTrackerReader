import {
  recordEvent,
  settleErrorReport,
  TelemetryEvent,
} from '../domain/telemetry';
import { ClockPort } from '../ports/clock.port';
import { ReportSettingsRepository } from '../ports/report-settings-repository.port';
import { TelemetryLogRepository } from '../ports/telemetry-log-repository.port';
import { TelemetryPort } from '../ports/telemetry.port';

export class RecordTelemetryUseCase {
  constructor(
    private readonly reportSettings: ReportSettingsRepository,
    private readonly telemetryLog: TelemetryLogRepository,
    private readonly telemetry: TelemetryPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(event: TelemetryEvent): Promise<void> {
    if (!(await this.reportSettings.load()).sendsParseReports) {
      return;
    }
    const { report } = await this.telemetryLog.update((log) =>
      recordEvent(log, event, this.clock.now()),
    );
    if (!report) {
      return;
    }
    const result = await this.telemetry.send({
      kind: 'error-report',
      ...report,
    });
    await this.telemetryLog.update((log) =>
      settleErrorReport(log, result, this.clock.now()),
    );
  }
}

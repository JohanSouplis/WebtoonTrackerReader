import { SendResult, TelemetryReport } from '../../domain/telemetry';
import { TelemetryPort } from '../../ports/telemetry.port';

export class InMemoryTelemetry implements TelemetryPort {
  readonly sentReports: TelemetryReport[] = [];

  constructor(private readonly answers: SendResult[] = []) {}

  async send(report: TelemetryReport): Promise<SendResult> {
    const answer = this.answers.shift() ?? { kind: 'sent' };
    if (answer.kind === 'sent') {
      this.sentReports.push(report);
    }
    return answer;
  }
}

import { SendResult, TelemetryReport } from '../domain/telemetry';

export interface TelemetryPort {
  send(report: TelemetryReport): Promise<SendResult>;
}

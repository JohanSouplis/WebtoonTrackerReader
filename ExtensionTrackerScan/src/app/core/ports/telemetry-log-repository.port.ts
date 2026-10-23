import { TelemetryLog } from '../domain/telemetry';

export interface TelemetryLogRepository {
  update<T extends { readonly log: TelemetryLog }>(
    change: (log: TelemetryLog) => T,
  ): Promise<T>;
}

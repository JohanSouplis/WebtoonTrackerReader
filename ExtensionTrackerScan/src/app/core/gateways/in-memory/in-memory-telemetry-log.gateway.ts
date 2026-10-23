import { EMPTY_TELEMETRY_LOG, TelemetryLog } from '../../domain/telemetry';
import { TelemetryLogRepository } from '../../ports/telemetry-log-repository.port';

export class InMemoryTelemetryLog implements TelemetryLogRepository {
  constructor(private log: TelemetryLog = EMPTY_TELEMETRY_LOG) {}

  async update<T extends { readonly log: TelemetryLog }>(
    change: (log: TelemetryLog) => T,
  ): Promise<T> {
    const changed = change(this.log);
    this.log = changed.log;
    return changed;
  }
}

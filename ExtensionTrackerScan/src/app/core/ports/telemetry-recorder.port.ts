import { TelemetryEvent } from '../domain/telemetry';

export interface TelemetryRecorderPort {
  record(event: TelemetryEvent): void;
}

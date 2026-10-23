import { TelemetryEvent } from '../../domain/telemetry';
import { TelemetryRecorderPort } from '../../ports/telemetry-recorder.port';

export class InMemoryTelemetryRecorder implements TelemetryRecorderPort {
  readonly recordedEvents: TelemetryEvent[] = [];

  record(event: TelemetryEvent): void {
    this.recordedEvents.push(event);
  }
}

import { TelemetryEvent } from '../domain/telemetry';
import { TelemetryRecorderPort } from '../ports/telemetry-recorder.port';

export class InProcessTelemetryRecorder implements TelemetryRecorderPort {
  constructor(
    private readonly recordEvent: (event: TelemetryEvent) => Promise<void>,
  ) {}

  record(event: TelemetryEvent): void {
    this.recordEvent(event).catch((error: unknown) =>
      console.error('Error while recording a telemetry event:', error),
    );
  }
}

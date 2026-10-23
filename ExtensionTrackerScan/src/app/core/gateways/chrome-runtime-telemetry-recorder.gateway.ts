import { TelemetryEvent } from '../domain/telemetry';
import { TelemetryRecorderPort } from '../ports/telemetry-recorder.port';

export type TelemetryMessage = {
  readonly kind: 'telemetry-event';
  readonly event: TelemetryEvent;
};

export class ChromeRuntimeTelemetryRecorder implements TelemetryRecorderPort {
  record(event: TelemetryEvent): void {
    const message: TelemetryMessage = { kind: 'telemetry-event', event };
    chrome.runtime.sendMessage(message).catch(() => undefined);
  }
}

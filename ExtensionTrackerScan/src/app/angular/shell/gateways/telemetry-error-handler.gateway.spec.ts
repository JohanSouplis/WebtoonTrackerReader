import { ErrorHandler, Injector } from '@angular/core';
import { InMemoryTelemetryRecorder } from '../../../core/gateways/in-memory/in-memory-telemetry-recorder.gateway';
import { TELEMETRY_RECORDER } from '../../injection-tokens';
import { TelemetryErrorHandler } from './telemetry-error-handler.gateway';

describe('TelemetryErrorHandler', () => {
  it('should log an error of the popup and record its name and message hash only', () => {
    const telemetry = new InMemoryTelemetryRecorder();
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new TypeError(
      "Cannot read 'Solo Leveling' of https://asuracomic.net/series/1",
    );

    Injector.create({
      providers: [
        { provide: TELEMETRY_RECORDER, useValue: telemetry },
        { provide: ErrorHandler, useClass: TelemetryErrorHandler },
      ],
    })
      .get(ErrorHandler)
      .handleError(error);

    expect(errors.mock.calls).toEqual([[error]]);
    expect(telemetry.recordedEvents).toEqual([
      {
        kind: 'unhandled-error',
        context: 'popup',
        errorName: 'TypeError',
        messageHash: expect.stringMatching(/^[0-9a-f]{8}$/),
      },
    ]);
    errors.mockRestore();
  });
});

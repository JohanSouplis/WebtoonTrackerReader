import { ErrorHandler, Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ChromeRuntimeTelemetryRecorder } from '../../core/gateways/chrome-runtime-telemetry-recorder.gateway';
import { InMemoryTelemetryRecorder } from '../../core/gateways/in-memory/in-memory-telemetry-recorder.gateway';
import { TELEMETRY_RECORDER } from '../injection-tokens';
import { TelemetryErrorHandler } from './gateways/telemetry-error-handler.gateway';

export const SHELL_PROVIDERS: Provider[] = [
  {
    provide: TELEMETRY_RECORDER,
    useFactory: () =>
      environment.production
        ? new ChromeRuntimeTelemetryRecorder()
        : new InMemoryTelemetryRecorder(),
  },
  { provide: ErrorHandler, useClass: TelemetryErrorHandler },
];

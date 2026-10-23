import { ErrorHandler, inject, Injectable } from '@angular/core';
import { errorEventOf } from '../../../core/domain/telemetry';
import { thrownErrorOf } from '../../../../thrown-error';
import { TELEMETRY_RECORDER } from '../../injection-tokens';

@Injectable()
export class TelemetryErrorHandler implements ErrorHandler {
  private readonly telemetry = inject(TELEMETRY_RECORDER);

  handleError(error: unknown): void {
    console.error(error);
    this.telemetry.record(errorEventOf('popup', thrownErrorOf(error)));
  }
}

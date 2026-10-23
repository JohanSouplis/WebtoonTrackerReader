import { ThrownError } from './app/core/domain/telemetry';

export const thrownErrorOf = (reason: unknown): ThrownError =>
  reason instanceof Error
    ? {
        name: reason.name,
        message: reason.message,
        ...(reason.stack ? { stack: reason.stack } : {}),
      }
    : { name: 'NonError', message: String(reason) };

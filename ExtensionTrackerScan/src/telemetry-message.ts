import {
  ERROR_CONTEXTS,
  isErrorName,
  isMessageHash,
  isHost,
  isStackTop,
  PENDING_SERIES_OUTCOMES,
  STORAGE_FAILURES,
  TelemetryEvent,
} from './app/core/domain/telemetry';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toEvent = (
  event: Record<string, unknown>,
): TelemetryEvent | undefined => {
  const context = ERROR_CONTEXTS.find((known) => known === event['context']);
  const { errorName, messageHash, stackTop } = event;
  switch (event['kind']) {
    case 'unhandled-error':
      return context &&
        typeof errorName === 'string' &&
        isErrorName(errorName) &&
        typeof messageHash === 'string' &&
        isMessageHash(messageHash) &&
        (stackTop === undefined ||
          (typeof stackTop === 'string' && isStackTop(stackTop)))
        ? {
            kind: 'unhandled-error',
            context,
            errorName,
            messageHash,
            ...(stackTop ? { stackTop } : {}),
          }
        : undefined;
    case 'storage-error': {
      const failure = STORAGE_FAILURES.find(
        (known) => known === event['failure'],
      );
      return context && failure
        ? { kind: 'storage-error', context, failure }
        : undefined;
    }
    case 'proposal-send-failed':
      return { kind: 'proposal-send-failed' };
    case 'pending-series': {
      const { host } = event;
      const outcome = PENDING_SERIES_OUTCOMES.find(
        (known) => known === event['outcome'],
      );
      return typeof host === 'string' && isHost(host) && outcome
        ? { kind: 'pending-series', host, outcome }
        : undefined;
    }
    default:
      return undefined;
  }
};

export const parseTelemetryMessage = (
  message: unknown,
): TelemetryEvent | undefined =>
  isRecord(message) &&
  message['kind'] === 'telemetry-event' &&
  isRecord(message['event'])
    ? toEvent(message['event'])
    : undefined;

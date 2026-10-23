import { errorEventOf } from './app/core/domain/telemetry';
import { RecordTelemetryUseCase } from './app/core/use-cases/record-telemetry.use-case';
import { SendDailyDigestUseCase } from './app/core/use-cases/send-daily-digest.use-case';
import { parseTelemetryMessage } from './telemetry-message';
import { thrownErrorOf } from './thrown-error';

const SEND_DAILY_DIGEST_ALARM = 'send-daily-digest';

const DIGEST_PERIOD_MINUTES = 60;

const logFailure = (error: unknown): void =>
  console.error('Error while handling telemetry:', error);

const scheduleDigests = async (): Promise<void> => {
  if (!(await chrome.alarms.get(SEND_DAILY_DIGEST_ALARM))) {
    await chrome.alarms.create(SEND_DAILY_DIGEST_ALARM, {
      delayInMinutes: 1,
      periodInMinutes: DIGEST_PERIOD_MINUTES,
    });
  }
};

export const watchTelemetry = (
  recordTelemetry: RecordTelemetryUseCase,
  sendDailyDigest: SendDailyDigestUseCase,
): void => {
  const recordError = (reason: unknown): void => {
    recordTelemetry
      .execute(errorEventOf('service-worker', thrownErrorOf(reason)))
      .catch(logFailure);
  };
  self.addEventListener('error', (event) =>
    recordError(event.error ?? event.message),
  );
  self.addEventListener('unhandledrejection', (event) =>
    recordError(event.reason),
  );
  chrome.runtime.onMessage.addListener((message: unknown) => {
    const event = parseTelemetryMessage(message);
    if (event) {
      recordTelemetry.execute(event).catch(logFailure);
    }
    return false;
  });
  chrome.alarms.onAlarm.addListener(({ name }) => {
    if (name === SEND_DAILY_DIGEST_ALARM) {
      sendDailyDigest.execute().catch(logFailure);
    }
  });
  scheduleDigests().catch(logFailure);
};

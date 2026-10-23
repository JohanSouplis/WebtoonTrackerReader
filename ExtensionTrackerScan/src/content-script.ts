import { errorEventOf } from './app/core/domain/telemetry';
import { ChromeRuntimeTelemetryRecorder } from './app/core/gateways/chrome-runtime-telemetry-recorder.gateway';
import { readPageSignals } from './page-signals-reader';
import { thrownErrorOf } from './thrown-error';

const FIRST_SEND_DELAY_MS = 5000;
const SETTLE_DELAY_MS = 2000;

let sentTitle: string | undefined;
let pendingSend: ReturnType<typeof setTimeout> | undefined;

const sendWhenTitleChanged = (): void => {
  if (document.title === sentTitle) {
    return;
  }
  sentTitle = document.title;
  try {
    void chrome.runtime.sendMessage(
      readPageSignals(document, window.location.href),
    );
  } catch (error) {
    new ChromeRuntimeTelemetryRecorder().record(
      errorEventOf('content-script', thrownErrorOf(error)),
    );
  }
};

const sendWhenTitleSettles = (): void => {
  clearTimeout(pendingSend);
  pendingSend = setTimeout(sendWhenTitleChanged, SETTLE_DELAY_MS);
};

setTimeout(() => {
  sendWhenTitleChanged();
  new MutationObserver(sendWhenTitleSettles).observe(document.head, {
    subtree: true,
    childList: true,
    characterData: true,
  });
}, FIRST_SEND_DELAY_MS);

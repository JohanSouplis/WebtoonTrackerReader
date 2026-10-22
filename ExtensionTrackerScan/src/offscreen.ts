import { ReadPageMessage } from './app/core/gateways/chrome-offscreen-page-reader.gateway';
import { readPageSignals } from './page-signals-reader';

const isReadPageMessage = (message: unknown): message is ReadPageMessage =>
  typeof message === 'object' &&
  message !== null &&
  'kind' in message &&
  message.kind === 'read-page' &&
  'url' in message &&
  typeof message.url === 'string';

const readPage = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    return undefined;
  }
  const page = new DOMParser().parseFromString(
    await response.text(),
    'text/html',
  );
  return readPageSignals(page, response.url);
};

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse) => {
    if (!isReadPageMessage(message)) {
      return false;
    }
    readPage(message.url).then(sendResponse, () => sendResponse(undefined));
    return true;
  },
);

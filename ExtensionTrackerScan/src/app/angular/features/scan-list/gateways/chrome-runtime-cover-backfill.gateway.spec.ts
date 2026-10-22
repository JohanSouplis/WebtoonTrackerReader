import { ChromeRuntimeCoverBackfill } from './chrome-runtime-cover-backfill.gateway';

describe('ChromeRuntimeCoverBackfill', () => {
  it('should ask the service worker to search the covers of the titles', async () => {
    const chrome = installFakeChrome(async () => undefined);

    await new ChromeRuntimeCoverBackfill().backfillCovers(
      ['Solo Leveling'],
      () => undefined,
    );

    expect(chrome.sentMessages).toEqual([
      { kind: 'backfill-covers', titles: ['Solo Leveling'] },
    ]);
  });

  it('should tell each cover saved while the service worker searches, and nothing after', async () => {
    let coversSaved = 0;
    const chrome = installFakeChrome(async () => {
      chrome.change({ scans: {} }, 'local');
      chrome.change({ 'cover:solo leveling': {} }, 'local');
      chrome.change({ 'cover:nano machine': {} }, 'sync');
      chrome.change({ 'cover:nano machine': {} }, 'local');
    });

    await new ChromeRuntimeCoverBackfill().backfillCovers(
      ['Solo Leveling', 'Nano Machine'],
      () => coversSaved++,
    );
    chrome.change({ 'cover:the breaker': {} }, 'local');

    expect(coversSaved).toBe(2);
  });
});

type ChangeListener = (changes: object, areaName: string) => void;

const installFakeChrome = (searchCovers: () => Promise<void>) => {
  const listeners = new Set<ChangeListener>();
  const chrome = {
    sentMessages: [] as unknown[],
    change: (changes: object, areaName: string) =>
      listeners.forEach((listener) => listener(changes, areaName)),
  };
  Object.defineProperty(globalThis, 'chrome', {
    configurable: true,
    value: {
      runtime: {
        sendMessage: async (message: unknown) => {
          chrome.sentMessages.push(message);
          await searchCovers();
        },
      },
      storage: {
        onChanged: {
          addListener: (listener: ChangeListener) => listeners.add(listener),
          removeListener: (listener: ChangeListener) =>
            listeners.delete(listener),
        },
      },
    },
  });
  return chrome;
};

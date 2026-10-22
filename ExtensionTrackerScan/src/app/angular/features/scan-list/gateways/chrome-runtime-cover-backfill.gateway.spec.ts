import { ChromeRuntimeCoverBackfill } from './chrome-runtime-cover-backfill.gateway';

describe('ChromeRuntimeCoverBackfill', () => {
  it('should ask the service worker to search the covers of the titles', async () => {
    const sentMessages: unknown[] = [];
    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: {
        runtime: {
          sendMessage: async (message: unknown) => {
            sentMessages.push(message);
          },
        },
      },
    });

    await new ChromeRuntimeCoverBackfill().backfillCovers(['Solo Leveling']);

    expect(sentMessages).toEqual([
      { kind: 'backfill-covers', titles: ['Solo Leveling'] },
    ]);
  });
});

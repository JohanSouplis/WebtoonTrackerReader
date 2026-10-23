import { DiscordCrashReporter } from './discord-crash-reporter.gateway';

describe('DiscordCrashReporter', () => {
  it('should post the unparsed page to the crash report webhook', async () => {
    const requests = useWebhookAnswering({
      ok: true,
      status: 200,
      statusText: 'OK',
    });

    new DiscordCrashReporter().reportUnparsedPage(PAGE);
    await flush();

    expect(requests).toEqual([
      {
        url: 'https://discord.com/api/webhooks/1336426162653757450/wYGF0H04jEF0Z55H7xLhYV7dKrPLlDhXIMCwj0q21vx1Vhj2o8qUBHSt9DbyrsIMQ_ZH',
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content:
              '📢 **New scans known but not parsed correctly :**\n```https://mangapark.org/title/1/ch-102```\n      ```Demon Faction - Ch - MangaPark```\n      ```undefined```',
          }),
        },
      },
    ]);
  });

  it('should log the failure without rejecting when the webhook answers an error', async () => {
    useWebhookAnswering({ ok: false, status: 500, statusText: 'Server Error' });
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});

    new DiscordCrashReporter().reportUnparsedPage(PAGE);
    await flush();

    expect(errors.mock.calls).toEqual([
      ['Error when sending to discord', 'Server Error'],
      [
        'Error while sending to discord :',
        new Error('The crash report webhook answered HTTP 500'),
      ],
    ]);
    errors.mockRestore();
  });
});

const PAGE = {
  pageTitle: 'Demon Faction - Ch - MangaPark',
  url: 'https://mangapark.org/title/1/ch-102',
};

const flush = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

const useWebhookAnswering = (
  response: Pick<Response, 'ok' | 'status' | 'statusText'>,
) => {
  const requests: { url: unknown; init: unknown }[] = [];
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: async (url: unknown, init: unknown) => {
      requests.push({ url, init });
      return response;
    },
  });
  return requests;
};

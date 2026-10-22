import { DiscordWebsiteProposal } from './discord-website-proposal.gateway';

describe('DiscordWebsiteProposal', () => {
  it('should post the proposed website to the proposal webhook', async () => {
    const requests = useWebhookAnswering({
      ok: true,
      status: 200,
      statusText: 'OK',
    });

    new DiscordWebsiteProposal().propose('example-scans.com');
    await flush();

    expect(requests).toEqual([
      {
        url: expect.stringMatching(/^https:\/\/discord\.com\/api\/webhooks\//),
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '📢 **New website proposed :**\n```example-scans.com```',
          }),
        },
      },
    ]);
  });

  it('should log the failure without rejecting when the webhook answers an error', async () => {
    useWebhookAnswering({ ok: false, status: 500, statusText: 'Server Error' });
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});

    new DiscordWebsiteProposal().propose('example-scans.com');
    await flush();

    expect(errors.mock.calls).toEqual([
      ['Error when sending to discord', 'Server Error'],
      ['Error while sending to discord :', new Error('Erreur HTTP : 500')],
    ]);
    errors.mockRestore();
  });
});

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

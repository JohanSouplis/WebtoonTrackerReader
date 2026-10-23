import { DiscordWebsiteProposal } from './discord-website-proposal.gateway';

describe('DiscordWebsiteProposal', () => {
  it('should post the proposed website to the proposal webhook', async () => {
    const requests = useWebhookAnswering({
      ok: true,
      status: 200,
      statusText: 'OK',
    });

    await new DiscordWebsiteProposal().propose('example-scans.com');

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

  it('should reject when the webhook answers an error', async () => {
    useWebhookAnswering({ ok: false, status: 500, statusText: 'Server Error' });

    await expect(
      new DiscordWebsiteProposal().propose('example-scans.com'),
    ).rejects.toThrow('The proposal webhook answered HTTP 500');
  });
});

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

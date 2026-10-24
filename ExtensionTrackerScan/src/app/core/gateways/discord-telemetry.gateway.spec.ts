import { DailyDigest, TelemetryReport } from '../domain/telemetry';
import { DiscordTelemetry } from './discord-telemetry.gateway';

describe('DiscordTelemetry', () => {
  it('should post a daily digest as one embed to the crash report webhook', async () => {
    const requests = useWebhookAnswering(new Response(null, { status: 204 }));

    const result = await new DiscordTelemetry(INSTALL).send({
      kind: 'daily-digest',
      digest: DIGEST,
    });

    expect(result).toEqual({ kind: 'sent' });
    expect(requests.map(({ url }) => url)).toEqual([
      'https://discord.com/api/webhooks/1336426162653757450/wYGF0H04jEF0Z55H7xLhYV7dKrPLlDhXIMCwj0q21vx1Vhj2o8qUBHSt9DbyrsIMQ_ZH',
    ]);
    expect(requests[0]?.init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(requests[0]?.body).toEqual({
      embeds: [
        {
          title: 'Daily digest · 2026-10-22',
          color: 0x3b82f6,
          fields: [
            {
              name: 'Events',
              value:
                'unhandled-error 1 · storage-error 0 · parse-miss 2 · chapter-check 3 · cover-search 1 · proposal-send-failed 0 · pending-series 3',
            },
            {
              name: 'Chapter checks',
              value: 'new 1 · up-to-date 1 · unsupported 0 · failing 1',
            },
            {
              name: 'Strategies that answered',
              value: 'feed 1 · series-page 1 · next-chapter-url 0',
            },
            { name: 'HTTP status of failing checks', value: '503 1' },
            {
              name: 'Most checked sites',
              value:
                'asuracomic.net: 2 (new 1 · failing 1)\ntoonily.com: 1 (up-to-date 1)',
            },
            { name: 'Unreadable pages per site', value: 'mangapark.org: 2' },
            {
              name: 'Covers',
              value: 'found-page 1 · found-series-page 0 · missing 0',
            },
            {
              name: 'New series to confirm',
              value: 'added 1 · added-edited 0 · merged 0 · dismissed 2',
            },
            {
              name: 'New series to confirm per site',
              value: 'manhwareads.com: 3 (added 1 · dismissed 2)',
            },
            {
              name: 'Errors',
              value: 'service-worker TypeError 0badc0de: 1',
            },
          ],
          footer: { text: 'Scan Tracker 1.2.1 · Chrome 141' },
        },
      ],
      allowed_mentions: { parse: [] },
    });
  });

  it('should post an error report with its name, hash and place only', async () => {
    const requests = useWebhookAnswering(new Response(null, { status: 204 }));

    await new DiscordTelemetry(INSTALL).send({
      kind: 'error-report',
      day: '2026-10-22',
      event: {
        kind: 'unhandled-error',
        context: 'popup',
        errorName: 'TypeError',
        messageHash: '0badc0de',
        stackTop: 'main.js:1:4242',
      },
    });

    expect(requests[0]?.body).toEqual({
      embeds: [
        {
          title: 'Unhandled error · popup',
          color: 0xdc2626,
          fields: [
            { name: 'Error', value: 'TypeError', inline: true },
            { name: 'Message hash', value: '0badc0de', inline: true },
            { name: 'Where', value: 'main.js:1:4242', inline: true },
            { name: 'Day', value: '2026-10-22', inline: true },
          ],
          footer: { text: 'Scan Tracker 1.2.1 · Chrome 141' },
        },
      ],
      allowed_mentions: { parse: [] },
    });
  });

  it('should keep the largest digest within the Discord embed limits', async () => {
    const requests = useWebhookAnswering(new Response(null, { status: 204 }));
    const longHost = (index: number) =>
      `${String(index).padStart(2, '0')}${'a'.repeat(60)}.${'b'.repeat(60)}.${'c'.repeat(60)}.${'d'.repeat(60)}.com`;
    const outcomes = ['new', 'up-to-date', 'unsupported', 'failing'].map(
      (key) => ({ key, count: 99999 }),
    );

    await new DiscordTelemetry(INSTALL).send({
      kind: 'daily-digest',
      digest: {
        ...DIGEST,
        httpStatuses: Array.from({ length: 10 }, (_, index) => ({
          key: String(400 + index),
          count: 99999,
        })),
        topCheckedHosts: Array.from({ length: 10 }, (_, index) => ({
          host: longHost(index),
          total: 399996,
          outcomes,
        })),
        topParseMissHosts: Array.from({ length: 10 }, (_, index) => ({
          key: longHost(index),
          count: 99999,
        })),
        topErrors: Array.from({ length: 10 }, (_, index) => ({
          key: `service-worker ${'E'.repeat(40)} ${String(index).padStart(8, '0')}`,
          count: 99999,
        })),
      },
    });

    const embed = requests[0].body.embeds[0];
    expect(embed.fields.length).toBeLessThanOrEqual(25);
    expect(embed.title.length).toBeLessThanOrEqual(256);
    expect(embed.footer.text.length).toBeLessThanOrEqual(2048);
    expect(
      Math.max(...embed.fields.map(({ value }) => value.length)),
    ).toBeLessThanOrEqual(1024);
    expect(
      embed.title.length +
        embed.footer.text.length +
        embed.fields.reduce(
          (sum, { name, value }) => sum + name.length + value.length,
          0,
        ),
    ).toBeLessThanOrEqual(6000);
    expect(embed.fields[4]?.value.split('\n').length).toBeGreaterThan(1);
  });

  it('should answer the delay Discord asks for when it rate limits', async () => {
    useWebhookAnswering(
      new Response(JSON.stringify({ retry_after: 2.5, global: false }), {
        status: 429,
      }),
    );

    const result = await new DiscordTelemetry(INSTALL).send(ERROR_REPORT);

    expect(result).toEqual({ kind: 'rate-limited', retryAfterMs: 2500 });
  });

  it('should read the delay from the Retry-After header when the body has none', async () => {
    useWebhookAnswering(
      new Response('slow down', {
        status: 429,
        headers: { 'Retry-After': '7' },
      }),
    );

    const result = await new DiscordTelemetry(INSTALL).send(ERROR_REPORT);

    expect(result).toEqual({ kind: 'rate-limited', retryAfterMs: 7000 });
  });

  it('should answer failed when the webhook answers an error', async () => {
    useWebhookAnswering(new Response(null, { status: 404 }));

    const result = await new DiscordTelemetry(INSTALL).send(ERROR_REPORT);

    expect(result).toEqual({ kind: 'failed' });
  });

  it('should answer failed without rejecting when the request cannot be made', async () => {
    useWebhookFailing(new TypeError('Failed to fetch'));
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await new DiscordTelemetry(INSTALL).send(ERROR_REPORT);

    expect(result).toEqual({ kind: 'failed' });
    errors.mockRestore();
  });

  it('should send nothing while the browser is offline', async () => {
    const requests = useWebhookAnswering(new Response(null, { status: 204 }));
    Object.defineProperty(globalThis.navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    const result = await new DiscordTelemetry(INSTALL).send(ERROR_REPORT);

    expect(result).toEqual({ kind: 'offline' });
    expect(requests).toEqual([]);
    Reflect.deleteProperty(globalThis.navigator, 'onLine');
  });
});

const INSTALL = { extensionVersion: '1.2.1', browser: 'Chrome 141' };

const ERROR_REPORT: TelemetryReport = {
  kind: 'error-report',
  day: '2026-10-22',
  event: { kind: 'storage-error', context: 'service-worker', failure: 'io' },
};

const DIGEST: DailyDigest = {
  day: '2026-10-22',
  events: [
    { key: 'unhandled-error', count: 1 },
    { key: 'storage-error', count: 0 },
    { key: 'parse-miss', count: 2 },
    { key: 'chapter-check', count: 3 },
    { key: 'cover-search', count: 1 },
    { key: 'proposal-send-failed', count: 0 },
    { key: 'pending-series', count: 3 },
  ],
  checkOutcomes: [
    { key: 'new', count: 1 },
    { key: 'up-to-date', count: 1 },
    { key: 'unsupported', count: 0 },
    { key: 'failing', count: 1 },
  ],
  strategies: [
    { key: 'feed', count: 1 },
    { key: 'series-page', count: 1 },
    { key: 'next-chapter-url', count: 0 },
  ],
  httpStatuses: [{ key: '503', count: 1 }],
  topCheckedHosts: [
    {
      host: 'asuracomic.net',
      total: 2,
      outcomes: [
        { key: 'new', count: 1 },
        { key: 'up-to-date', count: 0 },
        { key: 'unsupported', count: 0 },
        { key: 'failing', count: 1 },
      ],
    },
    {
      host: 'toonily.com',
      total: 1,
      outcomes: [
        { key: 'new', count: 0 },
        { key: 'up-to-date', count: 1 },
        { key: 'unsupported', count: 0 },
        { key: 'failing', count: 0 },
      ],
    },
  ],
  topParseMissHosts: [{ key: 'mangapark.org', count: 2 }],
  covers: [
    { key: 'found-page', count: 1 },
    { key: 'found-series-page', count: 0 },
    { key: 'missing', count: 0 },
  ],
  pendingSeriesOutcomes: [
    { key: 'added', count: 1 },
    { key: 'added-edited', count: 0 },
    { key: 'merged', count: 0 },
    { key: 'dismissed', count: 2 },
  ],
  topPendingSeriesHosts: [
    {
      host: 'manhwareads.com',
      total: 3,
      outcomes: [
        { key: 'added', count: 1 },
        { key: 'added-edited', count: 0 },
        { key: 'merged', count: 0 },
        { key: 'dismissed', count: 2 },
      ],
    },
  ],
  topErrors: [{ key: 'service-worker TypeError 0badc0de', count: 1 }],
};

type SentBody = {
  embeds: {
    title: string;
    footer: { text: string };
    fields: { name: string; value: string }[];
  }[];
};

const useWebhookAnswering = (response: Response) => {
  const requests: { url: unknown; init: RequestInit; body: SentBody }[] = [];
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: async (url: unknown, init: RequestInit) => {
      requests.push({ url, init, body: JSON.parse(String(init.body)) });
      return response;
    },
  });
  return requests;
};

const useWebhookFailing = (error: Error) => {
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: async () => {
      throw error;
    },
  });
};

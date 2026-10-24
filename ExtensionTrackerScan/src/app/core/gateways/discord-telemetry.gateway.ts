import {
  Count,
  DailyDigest,
  ErrorEvent,
  SendResult,
  TelemetryReport,
} from '../domain/telemetry';
import { TelemetryPort } from '../ports/telemetry.port';
import { CRASH_REPORT_WEBHOOK_URL } from './discord-webhooks';

export type InstallInfo = {
  readonly extensionVersion: string;
  readonly browser: string;
};

type EmbedField = {
  readonly name: string;
  readonly value: string;
  readonly inline?: boolean;
};

type Embed = {
  readonly title: string;
  readonly color: number;
  readonly fields: readonly EmbedField[];
  readonly footer: { readonly text: string };
};

type DiscordMessage = {
  readonly embeds: readonly [Embed];
  readonly allowed_mentions: { readonly parse: readonly [] };
};

const DIGEST_COLOR = 0x3b82f6;

const ERROR_COLOR = 0xdc2626;

const LIST_FIELD_LENGTH = 900;

const DEFAULT_RETRY_AFTER_MS = 60000;

const MAX_RETRY_AFTER_MS = 24 * 60 * 60 * 1000;

const currentInstall = (): InstallInfo => ({
  extensionVersion: chrome.runtime.getManifest().version,
  browser: `Chrome ${navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] ?? '?'}`,
});

const inline = (counts: readonly Count[]): string =>
  counts.map(({ key, count }) => `${key} ${count}`).join(' · ') || 'none';

const lines = (texts: readonly string[]): string => {
  const kept: string[] = [];
  for (const text of texts) {
    if ([...kept, text].join('\n').length > LIST_FIELD_LENGTH) {
      break;
    }
    kept.push(text);
  }
  return kept.join('\n') || 'none';
};

const digestFields = (digest: DailyDigest): EmbedField[] => [
  { name: 'Events', value: inline(digest.events) },
  { name: 'Chapter checks', value: inline(digest.checkOutcomes) },
  { name: 'Strategies that answered', value: inline(digest.strategies) },
  { name: 'HTTP status of failing checks', value: inline(digest.httpStatuses) },
  {
    name: 'Most checked sites',
    value: lines(
      digest.topCheckedHosts.map(
        ({ host, total, outcomes }) =>
          `${host}: ${total} (${inline(outcomes.filter(({ count }) => count > 0))})`,
      ),
    ),
  },
  {
    name: 'Unreadable pages per site',
    value: lines(
      digest.topParseMissHosts.map(({ key, count }) => `${key}: ${count}`),
    ),
  },
  { name: 'Covers', value: inline(digest.covers) },
  {
    name: 'New series to confirm',
    value: inline(digest.pendingSeriesOutcomes),
  },
  {
    name: 'New series to confirm per site',
    value: lines(
      digest.topPendingSeriesHosts.map(
        ({ host, total, outcomes }) =>
          `${host}: ${total} (${inline(outcomes.filter(({ count }) => count > 0))})`,
      ),
    ),
  },
  {
    name: 'Errors',
    value: lines(digest.topErrors.map(({ key, count }) => `${key}: ${count}`)),
  },
];

const errorTitle = (event: ErrorEvent): string =>
  event.kind === 'storage-error'
    ? `Storage error · ${event.context}`
    : `Unhandled error · ${event.context}`;

const errorFields = (event: ErrorEvent, day: string): EmbedField[] =>
  event.kind === 'storage-error'
    ? [
        { name: 'Failure', value: event.failure, inline: true },
        { name: 'Day', value: day, inline: true },
      ]
    : [
        { name: 'Error', value: event.errorName, inline: true },
        { name: 'Message hash', value: event.messageHash, inline: true },
        { name: 'Where', value: event.stackTop ?? 'unknown', inline: true },
        { name: 'Day', value: day, inline: true },
      ];

const discordMessageOf = (
  report: TelemetryReport,
  install: InstallInfo,
): DiscordMessage => {
  const footer = {
    text: `Scan Tracker ${install.extensionVersion} · ${install.browser}`,
  };
  const embed: Embed =
    report.kind === 'daily-digest'
      ? {
          title: `Daily digest · ${report.digest.day}`,
          color: DIGEST_COLOR,
          fields: digestFields(report.digest),
          footer,
        }
      : {
          title: errorTitle(report.event),
          color: ERROR_COLOR,
          fields: errorFields(report.event, report.day),
          footer,
        };
  return { embeds: [embed], allowed_mentions: { parse: [] } };
};

const retryAfterOf = async (response: Response): Promise<number> => {
  const body: unknown = await response.json().catch(() => undefined);
  const seconds =
    typeof body === 'object' &&
    body !== null &&
    'retry_after' in body &&
    typeof body.retry_after === 'number'
      ? body.retry_after
      : Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds > 0
    ? Math.min(Math.ceil(seconds * 1000), MAX_RETRY_AFTER_MS)
    : DEFAULT_RETRY_AFTER_MS;
};

export class DiscordTelemetry implements TelemetryPort {
  constructor(private readonly install: InstallInfo = currentInstall()) {}

  async send(report: TelemetryReport): Promise<SendResult> {
    if (navigator.onLine === false) {
      return { kind: 'offline' };
    }
    try {
      const response = await fetch(CRASH_REPORT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordMessageOf(report, this.install)),
      });
      if (response.status === 429) {
        return {
          kind: 'rate-limited',
          retryAfterMs: await retryAfterOf(response),
        };
      }
      return response.ok ? { kind: 'sent' } : { kind: 'failed' };
    } catch (error) {
      console.error('Error while sending telemetry to discord:', error);
      return { kind: 'failed' };
    }
  }
}

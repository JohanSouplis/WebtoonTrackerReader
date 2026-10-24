import {
  HostTrustSnapshot,
  PendingSeriesSnapshot,
  SeriesSuggestions,
  SuggestionSource,
} from '../domain/series-suggestions';
import { SeriesSuggestionsRepository } from '../ports/series-suggestions-repository.port';

const SERIES_SUGGESTIONS_KEY = 'series-suggestions';

const SOURCES: readonly SuggestionSource[] = ['page', 'history'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const recordsOf = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const dateOf = (value: unknown): Date | undefined => {
  const date = new Date(typeof value === 'string' ? value : NaN);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const countOf = (value: unknown): number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 0;

const toPending = (
  stored: Record<string, unknown>,
): PendingSeriesSnapshot[] => {
  const { title, chapter, url, host, seriesUrl } = stored;
  const seenAt = dateOf(stored['seenAt']);
  const source = SOURCES.find((known) => known === stored['source']);
  return typeof title === 'string' &&
    title !== '' &&
    typeof chapter === 'number' &&
    Number.isFinite(chapter) &&
    typeof url === 'string' &&
    typeof host === 'string' &&
    seenAt &&
    source
    ? [
        {
          title,
          chapter,
          url,
          host,
          seenAt,
          source,
          ...(typeof seriesUrl === 'string' ? { seriesUrl } : {}),
        },
      ]
    : [];
};

const toHostTrust = (stored: Record<string, unknown>): HostTrustSnapshot[] => {
  const { host, dismissedTitles } = stored;
  return typeof host === 'string'
    ? [
        {
          host,
          confirmedInARow: countOf(stored['confirmedInARow']),
          dismissedInARow: countOf(stored['dismissedInARow']),
          dismissedTitles: Array.isArray(dismissedTitles)
            ? dismissedTitles.filter(
                (title): title is string => typeof title === 'string',
              )
            : [],
        },
      ]
    : [];
};

export class ChromeStorageSeriesSuggestionsRepository implements SeriesSuggestionsRepository {
  async load(): Promise<SeriesSuggestions> {
    const { [SERIES_SUGGESTIONS_KEY]: stored } = await chrome.storage.local.get(
      [SERIES_SUGGESTIONS_KEY],
    );
    const suggestions = isRecord(stored) ? stored : {};
    return SeriesSuggestions.restore({
      pending: recordsOf(suggestions['pending']).flatMap(toPending),
      hosts: recordsOf(suggestions['hosts']).flatMap(toHostTrust),
    });
  }

  async save(suggestions: SeriesSuggestions): Promise<void> {
    const { pending, hosts } = suggestions.snapshot();
    await chrome.storage.local.set({
      [SERIES_SUGGESTIONS_KEY]: {
        pending: pending.map((series) => ({
          ...series,
          seenAt: series.seenAt.toISOString(),
        })),
        hosts,
      },
    });
  }
}

import { Chapter } from './chapter';
import { Reading } from './reading';
import { ScanLibrary } from './scan-library';
import { ScanTitle } from './scan-title';
import { SeriesKey } from './series-key';
import { siteOf } from './site';

export const SUGGESTION_LIMITS = {
  confirmationsToTrust: 2,
  dismissalsToIgnore: 2,
  pendingPerHost: 10,
  pendingInTotal: 30,
  dismissedTitlesPerHost: 20,
} as const;

export type SuggestionSource = 'page' | 'history';

export type PendingSeriesSnapshot = {
  readonly title: string;
  readonly chapter: number;
  readonly url: string;
  readonly host: string;
  readonly seenAt: Date;
  readonly source: SuggestionSource;
  readonly seriesUrl?: string;
};

export type HostTrustSnapshot = {
  readonly host: string;
  readonly confirmedInARow: number;
  readonly dismissedInARow: number;
  readonly dismissedTitles: readonly string[];
};

export type SeriesSuggestionsSnapshot = {
  readonly pending: readonly PendingSeriesSnapshot[];
  readonly hosts: readonly HostTrustSnapshot[];
};

export type HostStanding = 'learning' | 'trusted' | 'ignored';

export type PendingSeriesRef = {
  readonly title: ScanTitle;
  readonly host: string;
};

export type SeriesConfirmation =
  | { readonly kind: 'as-detected' }
  | { readonly kind: 'renamed'; readonly title: ScanTitle }
  | { readonly kind: 'merged'; readonly into: ScanTitle };

export class PendingSeriesNotFound extends Error {
  constructor({ title, host }: PendingSeriesRef) {
    super(`No series titled ${title.value} waits on ${host}`);
  }
}

type PendingSeries = {
  reading: Reading;
  readonly host: string;
  readonly source: SuggestionSource;
};

type HostTrust = {
  readonly host: string;
  readonly confirmedInARow: number;
  readonly dismissedInARow: number;
  readonly dismissedTitles: readonly SeriesKey[];
};

const hostOf = (reading: Reading): string => siteOf(reading.url) ?? reading.url;

const isSameSeries = (a: ScanTitle, b: ScanTitle): boolean =>
  a.seriesKey.match(b.seriesKey) === 'same';

const pendingOf = (snapshot: PendingSeriesSnapshot): PendingSeries => ({
  reading: {
    title: ScanTitle.of(snapshot.title),
    chapter: Chapter.of(snapshot.chapter),
    url: snapshot.url,
    readAt: snapshot.seenAt,
    seriesUrl: snapshot.seriesUrl,
  },
  host: snapshot.host,
  source: snapshot.source,
});

const pendingSnapshotOf = ({
  reading,
  host,
  source,
}: PendingSeries): PendingSeriesSnapshot => ({
  title: reading.title.value,
  chapter: reading.chapter.value,
  url: reading.url,
  host,
  seenAt: reading.readAt,
  source,
  seriesUrl: reading.seriesUrl,
});

const hostTrustOf = (snapshot: HostTrustSnapshot): HostTrust => ({
  ...snapshot,
  dismissedTitles: snapshot.dismissedTitles.map(SeriesKey.of),
});

const hostTrustSnapshotOf = (trust: HostTrust): HostTrustSnapshot => ({
  ...trust,
  dismissedTitles: trust.dismissedTitles.map((key) => key.value),
});

const newHostTrust = (host: string): HostTrust => ({
  host,
  confirmedInARow: 0,
  dismissedInARow: 0,
  dismissedTitles: [],
});

const standingFrom = (trust: HostTrust | undefined): HostStanding => {
  if (!trust) {
    return 'learning';
  }
  if (trust.confirmedInARow >= SUGGESTION_LIMITS.confirmationsToTrust) {
    return 'trusted';
  }
  return trust.dismissedInARow >= SUGGESTION_LIMITS.dismissalsToIgnore
    ? 'ignored'
    : 'learning';
};

const newestFirst = (a: PendingSeries, b: PendingSeries): number =>
  b.reading.readAt.getTime() - a.reading.readAt.getTime();

const withinLimits = (pending: readonly PendingSeries[]): PendingSeries[] => {
  const perHost = new Map<string, number>();
  return [...pending]
    .sort(newestFirst)
    .filter(({ host }) => {
      const count = (perHost.get(host) ?? 0) + 1;
      perHost.set(host, count);
      return count <= SUGGESTION_LIMITS.pendingPerHost;
    })
    .slice(0, SUGGESTION_LIMITS.pendingInTotal);
};

export class SeriesSuggestions {
  private constructor(
    private pending: PendingSeries[],
    private readonly hosts: Map<string, HostTrust>,
  ) {}

  static restore(snapshot: SeriesSuggestionsSnapshot): SeriesSuggestions {
    return new SeriesSuggestions(
      snapshot.pending.map(pendingOf),
      new Map(snapshot.hosts.map((trust) => [trust.host, hostTrustOf(trust)])),
    );
  }

  standingOf(url: string): HostStanding {
    return standingFrom(this.hosts.get(siteOf(url) ?? url));
  }

  suggest(reading: Reading, source: SuggestionSource): void {
    const host = hostOf(reading);
    const trust = this.hosts.get(host);
    if (
      standingFrom(trust) === 'ignored' ||
      trust?.dismissedTitles.some((key) => key.equals(reading.title.seriesKey))
    ) {
      return;
    }
    const known = this.pending.find(
      (pending) =>
        pending.host === host &&
        isSameSeries(pending.reading.title, reading.title),
    );
    if (!known) {
      this.pending = withinLimits([...this.pending, { reading, host, source }]);
      return;
    }
    if (known.reading.readAt <= reading.readAt) {
      known.reading = { ...reading, title: known.reading.title };
    }
  }

  confirm(
    ref: PendingSeriesRef,
    confirmation: SeriesConfirmation,
    library: ScanLibrary,
  ): void {
    const confirmed = this.get(ref);
    const title = titleOf(confirmed.reading.title, confirmation);
    const sameSeries = this.pending.filter((pending) =>
      isSameSeries(pending.reading.title, confirmed.reading.title),
    );
    for (const pending of sameSeries) {
      library.recordReadingAs(pending.reading, title);
    }
    this.pending = this.pending.filter(
      (pending) => !sameSeries.includes(pending),
    );
    this.settle(library);
    this.learn(ref.host, (trust) =>
      title.equals(confirmed.reading.title)
        ? {
            ...trust,
            confirmedInARow: trust.confirmedInARow + 1,
            dismissedInARow: 0,
          }
        : { ...trust, confirmedInARow: 0, dismissedInARow: 0 },
    );
  }

  confirmAllFrom(host: string, library: ScanLibrary): void {
    const refs = this.pending
      .filter((pending) => pending.host === host)
      .sort((a, b) => -newestFirst(a, b))
      .map(({ reading }) => ({ title: reading.title, host }));
    for (const ref of refs) {
      if (this.find(ref)) {
        this.confirm(ref, { kind: 'as-detected' }, library);
      }
    }
  }

  dismiss(ref: PendingSeriesRef): void {
    const dismissed = this.get(ref);
    this.pending = this.pending.filter((pending) => pending !== dismissed);
    this.learn(ref.host, (trust) => ({
      ...trust,
      confirmedInARow: 0,
      dismissedInARow: trust.dismissedInARow + 1,
      dismissedTitles: [
        dismissed.reading.title.seriesKey,
        ...trust.dismissedTitles,
      ].slice(0, SUGGESTION_LIMITS.dismissedTitlesPerHost),
    }));
  }

  stopIgnoring(host: string): void {
    this.learn(host, (trust) => ({ ...trust, dismissedInARow: 0 }));
  }

  ignoredHosts(): string[] {
    return [...this.hosts.values()]
      .filter((trust) => standingFrom(trust) === 'ignored')
      .map(({ host }) => host)
      .sort();
  }

  snapshot(): SeriesSuggestionsSnapshot {
    return {
      pending: this.pending.map(pendingSnapshotOf),
      hosts: [...this.hosts.values()].map(hostTrustSnapshotOf),
    };
  }

  private settle(library: ScanLibrary): void {
    const tracked = this.pending.filter(({ reading }) =>
      library.trackedTitleOf(reading.title),
    );
    for (const { reading } of tracked) {
      library.recordReading(reading);
    }
    this.pending = this.pending.filter((pending) => !tracked.includes(pending));
  }

  private learn(host: string, lesson: (trust: HostTrust) => HostTrust): void {
    this.hosts.set(host, lesson(this.hosts.get(host) ?? newHostTrust(host)));
  }

  private find({ title, host }: PendingSeriesRef): PendingSeries | undefined {
    return this.pending.find(
      (pending) => pending.host === host && pending.reading.title.equals(title),
    );
  }

  private get(ref: PendingSeriesRef): PendingSeries {
    const pending = this.find(ref);
    if (!pending) {
      throw new PendingSeriesNotFound(ref);
    }
    return pending;
  }
}

const titleOf = (
  detected: ScanTitle,
  confirmation: SeriesConfirmation,
): ScanTitle => {
  switch (confirmation.kind) {
    case 'as-detected':
      return detected;
    case 'renamed':
      return confirmation.title;
    case 'merged':
      return confirmation.into;
  }
};

export const EMPTY_SERIES_SUGGESTIONS: SeriesSuggestionsSnapshot = {
  pending: [],
  hosts: [],
};

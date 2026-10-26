import { Chapter } from './chapter';
import { Rating } from './rating';
import { Reading, ReadingOrigin } from './reading';
import { ScanTitle } from './scan-title';
import { SeriesKey } from './series-key';
import { siteOf } from './site';

export type ScanSnapshot = {
  readonly title: string;
  readonly chapter: number;
  readonly url: string;
  readonly readAt: Date;
  readonly origin: ReadingOrigin;
  readonly isFavorite: boolean;
  readonly rating?: number;
  readonly seriesUrl?: string;
  readonly aliases?: readonly string[];
};

export class ScanNotFound extends Error {
  constructor(title: ScanTitle) {
    super(`No scan is titled ${title.value}`);
  }
}

export class SeriesAlreadyTracked extends Error {
  constructor(readonly trackedTitle: ScanTitle) {
    super(`The series is already tracked as ${trackedTitle.value}`);
  }
}

export class MergeIntoItself extends Error {
  constructor(title: ScanTitle) {
    super(`${title.value} cannot be merged into itself`);
  }
}

const seriesUrlOnSameSite = (
  previous: Reading,
  next: Reading,
): string | undefined =>
  previous.seriesUrl && siteOf(previous.seriesUrl) === siteOf(next.url)
    ? previous.seriesUrl
    : undefined;

type TrackedScan = {
  reading: Reading;
  aliases: readonly ScanTitle[];
  isFavorite: boolean;
  rating?: Rating;
};

const titlesOf = (scan: TrackedScan): readonly ScanTitle[] => [
  scan.reading.title,
  ...scan.aliases,
];

const isTitleOf = (scan: TrackedScan, key: SeriesKey): boolean =>
  titlesOf(scan).some((title) => title.seriesKey.equals(key));

const aliasesOf = (
  title: ScanTitle,
  titles: readonly ScanTitle[],
): ScanTitle[] =>
  titles.reduce<ScanTitle[]>(
    (aliases, alias) =>
      [title, ...aliases].some((known) =>
        known.seriesKey.equals(alias.seriesKey),
      )
        ? aliases
        : [...aliases, alias],
    [],
  );

const advance = (scan: TrackedScan, reading: Reading): void => {
  if (scan.reading.readAt > reading.readAt) {
    return;
  }
  scan.reading = {
    ...reading,
    title: scan.reading.title,
    seriesUrl: reading.seriesUrl ?? seriesUrlOnSameSite(scan.reading, reading),
  };
};

const trackedScanOf = (snapshot: ScanSnapshot): TrackedScan => {
  const title = ScanTitle.of(snapshot.title);
  return {
    reading: {
      title,
      chapter: Chapter.of(snapshot.chapter),
      url: snapshot.url,
      readAt: snapshot.readAt,
      origin: snapshot.origin,
      seriesUrl: snapshot.seriesUrl,
    },
    aliases: aliasesOf(title, (snapshot.aliases ?? []).map(ScanTitle.of)),
    isFavorite: snapshot.isFavorite,
    rating:
      snapshot.rating === undefined ? undefined : Rating.of(snapshot.rating),
  };
};

const snapshotOf = ({
  reading,
  aliases,
  isFavorite,
  rating,
}: TrackedScan): ScanSnapshot => ({
  title: reading.title.value,
  chapter: reading.chapter.value,
  url: reading.url,
  readAt: reading.readAt,
  origin: reading.origin,
  isFavorite,
  rating: rating?.value,
  seriesUrl: reading.seriesUrl,
  aliases:
    aliases.length === 0 ? undefined : aliases.map((alias) => alias.value),
});

export class ScanLibrary {
  private constructor(private scans: TrackedScan[]) {}

  static restore(snapshots: readonly ScanSnapshot[]): ScanLibrary {
    const library = new ScanLibrary([]);
    for (const snapshot of snapshots) {
      library.reinstate(snapshot);
    }
    return library;
  }

  recordReading(reading: Reading): void {
    const scan = this.findSeries(reading.title.seriesKey);
    if (!scan) {
      this.scans.push({ reading, aliases: [], isFavorite: false });
      return;
    }
    advance(scan, reading);
  }

  recordReadingAs(reading: Reading, title: ScanTitle): void {
    const scan = this.findSeries(title.seriesKey);
    const owner = this.scans.find((tracked) =>
      isTitleOf(tracked, reading.title.seriesKey),
    );
    const aliases = owner && owner !== scan ? [] : [reading.title];
    if (!scan) {
      this.scans.push({
        reading: { ...reading, title },
        aliases: aliasesOf(title, aliases),
        isFavorite: false,
      });
      return;
    }
    scan.aliases = aliasesOf(scan.reading.title, [...scan.aliases, ...aliases]);
    advance(scan, reading);
  }

  reinstate(snapshot: ScanSnapshot): void {
    const scan = trackedScanOf(snapshot);
    const twin = this.scans.find((tracked) =>
      titlesOf(scan).some((title) => isTitleOf(tracked, title.seriesKey)),
    );
    if (!twin) {
      this.scans.push(scan);
      return;
    }
    const [latest, earliest] =
      scan.reading.readAt > twin.reading.readAt ? [scan, twin] : [twin, scan];
    twin.aliases = aliasesOf(latest.reading.title, [
      ...titlesOf(twin),
      ...titlesOf(scan),
    ]);
    twin.reading = latest.reading;
    twin.isFavorite = twin.isFavorite || scan.isFavorite;
    twin.rating = latest.rating ?? earliest.rating;
  }

  rename(title: ScanTitle, newTitle: ScanTitle): void {
    const scan = this.get(title);
    const tracked = this.findSeries(newTitle.seriesKey);
    if (tracked && tracked !== scan) {
      throw new SeriesAlreadyTracked(tracked.reading.title);
    }
    scan.aliases = aliasesOf(newTitle, [...scan.aliases, scan.reading.title]);
    scan.reading = { ...scan.reading, title: newTitle };
  }

  merge(source: ScanTitle, target: ScanTitle): void {
    const from = this.get(source);
    const into = this.get(target);
    if (from === into) {
      throw new MergeIntoItself(target);
    }
    const latest = from.reading.readAt > into.reading.readAt ? from : into;
    into.aliases = aliasesOf(into.reading.title, [
      ...into.aliases,
      ...titlesOf(from),
    ]);
    into.reading = { ...latest.reading, title: into.reading.title };
    into.isFavorite = into.isFavorite || from.isFavorite;
    into.rating = into.rating ?? from.rating;
    this.scans = this.scans.filter((scan) => scan !== from);
  }

  unmerge(target: ScanSnapshot, source: ScanSnapshot): void {
    const index = this.scans.findIndex((scan) =>
      scan.reading.title.equals(ScanTitle.of(target.title)),
    );
    if (index === -1) {
      this.reinstate(target);
    } else {
      this.scans[index] = trackedScanOf(target);
    }
    this.reinstate(source);
  }

  remove(title: ScanTitle): void {
    const remaining = this.scans.filter(
      (scan) => !scan.reading.title.equals(title),
    );
    if (remaining.length === this.scans.length) {
      throw new ScanNotFound(title);
    }
    this.scans = remaining;
  }

  toggleFavorite(title: ScanTitle): void {
    const scan = this.get(title);
    scan.isFavorite = !scan.isFavorite;
  }

  rate(title: ScanTitle, rating: Rating): void {
    this.get(title).rating = rating;
  }

  clearRating(title: ScanTitle): void {
    this.get(title).rating = undefined;
  }

  trackedTitleOf(title: ScanTitle): ScanTitle | undefined {
    return this.findSeries(title.seriesKey)?.reading.title;
  }

  snapshotOf(title: ScanTitle): ScanSnapshot {
    return snapshotOf(this.get(title));
  }

  snapshot(): ScanSnapshot[] {
    return this.scans.map(snapshotOf);
  }

  private findSeries(key: SeriesKey): TrackedScan | undefined {
    return (
      this.scans.find((scan) => isTitleOf(scan, key)) ??
      this.scans.find((scan) =>
        titlesOf(scan).some((title) => title.seriesKey.match(key) === 'same'),
      )
    );
  }

  private find(title: ScanTitle): TrackedScan | undefined {
    return this.scans.find((scan) => scan.reading.title.equals(title));
  }

  private get(title: ScanTitle): TrackedScan {
    const scan = this.find(title);
    if (!scan) {
      throw new ScanNotFound(title);
    }
    return scan;
  }
}

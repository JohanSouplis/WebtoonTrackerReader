import { Chapter } from './chapter';
import { Rating } from './rating';
import { Reading } from './reading';
import { ScanTitle } from './scan-title';
import { SeriesKey } from './series-key';
import { siteOf } from './site';

export type ScanSnapshot = {
  readonly title: string;
  readonly chapter: number;
  readonly url: string;
  readonly readAt: Date;
  readonly isFavorite: boolean;
  readonly rating?: number;
  readonly seriesUrl?: string;
};

export class ScanNotFound extends Error {
  constructor(title: ScanTitle) {
    super(`No scan is titled ${title.value}`);
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
  isFavorite: boolean;
  rating?: Rating;
};

const trackedScanOf = (snapshot: ScanSnapshot): TrackedScan => ({
  reading: {
    title: ScanTitle.of(snapshot.title),
    chapter: Chapter.of(snapshot.chapter),
    url: snapshot.url,
    readAt: snapshot.readAt,
    seriesUrl: snapshot.seriesUrl,
  },
  isFavorite: snapshot.isFavorite,
  rating:
    snapshot.rating === undefined ? undefined : Rating.of(snapshot.rating),
});

const snapshotOf = ({
  reading,
  isFavorite,
  rating,
}: TrackedScan): ScanSnapshot => ({
  title: reading.title.value,
  chapter: reading.chapter.value,
  url: reading.url,
  readAt: reading.readAt,
  isFavorite,
  rating: rating?.value,
  seriesUrl: reading.seriesUrl,
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
      this.scans.push({ reading, isFavorite: false });
      return;
    }
    if (scan.reading.readAt > reading.readAt) {
      return;
    }
    scan.reading = {
      ...reading,
      title: scan.reading.title,
      seriesUrl:
        reading.seriesUrl ?? seriesUrlOnSameSite(scan.reading, reading),
    };
  }

  reinstate(snapshot: ScanSnapshot): void {
    const scan = trackedScanOf(snapshot);
    const twin = this.findSeriesKey(scan.reading.title.seriesKey);
    if (!twin) {
      this.scans.push(scan);
      return;
    }
    const [latest, earliest] =
      scan.reading.readAt > twin.reading.readAt ? [scan, twin] : [twin, scan];
    twin.reading = latest.reading;
    twin.isFavorite = twin.isFavorite || scan.isFavorite;
    twin.rating = latest.rating ?? earliest.rating;
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

  trackedTitleOf(title: ScanTitle): ScanTitle | undefined {
    return this.findSeries(title.seriesKey)?.reading.title;
  }

  snapshotOf(title: ScanTitle): ScanSnapshot {
    return snapshotOf(this.get(title));
  }

  snapshot(): ScanSnapshot[] {
    return this.scans.map(snapshotOf);
  }

  private findSeriesKey(key: SeriesKey): TrackedScan | undefined {
    return this.scans.find((scan) => scan.reading.title.seriesKey.equals(key));
  }

  private findSeries(key: SeriesKey): TrackedScan | undefined {
    return (
      this.findSeriesKey(key) ??
      this.scans.find(
        (scan) => scan.reading.title.seriesKey.match(key) === 'same',
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

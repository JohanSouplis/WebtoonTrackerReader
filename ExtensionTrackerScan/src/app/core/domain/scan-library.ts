import { Chapter } from './chapter';
import { Rating } from './rating';
import { Reading } from './reading';
import { ScanTitle } from './scan-title';

export type ScanSnapshot = {
  readonly title: string;
  readonly chapter: number;
  readonly url: string;
  readonly readAt: Date;
  readonly isFavorite: boolean;
  readonly rating?: number;
};

export class ScanNotFound extends Error {
  constructor(title: ScanTitle) {
    super(`No scan is titled ${title.value}`);
  }
}

type TrackedScan = {
  reading: Reading;
  isFavorite: boolean;
  rating?: Rating;
};

export class ScanLibrary {
  private constructor(private scans: TrackedScan[]) {}

  static restore(snapshots: readonly ScanSnapshot[]): ScanLibrary {
    return new ScanLibrary(
      snapshots.map((snapshot) => ({
        reading: {
          title: ScanTitle.of(snapshot.title),
          chapter: Chapter.of(snapshot.chapter),
          url: snapshot.url,
          readAt: snapshot.readAt,
        },
        isFavorite: snapshot.isFavorite,
        rating:
          snapshot.rating === undefined
            ? undefined
            : Rating.of(snapshot.rating),
      })),
    );
  }

  recordReading(reading: Reading): void {
    const scan = this.find(reading.title);
    if (!scan) {
      this.scans.push({ reading, isFavorite: false });
      return;
    }
    if (scan.reading.readAt > reading.readAt) {
      return;
    }
    scan.reading = reading;
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

  snapshot(): ScanSnapshot[] {
    return this.scans.map(({ reading, isFavorite, rating }) => ({
      title: reading.title.value,
      chapter: reading.chapter.value,
      url: reading.url,
      readAt: reading.readAt,
      isFavorite,
      rating: rating?.value,
    }));
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

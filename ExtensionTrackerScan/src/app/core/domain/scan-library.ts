import { Chapter } from './chapter';
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

type TrackedScan = {
  reading: Reading;
  readonly isFavorite: boolean;
  readonly rating?: number;
};

export class ScanLibrary {
  private constructor(private readonly scans: TrackedScan[]) {}

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
        rating: snapshot.rating,
      })),
    );
  }

  recordReading(reading: Reading): void {
    const scan = this.scans.find((candidate) =>
      candidate.reading.title.equals(reading.title),
    );
    if (!scan) {
      this.scans.push({ reading, isFavorite: false });
      return;
    }
    if (scan.reading.readAt > reading.readAt) {
      return;
    }
    scan.reading = reading;
  }

  snapshot(): ScanSnapshot[] {
    return this.scans.map(({ reading, isFavorite, rating }) => ({
      title: reading.title.value,
      chapter: reading.chapter.value,
      url: reading.url,
      readAt: reading.readAt,
      isFavorite,
      rating,
    }));
  }
}

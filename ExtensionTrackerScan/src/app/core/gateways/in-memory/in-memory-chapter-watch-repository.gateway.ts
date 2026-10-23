import { ChapterWatch, ChapterWatches } from '../../domain/chapter-watch';
import { ScanTitle } from '../../domain/scan-title';
import { ChapterWatchRepository } from '../../ports/chapter-watch-repository.port';

export class InMemoryChapterWatchRepository implements ChapterWatchRepository {
  private readonly watches: Map<string, ChapterWatch>;

  constructor(watches: Readonly<Record<string, ChapterWatch>> = {}) {
    this.watches = new Map(
      Object.entries(watches).map(([title, watch]) => [
        ScanTitle.of(title).seriesKey.value,
        watch,
      ]),
    );
  }

  async find(titles: readonly ScanTitle[]): Promise<ChapterWatches> {
    return new Map(
      titles.flatMap((title) => {
        const watch = this.watches.get(title.seriesKey.value);
        return watch ? [[title.value, watch]] : [];
      }),
    );
  }

  async save(title: ScanTitle, watch: ChapterWatch): Promise<void> {
    this.watches.set(title.seriesKey.value, watch);
  }

  async move(from: ScanTitle, to: ScanTitle): Promise<void> {
    const watch = this.watches.get(from.seriesKey.value);
    if (watch) {
      this.watches.delete(from.seriesKey.value);
      this.watches.set(to.seriesKey.value, watch);
    }
  }

  async remove(title: ScanTitle): Promise<void> {
    this.watches.delete(title.seriesKey.value);
  }
}

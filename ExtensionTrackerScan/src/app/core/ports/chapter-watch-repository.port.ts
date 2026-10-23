import { ChapterWatch, ChapterWatches } from '../domain/chapter-watch';
import { ScanTitle } from '../domain/scan-title';

export interface ChapterWatchRepository {
  find(titles: readonly ScanTitle[]): Promise<ChapterWatches>;
  save(title: ScanTitle, watch: ChapterWatch): Promise<void>;
  remove(title: ScanTitle): Promise<void>;
}

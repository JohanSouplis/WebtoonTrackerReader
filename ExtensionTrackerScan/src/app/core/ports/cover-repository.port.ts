import { Cover, Covers } from '../domain/cover';
import { ScanTitle } from '../domain/scan-title';

export interface CoverRepository {
  find(titles: readonly ScanTitle[]): Promise<Covers>;
  update(
    title: ScanTitle,
    change: (stored: Cover | undefined) => Cover,
  ): Promise<void>;
  remove(title: ScanTitle): Promise<void>;
}

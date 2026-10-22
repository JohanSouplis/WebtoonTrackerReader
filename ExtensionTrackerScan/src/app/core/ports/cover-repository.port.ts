import { Cover, Covers } from '../domain/cover';
import { ScanTitle } from '../domain/scan-title';

export interface CoverRepository {
  find(titles: readonly ScanTitle[]): Promise<Covers>;
  save(title: ScanTitle, cover: Cover): Promise<void>;
}

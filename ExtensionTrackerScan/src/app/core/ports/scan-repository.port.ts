import { ScanLibrary } from '../domain/scan-library';

export interface ScanRepository {
  load(): Promise<ScanLibrary>;
  save(library: ScanLibrary): Promise<void>;
}

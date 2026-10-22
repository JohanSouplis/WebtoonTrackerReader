import { ScanLibrary, ScanSnapshot } from '../../domain/scan-library';
import { ScanRepository } from '../../ports/scan-repository.port';

export class InMemoryScanRepository implements ScanRepository {
  constructor(private snapshots: ScanSnapshot[] = []) {}

  async load(): Promise<ScanLibrary> {
    return ScanLibrary.restore(this.snapshots);
  }

  async save(library: ScanLibrary): Promise<void> {
    this.snapshots = library.snapshot();
  }
}

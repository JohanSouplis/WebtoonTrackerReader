import { ScanLibrary } from '../domain/scan-library';
import { ScanRepository } from '../ports/scan-repository.port';

export class ConsoleScanRepository implements ScanRepository {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly savedMessage: string,
  ) {}

  load(): Promise<ScanLibrary> {
    return this.scanRepository.load();
  }

  async save(library: ScanLibrary): Promise<void> {
    await this.scanRepository.save(library);
    console.log(this.savedMessage);
  }
}

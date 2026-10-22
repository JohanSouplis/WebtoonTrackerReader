import { ScanSnapshot } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { ScanRepository } from '../ports/scan-repository.port';

export class DeleteScanUseCase {
  constructor(private readonly scanRepository: ScanRepository) {}

  async execute(title: ScanTitle): Promise<ScanSnapshot[]> {
    const library = await this.scanRepository.load();
    library.remove(title);
    await this.scanRepository.save(library);
    return library.snapshot();
  }
}

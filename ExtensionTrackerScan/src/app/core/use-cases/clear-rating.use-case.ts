import { ScanSnapshot } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { ScanRepository } from '../ports/scan-repository.port';

export class ClearRatingUseCase {
  constructor(private readonly scanRepository: ScanRepository) {}

  async execute(title: ScanTitle): Promise<ScanSnapshot[]> {
    const library = await this.scanRepository.load();
    library.clearRating(title);
    await this.scanRepository.save(library);
    return library.snapshot();
  }
}

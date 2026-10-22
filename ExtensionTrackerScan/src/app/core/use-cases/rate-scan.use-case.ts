import { Rating } from '../domain/rating';
import { ScanSnapshot } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { ScanRepository } from '../ports/scan-repository.port';

export class RateScanUseCase {
  constructor(private readonly scanRepository: ScanRepository) {}

  async execute(title: ScanTitle, rating: Rating): Promise<ScanSnapshot[]> {
    const library = await this.scanRepository.load();
    library.rate(title, rating);
    await this.scanRepository.save(library);
    return library.snapshot();
  }
}

import { ScanSnapshot } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { ChapterWatchRepository } from '../ports/chapter-watch-repository.port';
import { CoverRepository } from '../ports/cover-repository.port';
import { ScanRepository } from '../ports/scan-repository.port';

export class RenameScanUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly coverRepository: CoverRepository,
    private readonly watchRepository: ChapterWatchRepository,
  ) {}

  async execute(
    title: ScanTitle,
    newTitle: ScanTitle,
  ): Promise<ScanSnapshot[]> {
    const library = await this.scanRepository.load();
    library.rename(title, newTitle);
    await this.scanRepository.save(library);
    await this.coverRepository.move(title, newTitle);
    await this.watchRepository.move(title, newTitle);
    return library.snapshot();
  }
}

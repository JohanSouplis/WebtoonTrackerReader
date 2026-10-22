import { settleCover } from '../domain/cover';
import { planCoverBackfill } from '../domain/cover-search';
import { ScanTitle } from '../domain/scan-title';
import { ClockPort } from '../ports/clock.port';
import { CoverImagePort } from '../ports/cover-image.port';
import { CoverRepository } from '../ports/cover-repository.port';
import { PageReaderPort } from '../ports/page-reader.port';
import { ScanRepository } from '../ports/scan-repository.port';

export class BackfillCoversUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly coverRepository: CoverRepository,
    private readonly pageReader: PageReaderPort,
    private readonly coverImages: CoverImagePort,
    private readonly clock: ClockPort,
  ) {}

  async execute(titles: readonly ScanTitle[]): Promise<void> {
    const now = this.clock.now();
    const library = await this.scanRepository.load();
    const covers = await this.coverRepository.find(titles);
    const lanes = planCoverBackfill(library.snapshot(), titles, covers, now);
    await Promise.all(
      lanes.map(async (searches) => {
        for (const search of searches) {
          let step = search.nextStep();
          while (step.kind !== 'done') {
            if (step.kind === 'download') {
              search.recordImage(
                await this.coverImages.download(step.candidate),
              );
            } else {
              search.recordPage(await this.pageReader.read(step.url));
            }
            step = search.nextStep();
          }
          await this.coverRepository.update(
            search.title,
            settleCover(step.cover),
          );
        }
      }),
    );
  }
}

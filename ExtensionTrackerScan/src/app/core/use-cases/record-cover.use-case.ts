import { isCoverDue, settleCover } from '../domain/cover';
import { CoverSearch } from '../domain/cover-search';
import { parsePage } from '../domain/page-title-parser';
import { PageSignals } from '../domain/parsed-page';
import { coverSearchEvent } from '../domain/telemetry';
import { ClockPort } from '../ports/clock.port';
import { CoverImagePort } from '../ports/cover-image.port';
import { CoverRepository } from '../ports/cover-repository.port';
import { PageReaderPort } from '../ports/page-reader.port';
import { ScanRepository } from '../ports/scan-repository.port';
import { TelemetryRecorderPort } from '../ports/telemetry-recorder.port';

export class RecordCoverUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly coverRepository: CoverRepository,
    private readonly pageReader: PageReaderPort,
    private readonly coverImages: CoverImagePort,
    private readonly clock: ClockPort,
    private readonly telemetry: TelemetryRecorderPort,
  ) {}

  async execute(page: PageSignals): Promise<void> {
    const now = this.clock.now();
    const parsedPage = parsePage(page, now);
    if (parsedPage.kind !== 'reading') {
      return;
    }
    const library = await this.scanRepository.load();
    const title = library.trackedTitleOf(parsedPage.reading.title);
    if (!title) {
      return;
    }
    const covers = await this.coverRepository.find([title]);
    if (!isCoverDue(covers.get(title.value), now)) {
      return;
    }
    const search = CoverSearch.onReadPage(page, parsedPage.reading.title, now);
    let step = search.nextStep();
    while (step.kind !== 'done') {
      if (step.kind === 'download') {
        search.recordImage(await this.coverImages.download(step.candidate));
      } else {
        search.recordPage(await this.pageReader.read(step.url));
      }
      step = search.nextStep();
    }
    await this.coverRepository.update(title, settleCover(step.cover));
    this.telemetry.record(coverSearchEvent(step.cover));
  }
}

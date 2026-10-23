import { newChaptersOf } from '../domain/chapter-watch';
import { ScanTitle } from '../domain/scan-title';
import { ChapterWatchRepository } from '../ports/chapter-watch-repository.port';
import { NewChapterAlertsPort } from '../ports/new-chapter-alerts.port';
import { ScanRepository } from '../ports/scan-repository.port';

export class ShowNewChapterCountUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly watchRepository: ChapterWatchRepository,
    private readonly alerts: NewChapterAlertsPort,
  ) {}

  async execute(): Promise<void> {
    const scans = (await this.scanRepository.load()).snapshot();
    const watches = await this.watchRepository.find(
      scans.map(({ title }) => ScanTitle.of(title)),
    );
    await this.alerts.showCount(newChaptersOf(scans, watches).length);
  }
}

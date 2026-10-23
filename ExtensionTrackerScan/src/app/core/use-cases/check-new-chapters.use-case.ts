import {
  hostAfter,
  NewChapter,
  newChaptersOf,
  newlyFoundChapter,
  planChapterChecks,
  REQUEST_SPACING,
  startCheck,
  watchAfter,
} from '../domain/chapter-watch';
import { FetchedPage } from '../domain/fetched-page';
import { ScanTitle } from '../domain/scan-title';
import { siteOf } from '../domain/site';
import { chapterCheckEvent } from '../domain/telemetry';
import { ChapterWatchRepository } from '../ports/chapter-watch-repository.port';
import { ClockPort } from '../ports/clock.port';
import { HostProfileRepository } from '../ports/host-profile-repository.port';
import { NewChapterAlertsPort } from '../ports/new-chapter-alerts.port';
import { ScanRepository } from '../ports/scan-repository.port';
import { TelemetryRecorderPort } from '../ports/telemetry-recorder.port';
import { TimerPort } from '../ports/timer.port';
import { WatchSettingsRepository } from '../ports/watch-settings-repository.port';
import { WebPagePort } from '../ports/web-page.port';

export class CheckNewChaptersUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly watchRepository: ChapterWatchRepository,
    private readonly hostRepository: HostProfileRepository,
    private readonly settingsRepository: WatchSettingsRepository,
    private readonly web: WebPagePort,
    private readonly timer: TimerPort,
    private readonly alerts: NewChapterAlertsPort,
    private readonly clock: ClockPort,
    private readonly telemetry: TelemetryRecorderPort,
  ) {}

  async execute(): Promise<void> {
    const settings = await this.settingsRepository.load();
    const scans = (await this.scanRepository.load()).snapshot();
    const watches = new Map(
      await this.watchRepository.find(
        scans.map(({ title }) => ScanTitle.of(title)),
      ),
    );
    const hosts = new Map(
      await this.hostRepository.find(
        scans.flatMap(({ url }) => siteOf(url) ?? []),
      ),
    );
    const now = this.clock.now();
    const lanes = planChapterChecks(scans, watches, hosts, settings, now);
    const found = await Promise.all(
      lanes.map(async (lane) => {
        const newChapters: NewChapter[] = [];
        let hasFetched = false;
        for (const planned of lane) {
          const { scan, previous } = planned;
          const check = startCheck(planned, hosts.get(scan.site), now);
          let step = check.nextStep();
          let lastPage: FetchedPage | undefined;
          while (step.kind === 'fetch') {
            if (hasFetched) {
              await this.timer.waitAround(REQUEST_SPACING);
            }
            hasFetched = true;
            lastPage = await this.web.fetchPage(step.url);
            check.recordPage(lastPage);
            step = check.nextStep();
          }
          const checkedAt = this.clock.now();
          const watch = watchAfter(
            previous,
            scan,
            step.outcome,
            settings,
            checkedAt,
          );
          const hostChange = hostAfter(step.outcome, step.lessons, checkedAt);
          await this.watchRepository.save(scan.title, watch);
          await this.hostRepository.update(scan.site, hostChange);
          this.telemetry.record(
            chapterCheckEvent(scan.site, step.outcome, watch, lastPage),
          );
          watches.set(scan.title.value, watch);
          hosts.set(scan.site, hostChange(hosts.get(scan.site)));
          const newChapter = newlyFoundChapter(previous, watch, scan);
          if (newChapter) {
            newChapters.push(newChapter);
          }
          if (step.outcome.kind === 'blocked') {
            break;
          }
        }
        return newChapters;
      }),
    );
    if (found.flat().length > 0) {
      await this.alerts.announce(found.flat());
    }
    await this.alerts.showCount(newChaptersOf(scans, watches).length);
  }
}

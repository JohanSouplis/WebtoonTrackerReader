import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  OnInit,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CheckFrequency } from '../../../../../../core/domain/chapter-watch';
import { RatePromptAnswer } from '../../../../../../core/domain/rate-prompt';
import { Rating } from '../../../../../../core/domain/rating';
import {
  ScanNotFound,
  ScanSnapshot,
  SeriesAlreadyTracked,
} from '../../../../../../core/domain/scan-library';
import { MergedScans } from '../../../../../../core/domain/scan-merge';
import { ScanTitle } from '../../../../../../core/domain/scan-title';
import {
  PendingSeriesNotFound,
  PendingSeriesRef,
  SeriesConfirmation,
} from '../../../../../../core/domain/series-suggestions';
import { AnswerRatePromptUseCase } from '../../../../../../core/use-cases/answer-rate-prompt.use-case';
import { AskForRatingUseCase } from '../../../../../../core/use-cases/ask-for-rating.use-case';
import { ChangeCheckIntervalUseCase } from '../../../../../../core/use-cases/change-check-interval.use-case';
import { ClearRatingUseCase } from '../../../../../../core/use-cases/clear-rating.use-case';
import { ConfirmPendingSeriesUseCase } from '../../../../../../core/use-cases/confirm-pending-series.use-case';
import { ConfirmSiteSeriesUseCase } from '../../../../../../core/use-cases/confirm-site-series.use-case';
import {
  DeleteScanUseCase,
  RemovedScan,
} from '../../../../../../core/use-cases/delete-scan.use-case';
import { DismissPendingSeriesUseCase } from '../../../../../../core/use-cases/dismiss-pending-series.use-case';
import { MergeScansUseCase } from '../../../../../../core/use-cases/merge-scans.use-case';
import { RateScanUseCase } from '../../../../../../core/use-cases/rate-scan.use-case';
import { RecordNewChapterOpenedUseCase } from '../../../../../../core/use-cases/record-new-chapter-opened.use-case';
import { RenameScanUseCase } from '../../../../../../core/use-cases/rename-scan.use-case';
import { RestoreScanUseCase } from '../../../../../../core/use-cases/restore-scan.use-case';
import { StopIgnoringSiteUseCase } from '../../../../../../core/use-cases/stop-ignoring-site.use-case';
import { ToggleFavoriteUseCase } from '../../../../../../core/use-cases/toggle-favorite.use-case';
import { UnmergeScansUseCase } from '../../../../../../core/use-cases/unmerge-scans.use-case';
import {
  CHAPTER_WATCH_REPOSITORY,
  CLOCK,
  COVER_BACKFILL,
  COVER_REPOSITORY,
  NOTIFICATION_PERMISSION,
  SCAN_REPOSITORY,
  SERIES_SUGGESTIONS_REPOSITORY,
  STORE_LISTING,
  WATCH_SETTINGS_REPOSITORY,
} from '../../../../../injection-tokens';
import { PendingSeriesCard } from '../../../service/pending-series.vm';
import { ScanRow } from '../../../service/scan-row.vm';
import {
  MERGE_PICKER_HEADING_ID,
  MergePickerComponent,
} from '../../organisms/merge-picker/merge-picker.component';
import { NewChapterSettingsComponent } from '../../organisms/new-chapter-settings/new-chapter-settings.component';
import { PendingSeriesComponent } from '../../organisms/pending-series/pending-series.component';
import { PendingSeriesRename } from '../../organisms/pending-series/pending-series.types';
import { RatePromptComponent } from '../../organisms/rate-prompt/rate-prompt.component';
import { ScanFiltersComponent } from '../../organisms/scan-filters/scan-filters.component';
import { ScanRowsComponent } from '../../organisms/scan-rows/scan-rows.component';
import {
  ScanRating,
  ScanRename,
} from '../../organisms/scan-rows/scan-rows.types';
import { ScanSortBarComponent } from '../../organisms/scan-sort-bar/scan-sort-bar.component';
import { ScanListStore } from './scan-list.store';

const UNDO_DURATION_MS = 6000;

const pendingRefOf = ({
  title,
  host,
}: PendingSeriesCard): PendingSeriesRef => ({
  title: ScanTitle.of(title),
  host,
});

const FEEDBACK_DURATION_MS = 3000;

const REFUSED_ALERTS_DURATION_MS = 12000;

@Component({
  selector: 'app-scan-list',
  imports: [
    MergePickerComponent,
    NewChapterSettingsComponent,
    PendingSeriesComponent,
    RatePromptComponent,
    ScanFiltersComponent,
    ScanSortBarComponent,
    ScanRowsComponent,
  ],
  templateUrl: './scan-list.page.html',
  styleUrl: './scan-list.page.css',
  providers: [ScanListStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanListPage implements OnInit {
  private readonly scanRepository = inject(SCAN_REPOSITORY);
  private readonly coverRepository = inject(COVER_REPOSITORY);
  private readonly coverBackfill = inject(COVER_BACKFILL);
  private readonly watchRepository = inject(CHAPTER_WATCH_REPOSITORY);
  private readonly suggestionsRepository = inject(
    SERIES_SUGGESTIONS_REPOSITORY,
  );
  private readonly confirmPendingSeries = inject(ConfirmPendingSeriesUseCase);
  private readonly confirmSiteSeries = inject(ConfirmSiteSeriesUseCase);
  private readonly dismissPendingSeries = inject(DismissPendingSeriesUseCase);
  private readonly stopIgnoringSite = inject(StopIgnoringSiteUseCase);
  private readonly settingsRepository = inject(WATCH_SETTINGS_REPOSITORY);
  private readonly notificationPermission = inject(NOTIFICATION_PERMISSION);
  private readonly changeCheckInterval = inject(ChangeCheckIntervalUseCase);
  private readonly deleteScan = inject(DeleteScanUseCase);
  private readonly restoreScan = inject(RestoreScanUseCase);
  private readonly renameScan = inject(RenameScanUseCase);
  private readonly mergeScans = inject(MergeScansUseCase);
  private readonly unmergeScans = inject(UnmergeScansUseCase);
  private readonly toggleFavoriteScan = inject(ToggleFavoriteUseCase);
  private readonly rateScan = inject(RateScanUseCase);
  private readonly clearScanRating = inject(ClearRatingUseCase);
  private readonly askForRating = inject(AskForRatingUseCase);
  private readonly answerRatePromptUseCase = inject(AnswerRatePromptUseCase);
  private readonly recordNewChapterOpenedUseCase = inject(
    RecordNewChapterOpenedUseCase,
  );
  private readonly storeListing = inject(STORE_LISTING);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);
  private readonly rows = viewChild.required(ScanRowsComponent);
  private readonly pendingSeries = viewChild(PendingSeriesComponent);
  private readonly mergePicker =
    viewChild.required<TemplateRef<unknown>>('mergePicker');
  protected readonly store = inject(ScanListStore);
  protected readonly now = inject(CLOCK).now();

  constructor() {
    effect(() => {
      const titles = this.store.shownTitles();
      untracked(() => {
        this.showCovers(titles).catch((error: unknown) =>
          console.error('Error retrieving the covers:', error),
        );
      });
    });
  }

  ngOnInit(): void {
    void this.loadLibrary();
    this.showPending().catch((error: unknown) =>
      console.error('Error retrieving the new series to confirm:', error),
    );
    this.showSettings().catch((error: unknown) =>
      console.error('Error retrieving the new chapter settings:', error),
    );
    this.askForRating
      .execute()
      .then((request) => this.store.showRatingRequest(request))
      .catch((error: unknown) =>
        console.error('Error asking for a rating:', error),
      );
  }

  protected async answerRatePrompt(answer: RatePromptAnswer): Promise<void> {
    this.store.closeRatePrompt();
    this.rows().focus();
    await this.answerRatePromptUseCase.execute(answer);
    if (answer === 'rate') {
      this.storeListing.openReviews();
    }
  }

  protected recordNewChapterOpened(): void {
    void this.recordNewChapterOpenedUseCase.execute();
  }

  protected async chooseInterval(checkEvery: CheckFrequency): Promise<void> {
    this.store.showSettings(await this.changeCheckInterval.execute(checkEvery));
  }

  protected async toggleNotifications(isWanted: boolean): Promise<void> {
    if (isWanted) {
      const isGranted = await this.notificationPermission.request();
      this.store.showSettings({ areNotificationsOn: isGranted });
      if (!isGranted) {
        this.snackBar.open(
          "Chrome didn't allow notifications, so alerts stay off. Turn them on again and choose Allow. If Chrome doesn't ask, allow notifications for Chrome in your system settings.",
          'Dismiss',
          { duration: REFUSED_ALERTS_DURATION_MS },
        );
      }
      return;
    }
    await this.notificationPermission.remove();
    this.store.showSettings({ areNotificationsOn: false });
  }

  protected delete(scan: ScanRow): Promise<void> {
    this.store.hide(scan.title);
    return this.update(async () => {
      const { library, removed } = await this.deleteScan.execute(
        ScanTitle.of(scan.title),
      );
      this.offerUndo(removed);
      return library;
    });
  }

  protected toggleFavorite(scan: ScanRow): Promise<void> {
    return this.update(async () => {
      const library = await this.toggleFavoriteScan.execute(
        ScanTitle.of(scan.title),
      );
      this.snackBar.open(
        scan.isFavorite
          ? `Stopped checking “${scan.title}” for new chapters.`
          : `Following “${scan.title}”. We'll check for new chapters.`,
        undefined,
        { duration: FEEDBACK_DURATION_MS },
      );
      return library;
    });
  }

  protected rate({ scan, rating }: ScanRating): Promise<void> {
    return this.update(() =>
      this.rateScan.execute(ScanTitle.of(scan.title), Rating.of(rating)),
    );
  }

  protected clearRating(scan: ScanRow): Promise<void> {
    return this.update(() =>
      this.clearScanRating.execute(ScanTitle.of(scan.title)),
    );
  }

  protected async rename({ scan, title }: ScanRename): Promise<void> {
    try {
      this.store.showLibrary(
        await this.renameScan.execute(
          ScanTitle.of(scan.title),
          ScanTitle.of(title),
        ),
      );
    } catch (error: unknown) {
      if (!(error instanceof SeriesAlreadyTracked)) {
        await this.showFailure(error);
        return;
      }
      this.offerMergeInto(scan.title, error.trackedTitle.value);
      this.rows().focusTitle(scan.title);
      return;
    }
    this.snackBar.open(`Renamed to “${title}”`, undefined, {
      duration: FEEDBACK_DURATION_MS,
    });
    this.focusTitleOnceShown(title);
    await this.showWatches();
  }

  protected async openMergePicker(scan: ScanRow): Promise<void> {
    const target = await this.pickMergeTarget(scan.title);
    if (target === undefined) {
      this.rows().focusTitle(scan.title);
      return;
    }
    await this.merge(scan.title, target);
  }

  protected addSeries(card: PendingSeriesCard): Promise<void> {
    return this.confirm(
      card,
      { kind: 'as-detected' },
      `Added “${card.title}” to your library`,
    );
  }

  protected addSeriesAs({ card, title }: PendingSeriesRename): Promise<void> {
    return this.confirm(
      card,
      { kind: 'renamed', title: ScanTitle.of(title) },
      `Added “${title}” to your library`,
    );
  }

  protected async mergeSeries(card: PendingSeriesCard): Promise<void> {
    const target = await this.pickMergeTarget(card.title);
    if (target === undefined) {
      this.pendingSeries()?.focusCard(card);
      return;
    }
    await this.confirm(
      card,
      { kind: 'merged', into: ScanTitle.of(target) },
      `Merged into “${target}”`,
    );
  }

  protected async addSiteSeries(host: string): Promise<void> {
    const count =
      this.store.pendingGroups().find((group) => group.host === host)?.cards
        .length ?? 0;
    try {
      const { library, pending } = await this.confirmSiteSeries.execute(host);
      this.store.showLibrary(library);
      this.store.showPending(pending);
    } catch (error: unknown) {
      await this.showPendingFailure(error);
      return;
    }
    this.snackBar.open(`Added ${count} series from ${host}`, undefined, {
      duration: FEEDBACK_DURATION_MS,
    });
    this.focusLibraryWhenNoSeriesWaits();
  }

  protected async dismissSeries(card: PendingSeriesCard): Promise<void> {
    try {
      const { pending, isSiteIgnored } =
        await this.dismissPendingSeries.execute(pendingRefOf(card));
      this.store.showPending(pending);
      if (isSiteIgnored) {
        this.offerToKeepSuggesting(card.host);
      }
    } catch (error: unknown) {
      await this.showPendingFailure(error);
      return;
    }
    this.focusLibraryWhenNoSeriesWaits();
  }

  private async confirm(
    card: PendingSeriesCard,
    confirmation: SeriesConfirmation,
    feedback: string,
  ): Promise<void> {
    try {
      const { library, pending } = await this.confirmPendingSeries.execute(
        pendingRefOf(card),
        confirmation,
      );
      this.store.showLibrary(library);
      this.store.showPending(pending);
    } catch (error: unknown) {
      await this.showPendingFailure(error);
      return;
    }
    this.snackBar.open(feedback, undefined, {
      duration: FEEDBACK_DURATION_MS,
    });
    this.focusLibraryWhenNoSeriesWaits();
  }

  private focusLibraryWhenNoSeriesWaits(): void {
    if (!this.store.hasPendingSeries()) {
      afterNextRender(() => this.rows().focus(), { injector: this.injector });
    }
  }

  private offerToKeepSuggesting(host: string): void {
    this.snackBar
      .open(
        `Scan Tracker won't suggest new series from ${host} anymore`,
        'Keep suggesting',
        { duration: UNDO_DURATION_MS },
      )
      .onAction()
      .subscribe(() => {
        this.stopIgnoringSite
          .execute(host)
          .catch((error: unknown) =>
            console.error('Error suggesting the site again:', error),
          );
      });
  }

  private async showPendingFailure(error: unknown): Promise<void> {
    this.snackBar.open(
      error instanceof PendingSeriesNotFound
        ? 'This series no longer waits for you. The list is up to date.'
        : "Couldn't save your change. Please try again.",
      'Dismiss',
      { duration: 5000 },
    );
    await this.showPending();
    await this.loadLibrary();
  }

  private pickMergeTarget(source: string): Promise<string | undefined> {
    return new Promise((resolve) => {
      this.dialog
        .open<unknown, string, string>(this.mergePicker(), {
          data: source,
          ariaLabelledBy: MERGE_PICKER_HEADING_ID,
          restoreFocus: false,
          width: '440px',
          maxWidth: 'calc(100vw - 32px)',
        })
        .afterClosed()
        .subscribe(resolve);
    });
  }

  private async merge(source: string, target: string): Promise<void> {
    await this.update(async () => {
      const { library, merged } = await this.mergeScans.execute(
        ScanTitle.of(source),
        ScanTitle.of(target),
      );
      this.offerUnmerge(merged);
      return library;
    });
    this.focusTitleOnceShown(target);
    await this.showWatches();
  }

  private focusTitleOnceShown(title: string): void {
    afterNextRender(() => this.rows().focusTitle(title), {
      injector: this.injector,
    });
  }

  private offerMergeInto(source: string, target: string): void {
    this.snackBar
      .open(`“${target}” is already in your library`, 'Merge', {
        duration: UNDO_DURATION_MS,
      })
      .onAction()
      .subscribe(() => {
        this.merge(source, target).catch((error: unknown) =>
          console.error('Error merging the scans:', error),
        );
      });
  }

  private offerUnmerge(merged: MergedScans): void {
    this.snackBar
      .open(`Merged into “${merged.target.scan.title}”`, 'Undo', {
        duration: UNDO_DURATION_MS,
      })
      .onAction()
      .subscribe(() => {
        this.unmerge(merged).catch((error: unknown) =>
          console.error('Error undoing the merge:', error),
        );
      });
  }

  private async unmerge(merged: MergedScans): Promise<void> {
    await this.update(() => this.unmergeScans.execute(merged));
    await this.showWatches();
  }

  private offerUndo(removed: RemovedScan): void {
    this.snackBar
      .open(`Removed “${removed.scan.title}”`, 'Undo', {
        duration: UNDO_DURATION_MS,
      })
      .onAction()
      .subscribe(() => {
        this.restore(removed).catch((error: unknown) =>
          console.error('Error restoring the scan:', error),
        );
      });
  }

  private async restore(removed: RemovedScan): Promise<void> {
    await this.update(() => this.restoreScan.execute(removed));
    await this.showWatches();
  }

  private async update(command: () => Promise<ScanSnapshot[]>): Promise<void> {
    try {
      this.store.showLibrary(await command());
    } catch (error: unknown) {
      await this.showFailure(error);
    }
  }

  private async showFailure(error: unknown): Promise<void> {
    this.snackBar.open(
      error instanceof ScanNotFound
        ? 'This series is no longer in your library. The list is up to date.'
        : "Couldn't save your change. Please try again.",
      'Dismiss',
      { duration: 5000 },
    );
    await this.loadLibrary();
  }

  private async showCovers(titles: readonly string[]): Promise<void> {
    if (titles.length === 0) {
      return;
    }
    await this.showCoversOf(titles);
    const uncovered = this.store.uncoveredTitles();
    if (uncovered.length === 0) {
      return;
    }
    await this.coverBackfill.backfillCovers(uncovered, () => {
      this.showCoversOf(uncovered).catch((error: unknown) =>
        console.error('Error retrieving the covers:', error),
      );
    });
  }

  private async showCoversOf(titles: readonly string[]): Promise<void> {
    this.store.showCovers(
      titles,
      await this.coverRepository.find(titles.map(ScanTitle.of)),
    );
  }

  protected async loadLibrary(): Promise<void> {
    this.store.showLoading();
    try {
      await this.showLibrary();
    } catch (error: unknown) {
      console.error('Error retrieving the library:', error);
      this.store.showLoadFailure();
    }
  }

  private async showPending(): Promise<void> {
    this.store.showPending(
      (await this.suggestionsRepository.load()).snapshot().pending,
    );
  }

  private async showLibrary(): Promise<void> {
    this.store.showLibrary((await this.scanRepository.load()).snapshot());
    await this.showWatches();
  }

  private async showWatches(): Promise<void> {
    this.store.showWatches(
      await this.watchRepository.find(this.store.libraryTitles()),
    );
  }

  private async showSettings(): Promise<void> {
    const { checkEvery } = await this.settingsRepository.load();
    this.store.showSettings({
      checkEvery,
      areNotificationsOn: await this.notificationPermission.isGranted(),
    });
  }
}

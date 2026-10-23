import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  untracked,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CheckInterval } from '../../../../../../core/domain/chapter-watch';
import { Rating } from '../../../../../../core/domain/rating';
import {
  ScanNotFound,
  ScanSnapshot,
} from '../../../../../../core/domain/scan-library';
import { ScanTitle } from '../../../../../../core/domain/scan-title';
import { ChangeCheckIntervalUseCase } from '../../../../../../core/use-cases/change-check-interval.use-case';
import {
  DeleteScanUseCase,
  RemovedScan,
} from '../../../../../../core/use-cases/delete-scan.use-case';
import { RateScanUseCase } from '../../../../../../core/use-cases/rate-scan.use-case';
import { RestoreScanUseCase } from '../../../../../../core/use-cases/restore-scan.use-case';
import { ToggleFavoriteUseCase } from '../../../../../../core/use-cases/toggle-favorite.use-case';
import {
  CHAPTER_WATCH_REPOSITORY,
  CLOCK,
  COVER_BACKFILL,
  COVER_REPOSITORY,
  NOTIFICATION_PERMISSION,
  SCAN_REPOSITORY,
  WATCH_SETTINGS_REPOSITORY,
} from '../../../../../injection-tokens';
import { ScanRow } from '../../../service/scan-row.vm';
import { NewChapterSettingsComponent } from '../../organisms/new-chapter-settings/new-chapter-settings.component';
import { ScanFiltersComponent } from '../../organisms/scan-filters/scan-filters.component';
import { ScanRowsComponent } from '../../organisms/scan-rows/scan-rows.component';
import { ScanRating } from '../../organisms/scan-rows/scan-rows.types';
import { ScanSortBarComponent } from '../../organisms/scan-sort-bar/scan-sort-bar.component';
import { ScanListStore } from './scan-list.store';

const UNDO_DURATION_MS = 6000;

const FOLLOW_FEEDBACK_DURATION_MS = 3000;

@Component({
  selector: 'app-scan-list',
  imports: [
    NewChapterSettingsComponent,
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
  private readonly settingsRepository = inject(WATCH_SETTINGS_REPOSITORY);
  private readonly notificationPermission = inject(NOTIFICATION_PERMISSION);
  private readonly changeCheckInterval = inject(ChangeCheckIntervalUseCase);
  private readonly deleteScan = inject(DeleteScanUseCase);
  private readonly restoreScan = inject(RestoreScanUseCase);
  private readonly toggleFavoriteScan = inject(ToggleFavoriteUseCase);
  private readonly rateScan = inject(RateScanUseCase);
  private readonly snackBar = inject(MatSnackBar);
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
    this.showLibrary().catch((error: unknown) =>
      console.error('Error retrieving all data:', error),
    );
    this.showSettings().catch((error: unknown) =>
      console.error('Error retrieving the new chapter settings:', error),
    );
  }

  protected async chooseInterval(checkEvery: CheckInterval): Promise<void> {
    this.store.showSettings(await this.changeCheckInterval.execute(checkEvery));
  }

  protected async toggleNotifications(isWanted: boolean): Promise<void> {
    if (isWanted) {
      this.store.showSettings({
        areNotificationsOn: await this.notificationPermission.request(),
      });
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
        { duration: FOLLOW_FEEDBACK_DURATION_MS },
      );
      return library;
    });
  }

  protected rate({ scan, rating }: ScanRating): Promise<void> {
    return this.update(() =>
      this.rateScan.execute(ScanTitle.of(scan.title), Rating.of(rating)),
    );
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
      this.snackBar.open(
        error instanceof ScanNotFound
          ? 'This series is no longer in your library. The list is up to date.'
          : "Couldn't save your change. Please try again.",
        'Dismiss',
        { duration: 5000 },
      );
      await this.showLibrary();
    }
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

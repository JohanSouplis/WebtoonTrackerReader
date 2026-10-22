import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  untracked,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Rating } from '../../../../../../core/domain/rating';
import {
  ScanNotFound,
  ScanSnapshot,
} from '../../../../../../core/domain/scan-library';
import { ScanTitle } from '../../../../../../core/domain/scan-title';
import { DeleteScanUseCase } from '../../../../../../core/use-cases/delete-scan.use-case';
import { RateScanUseCase } from '../../../../../../core/use-cases/rate-scan.use-case';
import { ToggleFavoriteUseCase } from '../../../../../../core/use-cases/toggle-favorite.use-case';
import {
  CLOCK,
  COVER_BACKFILL,
  COVER_REPOSITORY,
  SCAN_REPOSITORY,
} from '../../../../../injection-tokens';
import { ScanRow } from '../../../service/scan-row.vm';
import { ScanFiltersComponent } from '../../organisms/scan-filters/scan-filters.component';
import { ScanRowsComponent } from '../../organisms/scan-rows/scan-rows.component';
import { ScanRating } from '../../organisms/scan-rows/scan-rows.types';
import { ScanSortBarComponent } from '../../organisms/scan-sort-bar/scan-sort-bar.component';
import { ScanListStore } from './scan-list.store';

@Component({
  selector: 'app-scan-list',
  imports: [ScanFiltersComponent, ScanSortBarComponent, ScanRowsComponent],
  templateUrl: './scan-list.page.html',
  providers: [ScanListStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanListPage implements OnInit {
  private readonly scanRepository = inject(SCAN_REPOSITORY);
  private readonly coverRepository = inject(COVER_REPOSITORY);
  private readonly coverBackfill = inject(COVER_BACKFILL);
  private readonly deleteScan = inject(DeleteScanUseCase);
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
  }

  protected delete(scan: ScanRow): Promise<void> {
    return this.update(() => this.deleteScan.execute(ScanTitle.of(scan.title)));
  }

  protected toggleFavorite(scan: ScanRow): Promise<void> {
    return this.update(() =>
      this.toggleFavoriteScan.execute(ScanTitle.of(scan.title)),
    );
  }

  protected rate({ scan, rating }: ScanRating): Promise<void> {
    return this.update(() =>
      this.rateScan.execute(ScanTitle.of(scan.title), Rating.of(rating)),
    );
  }

  private async update(command: () => Promise<ScanSnapshot[]>): Promise<void> {
    try {
      this.store.showLibrary(await command());
    } catch (error: unknown) {
      if (!(error instanceof ScanNotFound)) {
        throw error;
      }
      this.snackBar.open(
        'This scan is no longer in your library. The list is up to date.',
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
  }
}

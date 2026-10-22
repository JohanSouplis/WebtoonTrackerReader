import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Rating } from '../../../../../../core/domain/rating';
import { ScanTitle } from '../../../../../../core/domain/scan-title';
import { DeleteScanUseCase } from '../../../../../../core/use-cases/delete-scan.use-case';
import { RateScanUseCase } from '../../../../../../core/use-cases/rate-scan.use-case';
import { ToggleFavoriteUseCase } from '../../../../../../core/use-cases/toggle-favorite.use-case';
import { SCAN_REPOSITORY } from '../../../../../injection-tokens';
import { ScanRow } from '../../../service/scan-row.vm';
import { ScanFiltersComponent } from '../../organisms/scan-filters/scan-filters.component';
import { ScanTableComponent } from '../../organisms/scan-table/scan-table.component';
import { ScanRating } from '../../organisms/scan-table/scan-table.types';
import { ScanListStore } from './scan-list.store';

@Component({
  selector: 'app-scan-list',
  imports: [ScanFiltersComponent, ScanTableComponent],
  templateUrl: './scan-list.page.html',
  providers: [ScanListStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanListPage implements OnInit {
  private readonly scanRepository = inject(SCAN_REPOSITORY);
  private readonly deleteScan = inject(DeleteScanUseCase);
  private readonly toggleFavoriteScan = inject(ToggleFavoriteUseCase);
  private readonly rateScan = inject(RateScanUseCase);
  protected readonly store = inject(ScanListStore);

  ngOnInit(): void {
    this.scanRepository.load().then(
      (library) => this.store.showLibrary(library.snapshot()),
      (error: unknown) => console.error('Error retrieving all data:', error),
    );
  }

  protected async delete(scan: ScanRow): Promise<void> {
    this.store.showLibrary(
      await this.deleteScan.execute(ScanTitle.of(scan.title)),
    );
  }

  protected toggleFavorite(scan: ScanRow): void {
    this.store.toggleFavorite(scan);
    void this.toggleFavoriteScan.execute(ScanTitle.of(scan.title));
  }

  protected rate({ scan, rating }: ScanRating): void {
    this.store.rate(scan, rating);
    void this.rateScan.execute(ScanTitle.of(scan.title), Rating.of(rating));
  }

  protected open(url: string): void {
    window.open(url, '_blank');
  }
}

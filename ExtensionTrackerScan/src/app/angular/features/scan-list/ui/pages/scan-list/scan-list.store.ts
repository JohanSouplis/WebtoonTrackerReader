import { Injectable, signal } from '@angular/core';
import { ScanSnapshot } from '../../../../../../core/domain/scan-library';
import {
  filterScans,
  NO_FILTERS,
  ScanFilters,
} from '../../../service/scan-filters.rules';
import { ScanRow, toScanRow } from '../../../service/scan-row.vm';

@Injectable()
export class ScanListStore {
  private readonly library = signal<ScanRow[]>([]);
  private readonly shownScans = signal<ScanRow[]>([]);
  private readonly checkedFilters = signal<ScanFilters>(NO_FILTERS);
  private readonly searchedTitle = signal('');
  readonly scans = this.shownScans.asReadonly();
  readonly filters = this.checkedFilters.asReadonly();
  readonly titleFilter = this.searchedTitle.asReadonly();

  showLibrary(snapshots: ScanSnapshot[]): void {
    const scans = snapshots.map(toScanRow);
    this.library.set(scans);
    this.shownScans.set(scans);
    this.searchedTitle.set('');
  }

  applyFilters(filters: ScanFilters): void {
    this.checkedFilters.set(filters);
    this.shownScans.set(filterScans(this.library(), filters));
  }

  searchTitle(title: string): void {
    this.searchedTitle.set(title);
  }

  toggleFavorite(scan: ScanRow): void {
    scan.isFavorite = !scan.isFavorite;
  }

  rate(scan: ScanRow, rating: number): void {
    scan.rating = rating;
  }
}

import { computed, Injectable, signal } from '@angular/core';
import { ScanSnapshot } from '../../../../../../core/domain/scan-library';
import {
  filterScans,
  NO_FILTERS,
  ScanFilters,
} from '../../../service/scan-filters.rules';
import { ScanListView, ScanPage } from '../../../service/scan-list-view.vm';
import { ScanRow, toScanRow } from '../../../service/scan-row.vm';
import {
  LATEST_READ_FIRST,
  ScanSort,
  ScanSortKey,
  sortBy,
  sortScans,
} from '../../../service/scan-sort.rules';

const FIRST_PAGE: ScanPage = { index: 0, size: 10 };

@Injectable()
export class ScanListStore {
  private readonly library = signal<readonly ScanRow[] | undefined>(undefined);
  private readonly shownFilters = signal<ScanFilters>(NO_FILTERS);
  private readonly shownSort = signal<ScanSort>(LATEST_READ_FIRST);
  private readonly shownPage = signal<ScanPage>(FIRST_PAGE);
  private readonly matchingScans = computed(() =>
    sortScans(
      filterScans(this.library() ?? [], this.shownFilters()),
      this.shownSort(),
    ),
  );
  readonly filters = this.shownFilters.asReadonly();
  readonly sort = this.shownSort.asReadonly();
  readonly count = computed(() => this.matchingScans().length);
  readonly view = computed((): ScanListView => {
    const library = this.library();
    if (library === undefined) {
      return { kind: 'loading' };
    }
    if (library.length === 0) {
      return { kind: 'empty-library' };
    }
    const scans = this.matchingScans();
    if (scans.length === 0) {
      return {
        kind: 'no-match',
        searchedTitle: this.shownFilters().title.trim(),
      };
    }
    const { size } = this.shownPage();
    const lastIndex = Math.ceil(scans.length / size) - 1;
    const index = Math.min(this.shownPage().index, lastIndex);
    return {
      kind: 'scans',
      rows: scans.slice(index * size, (index + 1) * size),
      page: { index, size },
      length: scans.length,
    };
  });

  showLibrary(snapshots: readonly ScanSnapshot[]): void {
    this.library.set(snapshots.map(toScanRow));
  }

  filter(change: Partial<ScanFilters>): void {
    this.shownFilters.update((filters) => ({ ...filters, ...change }));
    this.backToFirstPage();
  }

  clearFilters(): void {
    this.filter(NO_FILTERS);
  }

  sortBy(key: ScanSortKey): void {
    this.shownSort.update((sort) => sortBy(sort, key));
    this.backToFirstPage();
  }

  turnPage(page: ScanPage): void {
    this.shownPage.set(page);
  }

  private backToFirstPage(): void {
    this.shownPage.update(({ size }) => ({ index: 0, size }));
  }
}

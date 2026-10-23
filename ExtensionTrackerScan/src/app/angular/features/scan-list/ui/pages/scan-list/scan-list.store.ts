import { computed, Injectable, signal } from '@angular/core';
import {
  ChapterWatches,
  watchStatusOf,
} from '../../../../../../core/domain/chapter-watch';
import { Covers } from '../../../../../../core/domain/cover';
import { RatingRequest } from '../../../../../../core/domain/rate-prompt';
import { ScanSnapshot } from '../../../../../../core/domain/scan-library';
import { ScanTitle } from '../../../../../../core/domain/scan-title';
import {
  filterScans,
  NO_FILTERS,
  ScanFilters,
} from '../../../service/scan-filters.rules';
import {
  CoverTile,
  PENDING_COVER,
  ScanListView,
  ScanPage,
  toCoverTile,
} from '../../../service/scan-list-view.vm';
import {
  DEFAULT_NEW_CHAPTER_SETTINGS,
  NewChapterSettings,
} from '../../../service/new-chapter-settings.vm';
import { ScanRow, toScanRow } from '../../../service/scan-row.vm';
import {
  LATEST_READ_FIRST,
  ScanSort,
  ScanSortKey,
  sortBy,
  sortScans,
} from '../../../service/scan-sort.rules';

const FIRST_PAGE: ScanPage = { index: 0, size: 10 };

type LibraryLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'loaded'; readonly snapshots: readonly ScanSnapshot[] };

type RowsView =
  | Exclude<ScanListView, { kind: 'scans' }>
  | {
      readonly kind: 'scans';
      readonly rows: readonly ScanRow[];
      readonly page: ScanPage;
      readonly length: number;
    };

const sameTitles = (
  titles: readonly string[],
  others: readonly string[],
): boolean =>
  titles.length === others.length &&
  titles.every((title, index) => title === others[index]);

@Injectable()
export class ScanListStore {
  private readonly load = signal<LibraryLoad>({ kind: 'loading' });
  private readonly snapshots = computed(() => {
    const load = this.load();
    return load.kind === 'loaded' ? load.snapshots : [];
  });
  private readonly watches = signal<ChapterWatches>(new Map());
  private readonly library = computed(() =>
    this.snapshots().map((snapshot) =>
      toScanRow(snapshot, watchStatusOf(snapshot, this.watches())),
    ),
  );
  private readonly shownSettings = signal<NewChapterSettings>(
    DEFAULT_NEW_CHAPTER_SETTINGS,
  );
  private readonly shownFilters = signal<ScanFilters>(NO_FILTERS);
  private readonly shownSort = signal<ScanSort>(LATEST_READ_FIRST);
  private readonly shownPage = signal<ScanPage>(FIRST_PAGE);
  private readonly covers = signal<ReadonlyMap<string, CoverTile>>(new Map());
  private readonly ratingRequest = signal<RatingRequest>('not-due');
  readonly isAskingForRating = computed(() => this.ratingRequest() === 'asked');
  private readonly matchingScans = computed(() =>
    sortScans(
      filterScans(this.library(), this.shownFilters()),
      this.shownSort(),
    ),
  );
  readonly filters = this.shownFilters.asReadonly();
  readonly sort = this.shownSort.asReadonly();
  readonly settings = this.shownSettings.asReadonly();
  readonly count = computed(() => this.matchingScans().length);
  readonly titles = computed(() => this.snapshots().map(({ title }) => title));
  readonly libraryTitles = computed(() => this.titles().map(ScanTitle.of));
  readonly hasLibraryTools = computed(
    () =>
      this.load().kind === 'loading' ||
      (this.load().kind === 'loaded' && this.snapshots().length > 0),
  );
  private readonly rowsView = computed((): RowsView => {
    const load = this.load();
    if (load.kind !== 'loaded') {
      return load;
    }
    if (load.snapshots.length === 0) {
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
  readonly view = computed((): ScanListView => {
    const view = this.rowsView();
    const covers = this.covers();
    return view.kind === 'scans'
      ? {
          ...view,
          rows: view.rows.map((row) => ({
            ...row,
            cover: covers.get(row.title) ?? PENDING_COVER,
          })),
        }
      : view;
  });
  readonly shownTitles = computed(
    () => {
      const view = this.rowsView();
      return view.kind === 'scans' ? view.rows.map(({ title }) => title) : [];
    },
    { equal: sameTitles },
  );
  readonly uncoveredTitles = computed(() => {
    const view = this.view();
    return view.kind === 'scans'
      ? view.rows
          .filter(({ cover }) => cover.kind === 'monogram')
          .map(({ title }) => title)
      : [];
  });

  showLibrary(snapshots: readonly ScanSnapshot[]): void {
    this.load.set({ kind: 'loaded', snapshots });
  }

  showLoading(): void {
    this.load.set({ kind: 'loading' });
  }

  showLoadFailure(): void {
    this.load.set({ kind: 'failed' });
  }

  hide(title: string): void {
    this.load.update((load) =>
      load.kind === 'loaded'
        ? {
            kind: 'loaded',
            snapshots: load.snapshots.filter(
              (snapshot) => snapshot.title !== title,
            ),
          }
        : load,
    );
  }

  showWatches(watches: ChapterWatches): void {
    this.watches.set(watches);
  }

  showSettings(change: Partial<NewChapterSettings>): void {
    this.shownSettings.update((settings) => ({ ...settings, ...change }));
  }

  showCovers(titles: readonly string[], covers: Covers): void {
    this.covers.update(
      (shown) =>
        new Map([
          ...shown,
          ...titles.map((title): [string, CoverTile] => [
            title,
            toCoverTile(covers.get(title)),
          ]),
        ]),
    );
  }

  showRatingRequest(request: RatingRequest): void {
    this.ratingRequest.set(request);
  }

  closeRatePrompt(): void {
    this.ratingRequest.set('not-due');
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

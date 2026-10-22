import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { StarToggleComponent } from '../../../../../design-system/atoms/star-toggle/star-toggle.component';
import { TruncatedTextComponent } from '../../../../../design-system/atoms/truncated-text/truncated-text.component';
import { ScanRow } from '../../../service/scan-row.vm';
import { ScanRating } from './scan-table.types';

const SORT_VALUES: Record<string, (scan: ScanRow) => string | number> = {
  favorite: (scan) => Number(scan.isFavorite),
  title: (scan) => scan.title,
  chapter: (scan) => scan.chapter,
  readAt: (scan) => scan.readAt.getTime(),
  rating: (scan) => scan.rating ?? -Infinity,
};

@Component({
  selector: 'app-scan-table',
  imports: [
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    StarToggleComponent,
    TruncatedTextComponent,
  ],
  templateUrl: './scan-table.component.html',
  styleUrl: './scan-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanTableComponent implements AfterViewInit {
  readonly scans = input.required<ScanRow[]>();
  readonly titleFilter = input.required<string>();
  readonly deleted = output<ScanRow>();
  readonly favoriteToggled = output<ScanRow>();
  readonly rated = output<ScanRating>();
  readonly opened = output<string>();
  protected readonly columns = [
    'delete',
    'favorite',
    'title',
    'chapter',
    'readAt',
    'rating',
  ];
  protected readonly ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  protected readonly dataSource = new MatTableDataSource<ScanRow>();
  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  constructor() {
    this.dataSource.sortingDataAccessor = (scan, column) =>
      SORT_VALUES[column](scan);
    effect(() => {
      this.dataSource.data = this.scans();
    });
    effect(() => {
      this.dataSource.filter = this.titleFilter();
    });
  }

  ngAfterViewInit(): void {
    this.sortByLatestReading();
  }

  protected delete(scan: ScanRow): void {
    this.deleted.emit(scan);
    this.sortByLatestReading();
  }

  private sortByLatestReading(): void {
    setTimeout(() => {
      this.dataSource.paginator = this.paginator();
      this.sort().active = 'readAt';
      this.sort().direction = 'desc';
      this.dataSource.sort = this.sort();
    });
  }
}

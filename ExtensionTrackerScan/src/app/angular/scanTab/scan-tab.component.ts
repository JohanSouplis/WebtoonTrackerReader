import { CommonModule, DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatCheckboxModule,
  MatCheckboxChange,
} from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Scan } from '../../core/src/domain/scan.type';
import { ChromeStorageService } from '../../gateway/chrome-storage.service';
import { InMemoryStorageService } from '../../gateway/dev/in-memory-storage.service';
import { STORAGE_TOKEN, StorageInterface } from '../port/storage.interface';

@Component({
  selector: 'scan-tab',
  imports: [
    RouterModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatInputModule,
    MatCheckboxModule,
    FormsModule,
    MatSortModule,
    CommonModule,
    MatTooltipModule,
  ],
  templateUrl: './scan-tab.component.html',
  styleUrls: ['./scan-tab.component.css'],
  providers: [
    DatePipe,
    {
      provide: STORAGE_TOKEN,
      useClass: environment.production
        ? ChromeStorageService
        : InMemoryStorageService,
    },
  ],
})
export class ScanTabComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'delete',
    'isFavorite',
    'title',
    'chapter',
    'wasRead',
    'rating',
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  scansTab: MatTableDataSource<Scan> = new MatTableDataSource<Scan>([]);

  ratingOptions = Array.from({ length: 10 }, (_, i) => i + 1);
  scans: Scan[] = [];

  checkedFavorite: boolean = false;
  checkedRating: boolean = false;

  constructor(
    @Inject(STORAGE_TOKEN)
    private storage: StorageInterface,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.storage.getScans().subscribe(
      (scanListGet) => {
        this.scans = scanListGet;
        this.setTableScan();
      },
      (error) => {
        console.error('Error retrieving all data:', error);
      }
    );
  }

  ngAfterViewInit(): void {
    this.setFilters();
  }

  private setTableScan() {
    this.scansTab = new MatTableDataSource<Scan>(this.scans);
    this.scansTab.sortingDataAccessor = (item, property) => {
      if (property === 'wasRead') {
        return new Date(item.whenWasItRead).getTime();
      }
      if (property === 'chapter') {
        return +item.chapter;
      }

      return (item as any)[property];
    };
  }

  private setFilters() {
    setTimeout(() => {
      this.scansTab.paginator = this.paginator;
      this.sort.active = 'wasRead';
      this.sort.direction = 'desc';
      this.scansTab.sort = this.sort;
    });
  }

  openInNewTab(url: string): void {
    window.open(url, '_blank');
  }

  toggleFavorite(scan: Scan): void {
    scan.isFavorite = !scan.isFavorite;
    this.storeScanUpdated(scan);
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  onRatingChange(event: MatSelectChange, scan: Scan) {
    this.storeScanUpdated(scan);
  }

  delete(scanToDelete: Scan) {
    this.storage.delete(scanToDelete);
    this.scans = this.scans.filter((scan) => scanToDelete.title !== scan.title);

    this.scansTab.data = [];
    this.scansTab = new MatTableDataSource<Scan>(this.scans);
    this.setTableScan();
    this.setFilters();
  }

  private storeScanUpdated(scan: Scan) {
    this.storage.updateScan(scan);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.scansTab.filter = filterValue.trim().toLowerCase();
  }

  toggleFavoriteFilter(event: MatCheckboxChange) {
    this.checkedFavorite = event.checked;
    this.applyCheckboxFilter();
  }

  toggleRatingFilter(event: MatCheckboxChange) {
    this.checkedRating = event.checked;
    this.applyCheckboxFilter();
  }

  private applyCheckboxFilter() {
    let scansListFiltered = this.scans;
    if (this.checkedRating) {
      scansListFiltered = scansListFiltered.filter(
        (scan) => scan.rating !== undefined
      );
    }
    if (this.checkedFavorite) {
      scansListFiltered = scansListFiltered.filter((scan) => scan.isFavorite);
    }
    this.scansTab.data = scansListFiltered;
  }

  truncateTitle(title: string): { truncated: string; isTruncated: boolean } {
    const isTruncated = title.length > 100;
    return {
      truncated: isTruncated ? title.substring(0, 100) + '...' : title,
      isTruncated: isTruncated,
    };
  }
}

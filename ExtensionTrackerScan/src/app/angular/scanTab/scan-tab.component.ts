import { CommonModule, DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Scan } from '../../core/src/domain/scan.type';
import { ChromeStorageService } from '../../gateway/chrome-storage.service';
import { InMemoryStorageService } from '../../gateway/in-memory-storage.service';

import * as storageInterface from '../port/storage.interface';

@Component({
  selector: 'scan-tab',
  imports: [
    RouterModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatInputModule,
    FormsModule,
    MatSortModule,
    CommonModule,
  ],
  templateUrl: './scan-tab.component.html',
  styleUrls: ['./scan-tab.component.css'],
  providers: [
    DatePipe,
    {
      provide: storageInterface.STORAGE_TOKEN,
      useClass: environment.production
        ? ChromeStorageService
        : InMemoryStorageService,
    },
  ],
})
export class ScanTabComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    // 'delete',
    'isFavorite',
    'title',
    'chapter',
    'wasRead',
    'rating',
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  scans: MatTableDataSource<Scan> = new MatTableDataSource<Scan>([]);

  ratingOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  constructor(
    @Inject(storageInterface.STORAGE_TOKEN)
    private storage: storageInterface.StorageInterface,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.storage.getScans().subscribe(
      (scans) => {
        this.scans = new MatTableDataSource<Scan>(scans);
        this.scans.sortingDataAccessor = (item, property) => {
          if (property === 'wasRead') {
            return new Date(item.whenWasItRead).getTime();
          }
          if (property === 'chapter') {
            return +item.chapter;
          }

          return (item as any)[property];
        };
      },
      (error) => {
        console.error('Error retrieving all data:', error);
      }
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scans.paginator = this.paginator;
      this.sort.active = 'wasRead';
      this.sort.direction = 'desc';
      this.scans.sort = this.sort;
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

  // delete(scan: Scan) {
  //   this.storage.delete(scan);
  // }

  private storeScanUpdated(scan: Scan) {
    this.storage.updateScan(scan);
  }
}

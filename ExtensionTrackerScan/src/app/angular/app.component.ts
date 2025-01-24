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
import { MatPaginator } from '@angular/material/paginator';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { environment } from '../../environments/environment';
import { Scan } from '../core/src/domain/scan.type';
import { ChromeStorageService } from '../gateway/chrome-storage.service';
import { InMemoryStorageService } from '../gateway/in-memory-storage.service';
import {
  STORAGE_INTERFACE_TOKEN,
  StorageInterface,
} from './port/storage.interface';
import { updateWithNewScan } from '../core/src/domain/update_with_new_scan';

@Component({
  selector: 'app-root',
  imports: [
    MatPaginator,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatInputModule,
    FormsModule,
    MatSortModule,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    DatePipe,
    {
      provide: STORAGE_INTERFACE_TOKEN,
      useClass: environment.production
        ? ChromeStorageService
        : InMemoryStorageService,
    },
  ],
})
export class AppComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'isFavorite',
    'title',
    'chapter',
    'wasReaded',
    'rating',
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  scans: MatTableDataSource<Scan> = new MatTableDataSource<Scan>([]);

  ratingOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  constructor(
    @Inject(STORAGE_INTERFACE_TOKEN) private storage: StorageInterface,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.storage.getScans().subscribe(
      (scans) => {
        this.scans = new MatTableDataSource<Scan>(scans);
        this.scans.sortingDataAccessor = (item, property) => {
          if (property === 'wasReaded') {
            return new Date(item.whenWasItReaded).getTime();
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
    this.scans.paginator = this.paginator;
    this.sort.active = 'wasReaded';
    this.sort.direction = 'desc';
    this.scans.sort = this.sort;
  }

  openInNewTab(url: string): void {
    window.open(url, '_blank');
  }

  formatDate(date: string | undefined): string {
    if (!date) {
      return '';
    }
    const parsedDate = new Date(date);
    return this.datePipe.transform(parsedDate, 'dd/MM/yyyy') || '';
  }

  onRatingChange(event: MatSelectChange, scan: Scan) {
    this.storage.updateScan(scan);
  }
}

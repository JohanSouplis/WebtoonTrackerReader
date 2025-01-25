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
  STORAGE_TOKEN,
  StorageInterface as Storage,
} from './port/storage.interface';
import {
  NAVIGATOR_HANDLER_TOKEN,
  NavigatorHandler,
} from './port/openFullPageInterface';
import { ChromeHandler } from '../gateway/chrome-handler.service';
import { AngularHandler } from '../gateway/angular-handler.service';

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
      provide: STORAGE_TOKEN,
      useClass: environment.production
        ? ChromeStorageService
        : InMemoryStorageService,
    },
    {
      provide: NAVIGATOR_HANDLER_TOKEN,
      useClass: environment.production ? ChromeHandler : AngularHandler,
    },
  ],
})
export class AppComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
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
    @Inject(STORAGE_TOKEN) private storage: Storage,
    @Inject(NAVIGATOR_HANDLER_TOKEN) private navigatorHandler: NavigatorHandler,
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

  private storeScanUpdated(scan: Scan) {
    this.storage.updateScan(scan);
  }
}

import { DataSource } from '@angular/cdk/table';
import { Component, Inject, OnInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Scan } from '../core/src/domain/scan.type';
import { InMemoryStorageService } from '../gateway/in-memory-storage.service';
import {
  STORAGE_INTERFACE_TOKEN,
  StorageInterface,
} from './port/storage.interface';

@Component({
  selector: 'app-root',
  imports: [MatPaginator, MatTableModule, MatSort],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    {
      provide: STORAGE_INTERFACE_TOKEN,
      useClass: InMemoryStorageService,
      // useClass: environment.production
      //   ? ChromeStorageService
      //   : InMemoryStorageService,
    },
  ],
})
export class AppComponent implements OnInit {
  displayedColumns: string[] = ['title', 'chapter', 'url'];

  scans: Scan[] = [];
  dataSource: DataSource<Scan> = new MatTableDataSource<Scan>([]);

  constructor(
    @Inject(STORAGE_INTERFACE_TOKEN) private storage: StorageInterface
  ) {}

  // @ViewChild(MatPaginator) paginator!: MatPaginator;
  // @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.storage.getScans().subscribe(
      (data) => {
        console.log('All storage data:', data);
        this.scans = data;
        this.dataSource = new MatTableDataSource<Scan>(this.scans);
        console.log(this.scans);
      },
      (error) => {
        console.error('Error retrieving all data:', error);
      }
    );
  }

  ngAfterViewInit() {
    // this.dataSource.paginator = this.paginator;
    // this.dataSource.sort = this.sort;
  }
}

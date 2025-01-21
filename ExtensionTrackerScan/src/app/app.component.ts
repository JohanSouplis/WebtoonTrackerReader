import { Component, OnInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ChromeStorageService } from './chrome-storage.service';

@Component({
  selector: 'app-root',
  // standalone: true,
  imports: [
    // RouterOutlet,
    MatPaginator,
    MatTableModule,
    MatSort,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'age'];
  dataSource = new MatTableDataSource<any>(ELEMENT_DATA);

  constructor(private chromeStorage: ChromeStorageService) {}

  // @ViewChild(MatPaginator) paginator!: MatPaginator;
  // @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.chromeStorage.getAllItems().then(
      (data) => {
        console.log('All storage data:', data);
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

const ELEMENT_DATA = [
  { id: 1, name: 'John', age: 25 },
  { id: 2, name: 'Jane', age: 30 },
  { id: 3, name: 'Doe', age: 35 },
  // Ajoutez plus de données ici
];

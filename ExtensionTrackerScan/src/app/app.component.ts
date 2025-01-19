import { Component, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table'; // MatTableDataSource est une classe, pas un composant ou module
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { RouterOutlet } from '@angular/router'; // Importation de RouterOutlet si nécessaire

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
export class AppComponent {
  displayedColumns: string[] = ['id', 'name', 'age'];
  dataSource = new MatTableDataSource<any>(ELEMENT_DATA);

  // @ViewChild(MatPaginator) paginator!: MatPaginator;
  // @ViewChild(MatSort) sort!: MatSort;

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

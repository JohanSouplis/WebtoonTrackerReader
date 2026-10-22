import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  viewChild,
} from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SearchFieldComponent } from '../../../../../design-system/molecules/search-field/search-field.component';

@Component({
  selector: 'app-supported-websites-table',
  imports: [MatTableModule, MatPaginatorModule, SearchFieldComponent],
  templateUrl: './supported-websites-table.component.html',
  styleUrl: './supported-websites-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportedWebsitesTableComponent implements AfterViewInit {
  readonly websites = input.required<string[]>();
  protected readonly columns = ['website'];
  protected readonly dataSource = new MatTableDataSource<string>();
  private readonly paginator = viewChild.required(MatPaginator);

  constructor() {
    this.dataSource.filterPredicate = (website, filter) =>
      website.toLowerCase().includes(filter);
    effect(() => {
      this.dataSource.data = this.websites();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator();
  }

  protected filter(text: string): void {
    this.dataSource.filter = text;
  }
}

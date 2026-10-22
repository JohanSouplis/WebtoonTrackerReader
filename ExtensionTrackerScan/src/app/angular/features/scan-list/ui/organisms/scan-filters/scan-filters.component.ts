import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SearchFieldComponent } from '../../../../../design-system/molecules/search-field/search-field.component';
import { ScanFilters } from '../../../service/scan-filters.rules';

@Component({
  selector: 'app-scan-filters',
  imports: [MatCheckboxModule, SearchFieldComponent],
  templateUrl: './scan-filters.component.html',
  styleUrl: './scan-filters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanFiltersComponent {
  readonly filters = input.required<ScanFilters>();
  readonly filtersChanged = output<ScanFilters>();
  readonly searched = output<string>();

  protected showFavoritesOnly(favoritesOnly: boolean): void {
    this.filtersChanged.emit({ ...this.filters(), favoritesOnly });
  }

  protected showRatedOnly(ratedOnly: boolean): void {
    this.filtersChanged.emit({ ...this.filters(), ratedOnly });
  }
}

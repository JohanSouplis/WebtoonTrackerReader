import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { SearchFieldComponent } from '../../../../../design-system/molecules/search-field/search-field.component';
import { ScanFilters } from '../../../service/scan-filters.rules';

@Component({
  selector: 'app-scan-filters',
  imports: [MatButtonToggleModule, MatIconModule, SearchFieldComponent],
  templateUrl: './scan-filters.component.html',
  styleUrl: './scan-filters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanFiltersComponent {
  readonly filters = input.required<ScanFilters>();
  readonly filtersChanged = output<ScanFilters>();

  protected change(change: Partial<ScanFilters>): void {
    this.filtersChanged.emit({ ...this.filters(), ...change });
  }
}

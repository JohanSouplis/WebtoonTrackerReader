import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  ScanSort,
  ScanSortKey,
  SortDirection,
} from '../../../service/scan-sort.rules';

const SORT_LABELS: readonly { key: ScanSortKey; label: string }[] = [
  { key: 'readAt', label: 'Last read' },
  { key: 'title', label: 'Title' },
  { key: 'chapter', label: 'Chapter' },
  { key: 'rating', label: 'Rating' },
  { key: 'favorite', label: 'Favorite' },
];

const DIRECTIONS: Record<SortDirection, { arrow: string; name: string }> = {
  asc: { arrow: 'arrow_upward', name: '(ascending)' },
  desc: { arrow: 'arrow_downward', name: '(descending)' },
};

@Component({
  selector: 'app-scan-sort-bar',
  imports: [MatIconModule],
  templateUrl: './scan-sort-bar.component.html',
  styleUrl: './scan-sort-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanSortBarComponent {
  readonly sort = input.required<ScanSort>();
  readonly count = input.required<number>();
  readonly sorted = output<ScanSortKey>();
  protected readonly options = computed(() =>
    SORT_LABELS.map(({ key, label }) => ({
      key,
      label,
      isActive: this.sort().key === key,
      ...DIRECTIONS[this.sort().direction],
    })),
  );
}

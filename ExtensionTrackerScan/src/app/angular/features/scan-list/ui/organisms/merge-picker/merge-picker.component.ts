import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { SearchFieldComponent } from '../../../../../design-system/molecules/search-field/search-field.component';

export const MERGE_PICKER_HEADING_ID = 'merge-picker-heading';

@Component({
  selector: 'app-merge-picker',
  imports: [SearchFieldComponent],
  templateUrl: './merge-picker.component.html',
  styleUrl: './merge-picker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MergePickerComponent {
  readonly source = input.required<string>();
  readonly titles = input.required<readonly string[]>();
  readonly picked = output<string>();
  readonly cancelled = output<void>();
  protected readonly headingId = MERGE_PICKER_HEADING_ID;
  protected readonly query = signal('');
  protected readonly targets = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.titles()
      .filter(
        (title) =>
          title !== this.source() && title.toLowerCase().includes(query),
      )
      .sort((title, other) => title.localeCompare(other));
  });

  protected pickFirst(submit: Event): void {
    submit.preventDefault();
    const [first] = this.targets();
    if (first !== undefined) {
      this.picked.emit(first);
    }
  }
}

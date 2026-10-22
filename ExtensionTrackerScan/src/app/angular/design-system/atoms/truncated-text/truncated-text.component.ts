import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'ds-truncated-text',
  imports: [MatTooltipModule],
  templateUrl: './truncated-text.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruncatedTextComponent {
  readonly text = input.required<string>();
  readonly maxLength = input.required<number>();
  private readonly isTruncated = computed(
    () => this.text().length > this.maxLength(),
  );
  protected readonly shownText = computed(() =>
    this.isTruncated()
      ? this.text().substring(0, this.maxLength()) + '...'
      : this.text(),
  );
  protected readonly tooltip = computed(() =>
    this.isTruncated() ? this.text() : '',
  );
}

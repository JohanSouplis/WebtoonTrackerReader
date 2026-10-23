import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

const DAY_IN_MS = 86_400_000;
const DAYS_IN_MONTH = 30.4;
const DAYS_IN_YEAR = 365;

const EXACT_DATE = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

const timeAgo = (days: number): string => {
  if (days < 1) {
    return 'today';
  }
  if (days < 31) {
    return `${days}d ago`;
  }
  if (days < DAYS_IN_YEAR) {
    return `${Math.round(days / DAYS_IN_MONTH)} mo ago`;
  }
  return `${(days / DAYS_IN_YEAR).toFixed(1).replace('.0', '')} yr ago`;
};

@Component({
  selector: 'ds-relative-date',
  imports: [MatTooltipModule],
  templateUrl: './relative-date.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelativeDateComponent {
  readonly date = input.required<Date>();
  readonly now = input.required<Date>();
  protected readonly ago = computed(() =>
    timeAgo(
      Math.round((this.now().getTime() - this.date().getTime()) / DAY_IN_MS),
    ),
  );
  protected readonly exactDate = computed(() => EXACT_DATE.format(this.date()));
  protected readonly isoDate = computed(() => this.date().toISOString());
}

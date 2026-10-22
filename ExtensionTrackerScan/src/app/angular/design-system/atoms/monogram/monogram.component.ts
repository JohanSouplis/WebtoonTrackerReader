import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

const LEADING_ARTICLE = /^(the|a)\s+/i;

@Component({
  selector: 'ds-monogram',
  templateUrl: './monogram.component.html',
  styleUrl: './monogram.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[style.--hue]': 'hue()' },
})
export class MonogramComponent {
  readonly text = input.required<string>();
  protected readonly initials = computed(() =>
    this.text()
      .replace(LEADING_ARTICLE, '')
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase(),
  );
  protected readonly hue = computed(() =>
    this.text()
      .split('')
      .reduce((hue, char) => (hue * 31 + char.charCodeAt(0)) % 360, 7),
  );
}

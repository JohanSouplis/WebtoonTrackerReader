import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'ds-star-toggle',
  templateUrl: './star-toggle.component.html',
  styleUrl: './star-toggle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarToggleComponent {
  readonly checked = input.required<boolean>();
  readonly toggled = output<void>();
  protected readonly src = computed(() =>
    this.checked() ? 'assets/fav_star.png' : 'assets/not_fav_star.png',
  );
  protected readonly alt = computed(() =>
    this.checked() ? 'Favorited' : 'Not Favorited',
  );
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'ds-search-field',
  imports: [MatIconModule],
  templateUrl: './search-field.component.html',
  styleUrl: './search-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFieldComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly searched = output<string>();
  protected readonly clearLabel = computed(() => `Clear ${this.label()}`);
}

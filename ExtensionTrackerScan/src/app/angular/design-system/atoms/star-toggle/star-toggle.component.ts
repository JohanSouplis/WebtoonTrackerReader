import {
  animate,
  keyframes,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'ds-star-toggle',
  imports: [MatIconModule],
  templateUrl: './star-toggle.component.html',
  styleUrl: './star-toggle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('pop', [
      transition(
        'false => true',
        animate(
          '250ms ease',
          keyframes([
            style({ transform: 'scale(1)', offset: 0 }),
            style({ transform: 'scale(1.35)', offset: 0.4 }),
            style({ transform: 'scale(1)', offset: 1 }),
          ]),
        ),
      ),
    ]),
  ],
})
export class StarToggleComponent {
  readonly checked = input.required<boolean>();
  readonly label = input.required<string>();
  readonly toggled = output<void>();
}

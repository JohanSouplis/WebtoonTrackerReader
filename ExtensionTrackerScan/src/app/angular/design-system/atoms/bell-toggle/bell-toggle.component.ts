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
  computed,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'ds-bell-toggle',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './bell-toggle.component.html',
  styleUrl: './bell-toggle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('ring', [
      transition(
        'false => true',
        animate(
          '320ms ease',
          keyframes([
            style({ transform: 'rotate(0)', offset: 0 }),
            style({ transform: 'rotate(-14deg)', offset: 0.3 }),
            style({ transform: 'rotate(10deg)', offset: 0.6 }),
            style({ transform: 'rotate(0)', offset: 1 }),
          ]),
        ),
      ),
    ]),
  ],
})
export class BellToggleComponent {
  readonly checked = input.required<boolean>();
  readonly label = input.required<string>();
  readonly hint = input.required<string>();
  readonly toggled = output<void>();
  protected readonly icon = computed(() =>
    this.checked() ? 'notifications_active' : 'notification_add',
  );
}

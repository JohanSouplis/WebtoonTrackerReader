import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ds-cover',
  templateUrl: './cover.component.html',
  styleUrl: './cover.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverComponent {
  readonly src = input.required<string>();
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'ds-banner',
  imports: [MatIconModule],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerComponent {
  readonly icon = input.required<string>();
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
}

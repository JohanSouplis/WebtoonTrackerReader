import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RatePromptAnswer } from '../../../../../../core/domain/rate-prompt';
import { BannerComponent } from '../../../../../design-system/molecules/banner/banner.component';

@Component({
  selector: 'app-rate-prompt',
  imports: [BannerComponent, MatButtonModule],
  templateUrl: './rate-prompt.component.html',
  styleUrl: './rate-prompt.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatePromptComponent {
  readonly answered = output<RatePromptAnswer>();
}

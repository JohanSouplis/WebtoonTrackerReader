import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  CHECK_INTERVALS,
  CheckInterval,
} from '../../../../../../core/domain/chapter-watch';
import { NewChapterSettings } from '../../../service/new-chapter-settings.vm';

const INTERVAL_NAMES: Readonly<
  Record<CheckInterval, { short: string; long: string }>
> = {
  '1h': { short: 'Every hour', long: 'Every hour' },
  '6h': { short: 'Every 6h', long: 'Every 6 hours' },
  '24h': { short: 'Daily', long: 'Once a day' },
};

@Component({
  selector: 'app-new-chapter-settings',
  imports: [MatIconModule, MatMenuModule],
  templateUrl: './new-chapter-settings.component.html',
  styleUrl: './new-chapter-settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewChapterSettingsComponent {
  readonly settings = input.required<NewChapterSettings>();
  readonly intervalChosen = output<CheckInterval>();
  readonly notificationsToggled = output<boolean>();
  protected readonly summary = computed(
    () => INTERVAL_NAMES[this.settings().checkEvery].short,
  );
  protected readonly intervals = computed(() =>
    CHECK_INTERVALS.map((interval) => ({
      interval,
      name: INTERVAL_NAMES[interval].long,
      isChosen: interval === this.settings().checkEvery,
    })),
  );
}

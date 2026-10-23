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
  CHECK_FREQUENCIES,
  CheckFrequency,
} from '../../../../../../core/domain/chapter-watch';
import { NewChapterSettings } from '../../../service/new-chapter-settings.vm';

const FREQUENCY_NAMES: Readonly<
  Record<CheckFrequency, { option: string; summary: string }>
> = {
  '1h': { option: 'Every hour', summary: 'Checks every hour' },
  '6h': { option: 'Every 6 hours', summary: 'Checks every 6 hours' },
  '24h': { option: 'Once a day', summary: 'Checks once a day' },
  off: { option: 'Off', summary: 'Checks off' },
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
  readonly intervalChosen = output<CheckFrequency>();
  readonly notificationsToggled = output<boolean>();
  protected readonly summary = computed(
    () =>
      `${FREQUENCY_NAMES[this.settings().checkEvery].summary} · Alerts ${
        this.settings().areNotificationsOn ? 'on' : 'off'
      }`,
  );
  protected readonly icon = computed(() =>
    this.settings().checkEvery === 'off'
      ? 'notifications_off'
      : 'notifications',
  );
  protected readonly frequencies = computed(() =>
    CHECK_FREQUENCIES.map((frequency) => ({
      frequency,
      name: FREQUENCY_NAMES[frequency].option,
      isChosen: frequency === this.settings().checkEvery,
    })),
  );
}

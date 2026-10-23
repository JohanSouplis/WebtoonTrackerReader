import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

const TABS = [
  { path: '', label: 'Library', icon: 'bookmarks' },
  { path: 'add_website_pattern', label: 'Add website', icon: 'add_link' },
] as const;

@Component({
  selector: 'app-nav-bar',
  imports: [MatIconModule, MatMenuModule, MatTooltipModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBarComponent {
  readonly selectedPath = input.required<string>();
  readonly navigated = output<string>();
  readonly fullPageRequested = output<void>();
  readonly reviewsRequested = output<void>();
  protected readonly tabs = computed(() =>
    TABS.map((tab) => ({
      ...tab,
      isSelected: tab.path === this.selectedPath(),
    })),
  );
}

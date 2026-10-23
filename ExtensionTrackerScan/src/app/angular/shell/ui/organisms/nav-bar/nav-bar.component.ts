import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

const TABS = [
  { path: '', label: 'Library', icon: 'bookmarks' },
  { path: 'add_website_pattern', label: 'Add website', icon: 'add_link' },
] as const;

const ABOUT_PATH = 'about';

@Component({
  selector: 'app-nav-bar',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBarComponent {
  readonly selectedPath = input.required<string>();
  readonly navigated = output<string>();
  protected readonly aboutPath = ABOUT_PATH;
  protected readonly isAboutSelected = computed(
    () => this.selectedPath() === ABOUT_PATH,
  );
  protected readonly tabs = computed(() =>
    TABS.map((tab) => ({
      ...tab,
      isSelected: tab.path === this.selectedPath(),
    })),
  );
}

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FULL_PAGE_NAVIGATOR } from '../../../../injection-tokens';
import { NavBarComponent } from '../../organisms/nav-bar/nav-bar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent],
  templateUrl: './app-shell.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellPage {
  private readonly router = inject(Router);
  private readonly fullPageNavigator = inject(FULL_PAGE_NAVIGATOR);
  protected readonly selectedPath = signal('');

  protected select(path: string): void {
    this.selectedPath.set(path);
    this.router.navigate([path]);
  }

  protected openFullPage(): void {
    this.fullPageNavigator.openFullPage();
  }
}

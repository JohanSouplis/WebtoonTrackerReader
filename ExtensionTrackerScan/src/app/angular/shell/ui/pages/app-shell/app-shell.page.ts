import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FULL_PAGE_NAVIGATOR } from '../../../../injection-tokens';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app-shell.page.html',
  styleUrl: './app-shell.page.css',
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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { FULL_PAGE_NAVIGATOR } from '../../../../injection-tokens';
import { NavBarComponent } from '../../organisms/nav-bar/nav-bar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent],
  templateUrl: './app-shell.page.html',
  styleUrl: './app-shell.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellPage {
  private readonly router = inject(Router);
  private readonly fullPageNavigator = inject(FULL_PAGE_NAVIGATOR);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly selectedPath = computed(
    () =>
      this.router.parseUrl(this.url()).root.children['primary']?.toString() ??
      '',
  );

  protected select(path: string): void {
    void this.router.navigate([path]);
  }

  protected openFullPage(): void {
    this.fullPageNavigator.openFullPage();
  }
}

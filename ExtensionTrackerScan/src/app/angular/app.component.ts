import { Component, Inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';
import { ChromeHandler } from '../gateway/chrome-handler.service';
import { AngularHandler } from '../gateway/dev/angular-handler.service';
import {
  NAVIGATOR_HANDLER_TOKEN,
  NavigatorHandler,
} from './port/open_full_page.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    {
      provide: NAVIGATOR_HANDLER_TOKEN,
      useClass: environment.production ? ChromeHandler : AngularHandler,
    },
  ],
})
export class AppComponent {
  selectedButton: string = 'home';

  public constructor(
    @Inject(NAVIGATOR_HANDLER_TOKEN)
    private navigatorHandler: NavigatorHandler,
    private router: Router,
  ) {}

  openTab() {
    this.navigatorHandler.openFullPage();
  }

  openAddPattern() {
    this.router.navigate(['add_website_pattern']);
  }

  goToScanTab() {
    this.router.navigate(['']);
  }

  selectButton(button: string) {
    this.selectedButton = button;
    if (button === 'home') {
      this.goToScanTab();
    } else if (button === 'addWebsite') {
      this.openAddPattern();
    }
  }
}

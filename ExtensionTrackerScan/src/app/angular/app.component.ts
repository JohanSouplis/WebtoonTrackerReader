import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import * as openFullPageInterface from './port/openFullPageInterface';
import { environment } from '../../environments/environment';
import { ChromeHandler } from '../gateway/chrome-handler.service';
import { AngularHandler } from '../gateway/angular-handler.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  providers: [
    {
      provide: openFullPageInterface.NAVIGATOR_HANDLER_TOKEN,
      useClass: environment.production ? ChromeHandler : AngularHandler,
    },
  ],
})
export class AppComponent {
  public constructor(
    @Inject(openFullPageInterface.NAVIGATOR_HANDLER_TOKEN)
    private navigatorHandler: openFullPageInterface.NavigatorHandler,
    private router: Router
  ) {}

  openTab() {
    this.navigatorHandler.openFullPage();
  }

  openAddPattern() {
    this.router.navigate(['add_website_pattern']);
  }
}

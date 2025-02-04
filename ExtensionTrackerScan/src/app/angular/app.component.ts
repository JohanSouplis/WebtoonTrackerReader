import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import * as openFullPageInterface from './port/open_full_page.interface';
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
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    {
      provide: openFullPageInterface.NAVIGATOR_HANDLER_TOKEN,
      useClass: environment.production ? ChromeHandler : AngularHandler,
    },
  ],
})
export class AppComponent implements OnInit {
  isAddWebsitePatternComponent: boolean = false;

  public constructor(
    @Inject(NAVIGATOR_HANDLER_TOKEN)
    private navigatorHandler: NavigatorHandler,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isAddWebsitePatternComponent = event.url.includes(
          'add_website_pattern'
        );
      }
    });
  }

  openTab() {
    this.navigatorHandler.openFullPage();
  }

  openAddPattern() {
    this.router.navigate(['add_website_pattern']);
  }

  goToScanTab() {
    this.router.navigate(['']);
  }
}

import { Routes } from '@angular/router';
import { ScanTabComponent } from './scanTab/scan-tab.component';
import { AddWebsitePatternComponent } from './addWebsitePattern/add_website_pattern.component';
import { ADD_WEBSITE_PATTERN_PROVIDERS } from './features/add-website-pattern/add-website-pattern.providers';

export const routes: Routes = [
  { path: '', component: ScanTabComponent },
  {
    path: 'add_website_pattern',
    component: AddWebsitePatternComponent,
    providers: ADD_WEBSITE_PATTERN_PROVIDERS,
  },
];

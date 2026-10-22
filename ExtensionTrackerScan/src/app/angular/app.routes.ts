import { Routes } from '@angular/router';
import { ScanTabComponent } from './scanTab/scan-tab.component';
import { AddWebsitePatternPage } from './features/add-website-pattern/ui/pages/add-website-pattern/add-website-pattern.page';
import { ADD_WEBSITE_PATTERN_PROVIDERS } from './features/add-website-pattern/add-website-pattern.providers';

export const routes: Routes = [
  { path: '', component: ScanTabComponent },
  {
    path: 'add_website_pattern',
    component: AddWebsitePatternPage,
    providers: ADD_WEBSITE_PATTERN_PROVIDERS,
  },
];

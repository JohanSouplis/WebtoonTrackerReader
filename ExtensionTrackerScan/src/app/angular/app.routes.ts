import { Routes } from '@angular/router';
import { ABOUT_PROVIDERS } from './features/about/about.providers';
import { AboutPage } from './features/about/ui/pages/about/about.page';
import { AddWebsitePatternPage } from './features/add-website-pattern/ui/pages/add-website-pattern/add-website-pattern.page';
import { SCAN_LIST_PROVIDERS } from './features/scan-list/scan-list.providers';
import { ScanListPage } from './features/scan-list/ui/pages/scan-list/scan-list.page';
import { ADD_WEBSITE_PATTERN_PROVIDERS } from './features/add-website-pattern/add-website-pattern.providers';

export const routes: Routes = [
  { path: '', component: ScanListPage, providers: SCAN_LIST_PROVIDERS },
  {
    path: 'add_website_pattern',
    component: AddWebsitePatternPage,
    providers: ADD_WEBSITE_PATTERN_PROVIDERS,
  },
  { path: 'about', component: AboutPage, providers: ABOUT_PROVIDERS },
];

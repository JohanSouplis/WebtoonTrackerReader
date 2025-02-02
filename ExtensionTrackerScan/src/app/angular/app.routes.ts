import { Routes } from '@angular/router';
import { ScanTabComponent } from './scanTab/scan-tab.component';
import { AddWebsitePatternComponent } from './addWebsitePattern/add_website_pattern.component';

export const routes: Routes = [
  { path: '', component: ScanTabComponent },
  { path: 'add_website_pattern', component: AddWebsitePatternComponent },
];

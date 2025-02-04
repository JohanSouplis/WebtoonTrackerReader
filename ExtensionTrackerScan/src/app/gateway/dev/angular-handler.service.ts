import { Injectable } from '@angular/core';
import { NavigatorHandler } from '../../angular/port/open_full_page.interface';

@Injectable({
  providedIn: 'root',
})
export class AngularHandler implements NavigatorHandler {
  constructor() {}
  openFullPage(): void {
    console.log('open page mocked !');
  }
}

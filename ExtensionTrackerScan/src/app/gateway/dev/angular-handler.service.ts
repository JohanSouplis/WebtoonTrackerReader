import { Injectable } from '@angular/core';
import { NavigatorHandler } from '../../angular/port/openFullPageInterface';

@Injectable({
  providedIn: 'root',
})
export class AngularHandler implements NavigatorHandler {
  constructor() {}
  openFullPage(): void {
    console.log('open page mocked !');
  }
}

import { Injectable } from '@angular/core';
import { NotificationInterface } from '../../angular/port/notification.interface';

@Injectable({
  providedIn: 'root',
})
export class AngularNotification implements NotificationInterface {
  constructor() {}
  notify(website: string): void {
    console.log('Notify Mocked');
  }
}

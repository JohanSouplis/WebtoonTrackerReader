import { InjectionToken } from '@angular/core';

export interface NotificationInterface {
  notify(website: string): void;
}

export const NOTIFICATION_TOKEN = new InjectionToken<NotificationInterface>(
  'NotificationInterface'
);

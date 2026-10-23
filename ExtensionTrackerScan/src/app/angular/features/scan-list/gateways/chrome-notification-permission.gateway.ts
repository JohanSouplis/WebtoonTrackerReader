import { NotificationPermissionPort } from '../service/notification-permission.port';

const NOTIFICATIONS: chrome.permissions.Permissions = {
  permissions: ['notifications'],
};

export class ChromeNotificationPermission implements NotificationPermissionPort {
  isGranted(): Promise<boolean> {
    return chrome.permissions.contains(NOTIFICATIONS);
  }

  request(): Promise<boolean> {
    return chrome.permissions.request(NOTIFICATIONS);
  }

  async remove(): Promise<void> {
    await chrome.permissions.remove(NOTIFICATIONS);
  }
}

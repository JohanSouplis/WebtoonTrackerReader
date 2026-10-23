import { NotificationPermissionPort } from '../service/notification-permission.port';

export class InMemoryNotificationPermission implements NotificationPermissionPort {
  constructor(
    private isAllowed = false,
    private readonly willGrant = true,
  ) {}

  async isGranted(): Promise<boolean> {
    return this.isAllowed;
  }

  async request(): Promise<boolean> {
    this.isAllowed = this.willGrant;
    return this.isAllowed;
  }

  async remove(): Promise<void> {
    this.isAllowed = false;
  }
}

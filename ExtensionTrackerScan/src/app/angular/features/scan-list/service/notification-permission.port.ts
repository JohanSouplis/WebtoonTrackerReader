export interface NotificationPermissionPort {
  isGranted(): Promise<boolean>;
  request(): Promise<boolean>;
  remove(): Promise<void>;
}

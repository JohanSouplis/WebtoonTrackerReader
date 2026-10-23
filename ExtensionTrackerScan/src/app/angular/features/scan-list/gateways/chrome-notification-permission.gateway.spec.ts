import { installChrome } from '../../../../core/gateways/fake-chrome.fixture';
import { ChromeNotificationPermission } from './chrome-notification-permission.gateway';

describe('ChromeNotificationPermission', () => {
  it('should ask the browser for the notifications permission and tell whether it was granted', async () => {
    const requests = useChromePermissions({ willGrant: true });
    const permission = new ChromeNotificationPermission();

    expect(await permission.request()).toBe(true);
    expect(await permission.isGranted()).toBe(true);
    expect(requests).toEqual([
      { call: 'request', permissions: ['notifications'] },
      { call: 'contains', permissions: ['notifications'] },
    ]);
  });

  it('should give the notifications permission back', async () => {
    const requests = useChromePermissions({ willGrant: true });
    const permission = new ChromeNotificationPermission();
    await permission.request();

    await permission.remove();

    expect(await permission.isGranted()).toBe(false);
    expect(requests).toContainEqual({
      call: 'remove',
      permissions: ['notifications'],
    });
  });
});

const useChromePermissions = ({ willGrant }: { willGrant: boolean }) => {
  const requests: { call: string; permissions?: string[] }[] = [];
  let isGranted = false;
  installChrome({
    permissions: {
      request: async ({ permissions }: { permissions: string[] }) => {
        requests.push({ call: 'request', permissions });
        isGranted = willGrant;
        return isGranted;
      },
      contains: async ({ permissions }: { permissions: string[] }) => {
        requests.push({ call: 'contains', permissions });
        return isGranted;
      },
      remove: async ({ permissions }: { permissions: string[] }) => {
        requests.push({ call: 'remove', permissions });
        isGranted = false;
        return true;
      },
    },
  });
  return requests;
};

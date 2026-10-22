import { ChromeFullPageNavigator } from './chrome-full-page-navigator.gateway';

describe('ChromeFullPageNavigator', () => {
  it('should open the extension news page in a new tab', () => {
    const createdTabs: unknown[] = [];
    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: {
        runtime: {
          getURL: (path: string) => `chrome-extension://tracker/${path}`,
        },
        tabs: { create: (tab: unknown) => createdTabs.push(tab) },
      },
    });

    new ChromeFullPageNavigator().openFullPage();

    expect(createdTabs).toEqual([
      { url: 'chrome-extension://tracker/public/news.html' },
    ]);
  });
});

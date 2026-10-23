import { ChromeStoreListing } from './chrome-store-listing.gateway';

describe('ChromeStoreListing', () => {
  it('should open the reviews of the extension on the Chrome Web Store in a new tab', () => {
    const createdTabs: unknown[] = [];
    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: { tabs: { create: (tab: unknown) => createdTabs.push(tab) } },
    });

    new ChromeStoreListing().openReviews();

    expect(createdTabs).toEqual([
      {
        url: 'https://chromewebstore.google.com/detail/tracker-reader-manga-webt/phpcbnalhbfngbciblccmpmmjlgdehjk/reviews',
      },
    ]);
  });
});

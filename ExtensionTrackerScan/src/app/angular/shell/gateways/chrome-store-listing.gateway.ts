import { StoreListingPort } from '../service/store-listing.port';

const REVIEWS_URL =
  'https://chromewebstore.google.com/detail/tracker-reader-manga-webt/phpcbnalhbfngbciblccmpmmjlgdehjk/reviews';

export class ChromeStoreListing implements StoreListingPort {
  openReviews(): void {
    chrome.tabs.create({ url: REVIEWS_URL });
  }
}

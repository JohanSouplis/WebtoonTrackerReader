import { StoreListingPort } from '../service/store-listing.port';

export class InMemoryStoreListing implements StoreListingPort {
  openReviews(): void {
    console.log('open reviews mocked !');
  }
}

import { FetchedPage } from '../domain/fetched-page';

export interface WebPagePort {
  fetchPage(url: string): Promise<FetchedPage>;
}

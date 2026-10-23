import { FetchedPage } from '../domain/fetched-page';
import { WebPagePort } from '../ports/web-page.port';

const TIMEOUT_MS = 20000;

export class FetchWebPages implements WebPagePort {
  async fetchPage(url: string): Promise<FetchedPage> {
    try {
      const response = await fetch(url, {
        credentials: 'include',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return {
        kind: 'page',
        status: response.status,
        url: response.url,
        text: await response.text(),
      };
    } catch {
      return { kind: 'unreachable' };
    }
  }
}

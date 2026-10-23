import { FetchedPage } from '../../domain/fetched-page';
import { Spacing, TimerPort } from '../../ports/timer.port';
import { WebPagePort } from '../../ports/web-page.port';

export type WebEvent =
  | { readonly kind: 'fetch'; readonly url: string }
  | { readonly kind: 'wait'; readonly spacing: Spacing };

export class InMemoryWebPages implements WebPagePort, TimerPort {
  readonly events: WebEvent[] = [];
  private pages: Readonly<Record<string, FetchedPage>> = {};

  constructor(pages: Readonly<Record<string, FetchedPage>> = {}) {
    this.serve(pages);
  }

  get fetchedUrls(): string[] {
    return this.events.flatMap((event) =>
      event.kind === 'fetch' ? [event.url] : [],
    );
  }

  serve(pages: Readonly<Record<string, FetchedPage>>): void {
    this.pages = {
      ...this.pages,
      ...Object.fromEntries(
        Object.entries(pages).map(([url, page]) => [
          url,
          page.kind === 'page' && page.url === '' ? { ...page, url } : page,
        ]),
      ),
    };
  }

  async fetchPage(url: string): Promise<FetchedPage> {
    this.events.push({ kind: 'fetch', url });
    return (
      this.pages[url] ?? { kind: 'page', status: 404, url, text: 'Not Found' }
    );
  }

  async waitAround(spacing: Spacing): Promise<void> {
    this.events.push({ kind: 'wait', spacing });
  }
}

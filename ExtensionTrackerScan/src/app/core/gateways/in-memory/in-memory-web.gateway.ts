import { Thumbnail } from '../../domain/cover';
import { CoverCandidate, CoverImage } from '../../domain/cover-search';
import { PageSignals } from '../../domain/parsed-page';
import { siteOf } from '../../domain/site';
import { CoverImagePort } from '../../ports/cover-image.port';
import { PageReaderPort } from '../../ports/page-reader.port';

export type ImageSize = {
  readonly width: number;
  readonly height: number;
};

export type WebRequest = {
  readonly url: string;
  readonly referer?: string;
};

export const thumbnailOf = (imageUrl: string): Thumbnail | undefined =>
  Thumbnail.parse(
    `data:image/webp;base64,${Buffer.from(imageUrl).toString('base64')}`,
  );

export class InMemoryWeb implements PageReaderPort, CoverImagePort {
  readonly requests: WebRequest[] = [];
  private readonly inFlight = new Map<string, number>();
  private mostInFlightOnOneSite = 0;

  constructor(
    private readonly pages: Readonly<Record<string, PageSignals>> = {},
    private readonly images: Readonly<Record<string, ImageSize>> = {},
  ) {}

  get mostRequestsAtOnceOnOneSite(): number {
    return this.mostInFlightOnOneSite;
  }

  read(url: string): Promise<PageSignals | undefined> {
    return this.answer({ url }, () => this.pages[url]);
  }

  download({
    imageUrl,
    refererUrl,
  }: CoverCandidate): Promise<CoverImage | undefined> {
    return this.answer({ url: imageUrl, referer: refererUrl }, () => {
      const size = this.images[imageUrl];
      const thumbnail = thumbnailOf(imageUrl);
      return size && thumbnail ? { ...size, thumbnail } : undefined;
    });
  }

  private async answer<T>(request: WebRequest, response: () => T): Promise<T> {
    const site = siteOf(request.url) ?? request.url;
    const load = (this.inFlight.get(site) ?? 0) + 1;
    this.requests.push(request);
    this.inFlight.set(site, load);
    this.mostInFlightOnOneSite = Math.max(this.mostInFlightOnOneSite, load);
    await new Promise((resolve) => setTimeout(resolve, 0));
    this.inFlight.set(site, (this.inFlight.get(site) ?? 0) - 1);
    return response();
  }
}

const RETRY_DELAY_MS = 7 * 24 * 60 * 60 * 1000;

export class Thumbnail {
  private constructor(readonly dataUrl: string) {}

  static parse(text: string): Thumbnail | undefined {
    return /^data:image\/(webp|png|jpeg);base64,[a-z\d+/]+=*$/i.test(text)
      ? new Thumbnail(text)
      : undefined;
  }
}

export type CoverSource = 'page' | 'series-page';

export type Cover =
  | {
      readonly kind: 'found';
      readonly thumbnail: Thumbnail;
      readonly from: CoverSource;
      readonly at: Date;
    }
  | { readonly kind: 'missing'; readonly triedAt: Date };

export type Covers = ReadonlyMap<string, Cover>;

export const settleCover =
  (searched: Cover) =>
  (stored: Cover | undefined): Cover =>
    stored?.kind === 'found' ? stored : searched;

export const isCoverDue = (cover: Cover | undefined, now: Date): boolean => {
  switch (cover?.kind) {
    case undefined:
      return true;
    case 'found':
      return false;
    case 'missing':
      return now.getTime() - cover.triedAt.getTime() >= RETRY_DELAY_MS;
  }
};

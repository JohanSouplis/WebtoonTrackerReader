import { Cover, Covers, Thumbnail } from '../domain/cover';
import { ScanTitle } from '../domain/scan-title';
import { CoverRepository } from '../ports/cover-repository.port';

type StoredCover =
  | {
      readonly kind: 'found';
      readonly thumbnail: string;
      readonly from: 'page' | 'series-page';
      readonly at: string;
    }
  | { readonly kind: 'missing'; readonly triedAt: string };

const keyOf = (title: ScanTitle): string => `cover:${title.seriesKey.value}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const dateOf = (value: unknown): Date | undefined => {
  const date = new Date(typeof value === 'string' ? value : NaN);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toCover = (stored: unknown): Cover | undefined => {
  if (!isRecord(stored)) {
    return undefined;
  }
  const thumbnail = Thumbnail.parse(String(stored['thumbnail']));
  const at = dateOf(stored['at']);
  const triedAt = dateOf(stored['triedAt']);
  const from = stored['from'];
  if (
    stored['kind'] === 'found' &&
    thumbnail &&
    at &&
    (from === 'page' || from === 'series-page')
  ) {
    return { kind: 'found', thumbnail, from, at };
  }
  return stored['kind'] === 'missing' && triedAt
    ? { kind: 'missing', triedAt }
    : undefined;
};

const toStored = (cover: Cover): StoredCover =>
  cover.kind === 'found'
    ? {
        kind: 'found',
        thumbnail: cover.thumbnail.dataUrl,
        from: cover.from,
        at: cover.at.toISOString(),
      }
    : { kind: 'missing', triedAt: cover.triedAt.toISOString() };

export class ChromeStorageCoverRepository implements CoverRepository {
  async find(titles: readonly ScanTitle[]): Promise<Covers> {
    const stored = await chrome.storage.local.get(titles.map(keyOf));
    return new Map(
      titles.flatMap((title) => {
        const cover = toCover(stored[keyOf(title)]);
        return cover ? [[title.value, cover]] : [];
      }),
    );
  }

  async save(title: ScanTitle, cover: Cover): Promise<void> {
    await chrome.storage.local.set({ [keyOf(title)]: toStored(cover) });
  }

  async remove(title: ScanTitle): Promise<void> {
    await chrome.storage.local.remove(keyOf(title));
  }
}

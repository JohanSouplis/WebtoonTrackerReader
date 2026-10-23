import { ScanLibrary, ScanSnapshot } from '../domain/scan-library';
import { ScanRepository } from '../ports/scan-repository.port';

type StoredScan = {
  readonly title: string;
  readonly chapter: string;
  readonly url: string;
  readonly whenWasItRead: string;
  readonly isFavorite: boolean;
  readonly rating?: number;
  readonly seriesUrl?: string;
  readonly aliases?: readonly string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const aliasesOf = (stored: unknown): string[] | undefined => {
  const aliases = Array.isArray(stored)
    ? stored.filter((alias): alias is string => typeof alias === 'string')
    : [];
  return aliases.length === 0 ? undefined : aliases;
};

const toSnapshot = (stored: Record<string, unknown>): ScanSnapshot => ({
  title: String(stored['title']),
  chapter: Number(stored['chapter']),
  url: String(stored['url']),
  readAt: new Date(String(stored['whenWasItRead'])),
  isFavorite: stored['isFavorite'] === true,
  rating: typeof stored['rating'] === 'number' ? stored['rating'] : undefined,
  seriesUrl:
    typeof stored['seriesUrl'] === 'string' ? stored['seriesUrl'] : undefined,
  aliases: aliasesOf(stored['aliases']),
});

const toStored = (snapshot: ScanSnapshot): StoredScan => ({
  title: snapshot.title,
  chapter: String(snapshot.chapter),
  url: snapshot.url,
  whenWasItRead: Number.isNaN(snapshot.readAt.getTime())
    ? ''
    : snapshot.readAt.toString(),
  isFavorite: snapshot.isFavorite,
  rating: snapshot.rating,
  seriesUrl: snapshot.seriesUrl,
  aliases: snapshot.aliases,
});

export class ChromeStorageScanRepository implements ScanRepository {
  async load(): Promise<ScanLibrary> {
    const { scans } = await chrome.storage.local.get<{ scans: unknown }>({
      scans: [],
    });
    return ScanLibrary.restore(
      Array.isArray(scans) ? scans.filter(isRecord).map(toSnapshot) : [],
    );
  }

  async save(library: ScanLibrary): Promise<void> {
    await chrome.storage.local.set({
      scans: library.snapshot().map(toStored),
    });
  }
}

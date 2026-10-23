import {
  HostLessons,
  Learned,
  Lesson,
  LESSON_VALUES,
} from '../domain/chapter-check';
import { HostProfile, HostProfiles } from '../domain/chapter-watch';
import { HostProfileRepository } from '../ports/host-profile-repository.port';

const HOST_KEY_PREFIX = 'host:';

const keyOf = (site: string): string => `${HOST_KEY_PREFIX}${site}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const dateOf = (value: unknown): Date | undefined => {
  const date = new Date(typeof value === 'string' ? value : NaN);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const learnedOf = <L extends Lesson>(
  lesson: L,
  stored: unknown,
): Learned<(typeof LESSON_VALUES)[L][number]> | undefined => {
  if (!isRecord(stored)) {
    return undefined;
  }
  const value = LESSON_VALUES[lesson].find(
    (known: string) => known === stored['value'],
  );
  const learnedAt = dateOf(stored['learnedAt']);
  return value && learnedAt ? { value, learnedAt } : undefined;
};

const toLessons = (stored: unknown): HostLessons =>
  isRecord(stored)
    ? {
        feed: learnedOf('feed', stored['feed']),
        'series-page': learnedOf('series-page', stored['series-page']),
        'far-chapter': learnedOf('far-chapter', stored['far-chapter']),
        'current-chapter': learnedOf(
          'current-chapter',
          stored['current-chapter'],
        ),
      }
    : {};

const toProfile = (stored: unknown): HostProfile | undefined => {
  if (!isRecord(stored)) {
    return undefined;
  }
  const lessons = toLessons(stored['lessons']);
  const backoff = stored['backoff'];
  const strikes = isRecord(backoff) ? backoff['strikes'] : undefined;
  const until = isRecord(backoff) ? dateOf(backoff['until']) : undefined;
  return typeof strikes === 'number' && until
    ? { lessons, backoff: { strikes, until } }
    : { lessons };
};

export class ChromeStorageHostProfileRepository implements HostProfileRepository {
  private static updates: Promise<unknown> = Promise.resolve();

  async find(sites: readonly string[]): Promise<HostProfiles> {
    const unique = [...new Set(sites)];
    const stored = await chrome.storage.local.get(unique.map(keyOf));
    return new Map(
      unique.flatMap((site) => {
        const profile = toProfile(stored[keyOf(site)]);
        return profile ? [[site, profile]] : [];
      }),
    );
  }

  update(
    site: string,
    change: (stored: HostProfile | undefined) => HostProfile,
  ): Promise<void> {
    const key = keyOf(site);
    const update = ChromeStorageHostProfileRepository.updates.then(async () => {
      const stored = await chrome.storage.local.get([key]);
      await chrome.storage.local.set({
        [key]: JSON.parse(JSON.stringify(change(toProfile(stored[key])))),
      });
    });
    ChromeStorageHostProfileRepository.updates = update.catch(() => undefined);
    return update;
  }
}

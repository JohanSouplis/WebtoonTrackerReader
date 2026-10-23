import { HostProfile } from '../domain/chapter-watch';
import { ChromeStorageHostProfileRepository } from './chrome-storage-host-profile-repository.gateway';
import { FakeChromeStorage, installChrome } from './fake-chrome.fixture';

describe('ChromeStorageHostProfileRepository', () => {
  it('should find what it learned of a site under its own key', async () => {
    const storage = useStorage({});
    const repository = new ChromeStorageHostProfileRepository();

    await repository.update('scans.org', () => PROFILE);

    expect(await repository.find(['scans.org', 'other.org'])).toEqual(
      new Map([['scans.org', PROFILE]]),
    );
    expect(Object.keys(storage.items)).toEqual(['host:scans.org']);
  });

  it('should apply each update to the profile the previous one stored', async () => {
    useStorage({});

    await Promise.all([
      new ChromeStorageHostProfileRepository().update(
        'scans.org',
        () => PROFILE,
      ),
      new ChromeStorageHostProfileRepository().update(
        'scans.org',
        (stored) => stored ?? { lessons: {} },
      ),
    ]);

    expect(
      await new ChromeStorageHostProfileRepository().find(['scans.org']),
    ).toEqual(new Map([['scans.org', PROFILE]]));
  });

  it('should forget a stored lesson it cannot read and keep the others', async () => {
    useStorage({
      'host:scans.org': {
        lessons: {
          feed: { value: 'maybe', learnedAt: '2026-10-23T10:00:00.000Z' },
          'far-chapter': {
            value: 'refused',
            learnedAt: '2026-10-23T10:00:00.000Z',
          },
        },
      },
    });

    expect(
      await new ChromeStorageHostProfileRepository().find(['scans.org']),
    ).toEqual(
      new Map([
        [
          'scans.org',
          {
            lessons: {
              'far-chapter': { value: 'refused', learnedAt: AT },
            },
          },
        ],
      ]),
    );
  });
});

const AT = new Date('2026-10-23T10:00:00Z');

const PROFILE: HostProfile = {
  lessons: {
    feed: { value: 'absent', learnedAt: AT },
    'series-page': { value: 'works', learnedAt: AT },
  },
  backoff: { strikes: 2, until: AT },
};

const useStorage = (items: Record<string, unknown>): FakeChromeStorage => {
  const storage = new FakeChromeStorage(items);
  installChrome({ storage: { local: storage } });
  return storage;
};

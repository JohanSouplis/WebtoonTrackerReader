import { ChapterWatch } from '../../domain/chapter-watch';

const CHECKED_AT = new Date('2025-03-10T09:00:00Z');

const SITE = 'asuracomic.net';

export const DEV_WATCHES: Readonly<Record<string, ChapterWatch>> = {
  'The Executioner': {
    kind: 'new',
    site: SITE,
    latest: 47,
    url: 'https://asuracomic.net/series/the-executioner-472e692a/chapter/47',
    foundAt: CHECKED_AT,
    checkedAt: CHECKED_AT,
  },
  'Dungeon Odyssey': {
    kind: 'failing',
    site: SITE,
    since: CHECKED_AT,
    attempts: 2,
    nextAttemptAt: new Date('2025-03-10T10:00:00Z'),
    lastKnown: {
      kind: 'new',
      site: SITE,
      latest: 119.5,
      foundAt: new Date('2025-03-09T21:00:00Z'),
      checkedAt: new Date('2025-03-09T21:00:00Z'),
    },
  },
  'Duke Pendragon': {
    kind: 'unsupported',
    site: SITE,
    reason: 'script-only',
    checkedAt: CHECKED_AT,
  },
  'Omniscient Reader’s Viewpoint': {
    kind: 'up-to-date',
    site: SITE,
    latest: 246,
    checkedAt: CHECKED_AT,
  },
  'I Obtained a Mythic Item': {
    kind: 'failing',
    site: SITE,
    since: CHECKED_AT,
    attempts: 1,
    nextAttemptAt: new Date('2025-03-10T09:15:00Z'),
  },
};

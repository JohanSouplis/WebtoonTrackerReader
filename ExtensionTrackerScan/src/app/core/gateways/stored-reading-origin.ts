import { ReadingOrigin } from '../domain/reading';

export type StoredReadingOrigin = Exclude<ReadingOrigin, 'unknown'>;

const STORED_ORIGINS: readonly StoredReadingOrigin[] = [
  'this-device',
  'other-device',
];

export const readingOriginOf = (stored: unknown): ReadingOrigin =>
  STORED_ORIGINS.find((origin) => origin === stored) ?? 'unknown';

export const storedOriginOf = (
  origin: ReadingOrigin,
): StoredReadingOrigin | undefined =>
  origin === 'unknown' ? undefined : origin;

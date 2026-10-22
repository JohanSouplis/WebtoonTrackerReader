import { ScanTitle } from './app/core/domain/scan-title';

export type CoverBackfillMessage = {
  readonly kind: 'backfill-covers';
  readonly titles: readonly string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const parseCoverBackfillMessage = (
  message: unknown,
): ScanTitle[] | undefined =>
  isRecord(message) &&
  message['kind'] === 'backfill-covers' &&
  Array.isArray(message['titles'])
    ? message['titles'].flatMap((title) =>
        typeof title === 'string' && title !== '' ? [ScanTitle.of(title)] : [],
      )
    : undefined;

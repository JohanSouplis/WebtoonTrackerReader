import { ShownScan } from './scan-list-view.vm';
import { ScanRow } from './scan-row.vm';

export const aRow = (row: Partial<ScanRow>): ScanRow => ({
  title: 'Title',
  chapter: 1,
  url: 'https://asuracomic.net/series/title/chapter/1',
  website: 'asuracomic.net',
  readAt: new Date('2024-06-01T13:05:10Z'),
  isFavorite: false,
  watch: { kind: 'quiet' },
  ...row,
});

export const aShownScan = (scan: Partial<ShownScan>): ShownScan => ({
  ...aRow(scan),
  cover: { kind: 'monogram' },
  ...scan,
});

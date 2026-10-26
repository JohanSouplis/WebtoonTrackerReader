import { ScanSnapshot } from '../domain/scan-library';

export const aScan = (scan: Partial<ScanSnapshot>): ScanSnapshot => ({
  title: 'Title',
  chapter: 1,
  url: 'url.com',
  readAt: new Date('2024-06-01T13:05:10Z'),
  origin: 'this-device',
  isFavorite: false,
  ...scan,
});

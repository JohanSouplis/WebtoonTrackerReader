import { ScanSnapshot } from '../../../../core/domain/scan-library';

export type ScanRow = {
  readonly title: string;
  readonly chapter: number;
  readonly url: string;
  readonly readAt: Date;
  isFavorite: boolean;
  rating?: number;
};

export const toScanRow = ({ rating, ...scan }: ScanSnapshot): ScanRow =>
  rating === undefined ? scan : { ...scan, rating };

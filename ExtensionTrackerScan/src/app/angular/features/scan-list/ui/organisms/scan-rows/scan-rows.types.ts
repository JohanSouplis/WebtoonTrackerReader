import { ScanRow } from '../../../service/scan-row.vm';

export type ScanRename = {
  readonly scan: ScanRow;
  readonly title: string;
};

export type ScanRating = {
  readonly scan: ScanRow;
  readonly rating: number;
};

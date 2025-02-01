import { Scan } from './scan.type';

export function deleteScan(scansList: Scan[], scan: Scan): Scan[] {
  return scansList.filter((scanItem) => scanItem.title !== scan.title);
}

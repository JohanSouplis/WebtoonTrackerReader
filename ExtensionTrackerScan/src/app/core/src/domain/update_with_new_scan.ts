import { Scan } from './scan.type';

export function updateWithNewScan(scansList: Scan[], newScan: Scan): Scan[] {
  if (!newScan.chapter || !newScan.title) {
    return scansList;
  }

  let existingScan: Scan | undefined = scansList.find(
    (scan) => scan['title'] === newScan.title
  );
  if (!existingScan) {
    scansList.push(newScan);
    return scansList;
  }
  existingScan['chapter'] = newScan.chapter;
  existingScan['url'] = newScan.url;
  existingScan['whenWasItReaded'] = newScan.whenWasItReaded;
  return scansList;
}

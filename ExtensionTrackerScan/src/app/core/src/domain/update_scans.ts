import { Scan } from './scan.type';

export function updateScansWithNewVisitedScan(
  scansList: Scan[],
  newScan: Scan
): Scan[] {
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
  if (new Date(existingScan.whenWasItRead) > new Date(newScan.whenWasItRead)) {
    return scansList;
  }
  existingScan['chapter'] = newScan.chapter;
  existingScan['url'] = newScan.url;
  existingScan['whenWasItRead'] = newScan.whenWasItRead;
  return scansList;
}

export function updateScansModifiedByUser(
  scansList: Scan[],
  scanToUpdate: Scan
): Scan[] {
  let existingScan: Scan | undefined = scansList.find(
    (scan) => scan['title'] === scanToUpdate.title
  );
  if (!existingScan) {
    console.log('Error, scan not found !');
    return scansList;
  }
  existingScan['isFavorite'] = scanToUpdate.isFavorite;
  existingScan['rating'] = scanToUpdate?.rating;
  return scansList;
}

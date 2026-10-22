import { Scan } from './scan.type';

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

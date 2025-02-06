import { Scan } from '../../src/domain/scan.type';

export function createScanVisited(
  title: string,
  chapter: string,
  url: string,
  whenWasItRead: string
): Scan {
  return {
    title: title,
    chapter: chapter,
    url: url,
    isFavorite: false,
    whenWasItRead: whenWasItRead,
  } as Scan;
}
export function createScan(
  title: string,
  chapter: string,
  url: string,
  favorite: boolean,
  dateReading: string,
  rating?: number
): Scan {
  return {
    title: title,
    chapter: chapter,
    url: url,
    isFavorite: favorite,
    whenWasItRead: dateReading,
    rating: rating,
  } as Scan;
}

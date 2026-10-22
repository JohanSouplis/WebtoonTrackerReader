import { Observable } from 'rxjs';
import { InjectionToken } from '@angular/core';

export type Scan = {
  title: string;
  chapter: string;
  url: string;
  whenWasItRead: string;
  isFavorite: boolean;
  rating?: number;
};

export interface StorageInterface {
  delete(scan: Scan): void;
  toggleFavorite(scan: Scan): void;
  rate(scan: Scan, rating: number): void;
  getScans(): Observable<Scan[]>;
}

export const STORAGE_TOKEN = new InjectionToken<StorageInterface>(
  'StorageInterface'
);

import { Observable } from 'rxjs';
import { Scan } from '../../core/src/domain/scan.type';
import { InjectionToken } from '@angular/core';

export interface StorageInterface {
  getScans(): Observable<Scan[]>;
}

export const STORAGE_INTERFACE_TOKEN = new InjectionToken<StorageInterface>(
  'StorageInterface'
);

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageInterface } from '../angular/port/storage.interface';
import { Scan } from '../core/src/domain/scan.type';
import { updateScansWithThisScan as updateScansWithThisScan } from '../core/src/domain/update_with_new_scan';

@Injectable({
  providedIn: 'root',
})
export class ChromeStorageService implements StorageInterface {
  constructor() {}

  updateScan(scan: Scan): void {
    chrome.storage.local.get({ scans: [] }, function (result) {
      var scansList: Scan[] = updateScansWithThisScan(result['scans'], scan);
      chrome.storage.local.set({ scans: scansList }, function () {});
    });
  }

  getScans(): Observable<Scan[]> {
    return new Observable((subscriber) => {
      chrome.storage.local.get('scans', (result) => {
        if (chrome.runtime.lastError) {
          subscriber.error(chrome.runtime.lastError);
        } else {
          subscriber.next(result['scans']);
          subscriber.complete();
        }
      });
    });
  }
}

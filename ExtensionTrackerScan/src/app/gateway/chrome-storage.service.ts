import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageInterface } from '../angular/port/storage.interface';
import { Scan } from '../core/src/domain/scan.type';

@Injectable({
  providedIn: 'root',
})
export class ChromeStorageService implements StorageInterface {
  constructor() {}

  //   setItem(key: string, value: any): void {
  //     chrome.storage.local.set({ [key]: value }, () => {
  //       console.log(`Data saved: ${key}`);
  //     });
  //   }

  //   getItem<T>(key: string): Promise<T | undefined> {
  //     return new Promise((resolve, reject) => {
  //       chrome.storage.local.get(key, (result) => {
  //         if (chrome.runtime.lastError) {
  //           reject(chrome.runtime.lastError);
  //         } else {
  //           resolve(result[key] as T);
  //         }
  //       });
  //     });
  //   }

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

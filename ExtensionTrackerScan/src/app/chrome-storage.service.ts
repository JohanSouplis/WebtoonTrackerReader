import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ChromeStorageService {
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

  getAllItems(): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  }
}

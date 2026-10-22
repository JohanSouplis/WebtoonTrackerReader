import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Scan, StorageInterface } from '../angular/port/storage.interface';
import { Rating } from '../core/domain/rating';
import { ScanTitle } from '../core/domain/scan-title';
import { ChromeStorageScanRepository } from '../core/gateways/chrome-storage-scan-repository.gateway';
import { DeleteScanUseCase } from '../core/use-cases/delete-scan.use-case';
import { RateScanUseCase } from '../core/use-cases/rate-scan.use-case';
import { ToggleFavoriteUseCase } from '../core/use-cases/toggle-favorite.use-case';

@Injectable({
  providedIn: 'root',
})
export class ChromeStorageService implements StorageInterface {
  private readonly scanRepository = new ChromeStorageScanRepository();

  constructor() {}
  delete(scan: Scan): void {
    void new DeleteScanUseCase(this.scanRepository).execute(
      ScanTitle.of(scan.title),
    );
  }

  toggleFavorite(scan: Scan): void {
    void new ToggleFavoriteUseCase(this.scanRepository).execute(
      ScanTitle.of(scan.title),
    );
  }

  rate(scan: Scan, rating: number): void {
    void new RateScanUseCase(this.scanRepository).execute(
      ScanTitle.of(scan.title),
      Rating.of(rating),
    );
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

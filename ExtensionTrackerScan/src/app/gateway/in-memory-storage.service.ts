import { Observable, of } from 'rxjs';
import { StorageInterface } from '../angular/port/storage.interface';
import { Scan } from '../core/src/domain/scan.type';

export class InMemoryStorageService implements StorageInterface {
  getScans(): Observable<Scan[]> {
    return of([{ title: 'Title', chapter: 'Chapter', url: 'Url' }]);
  }
}

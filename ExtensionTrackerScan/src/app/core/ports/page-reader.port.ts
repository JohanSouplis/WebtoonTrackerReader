import { PageSignals } from '../domain/parsed-page';

export interface PageReaderPort {
  read(url: string): Promise<PageSignals | undefined>;
}

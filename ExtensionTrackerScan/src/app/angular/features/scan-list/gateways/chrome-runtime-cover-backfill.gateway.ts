import { CoverBackfillMessage } from '../../../../../cover-backfill-message';
import { CoverBackfillPort } from '../service/cover-backfill.port';

export class ChromeRuntimeCoverBackfill implements CoverBackfillPort {
  async backfillCovers(titles: readonly string[]): Promise<void> {
    const message: CoverBackfillMessage = { kind: 'backfill-covers', titles };
    await chrome.runtime.sendMessage(message);
  }
}

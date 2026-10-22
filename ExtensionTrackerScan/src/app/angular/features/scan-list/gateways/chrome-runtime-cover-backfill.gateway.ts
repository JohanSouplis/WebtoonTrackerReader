import { COVER_KEY_PREFIX } from '../../../../core/gateways/chrome-storage-cover-repository.gateway';
import { CoverBackfillMessage } from '../../../../../cover-backfill-message';
import { CoverBackfillPort } from '../service/cover-backfill.port';

export class ChromeRuntimeCoverBackfill implements CoverBackfillPort {
  async backfillCovers(
    titles: readonly string[],
    onCoverSaved: () => void,
  ): Promise<void> {
    const message: CoverBackfillMessage = { kind: 'backfill-covers', titles };
    const notifyCoverSaved = (changes: object, areaName: string): void => {
      if (
        areaName === 'local' &&
        Object.keys(changes).some((key) => key.startsWith(COVER_KEY_PREFIX))
      ) {
        onCoverSaved();
      }
    };
    chrome.storage.onChanged.addListener(notifyCoverSaved);
    try {
      await chrome.runtime.sendMessage(message);
    } finally {
      chrome.storage.onChanged.removeListener(notifyCoverSaved);
    }
  }
}

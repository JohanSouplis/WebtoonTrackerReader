import { retrieveTitleAndChapter } from './app/core/src/domain/recuperer_titre_et_chapitre';
import { Scan } from './app/core/src/domain/scan.type';
import { updateWithNewScan } from './app/core/src/domain/update_with_new_scan';

chrome.runtime.onMessage.addListener(
  (message: { content: string; url: string }) => {
    const [title, chapter] = retrieveTitleAndChapter(
      message.content,
      message.url
    );
    chrome.storage.local.get({ scans: [] }, function (result) {
      var scansList: Scan[] = updateWithNewScan(result['scans'], {
        title: title,
        chapter: chapter,
        url: message.url,
        whenWasItReaded: new Date(),
        isFavorite: false,
      } as Scan);

      chrome.storage.local.set({ scans: scansList }, function () {});
    });
  }
);

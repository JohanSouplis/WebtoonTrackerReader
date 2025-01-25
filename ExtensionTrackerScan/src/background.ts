import { retrieveTitleAndChapter } from './app/core/src/domain/recuperer_titre_et_chapitre';
import { Scan } from './app/core/src/domain/scan.type';
import { updateScansWithNewVisitedScan } from './app/core/src/domain/update_scans';

chrome.runtime.onMessage.addListener(
  (message: { content: string; url: string }) => {
    let titleAndChapter: string[] = retrieveTitleAndChapter(
      message.content,
      message.url
    );
    if (titleAndChapter.length === 0) {
      return;
    }
    let [title, chapter] = titleAndChapter;
    chrome.storage.local.get({ scans: [] }, function (result) {
      var scansList: Scan[] = updateScansWithNewVisitedScan(result['scans'], {
        title: title,
        chapter: chapter,
        url: message.url,
        whenWasItRead: new Date().toString(),
        isFavorite: false,
      } as Scan);

      chrome.storage.local.set({ scans: scansList }, function () {});
    });
  }
);

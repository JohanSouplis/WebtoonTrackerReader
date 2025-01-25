import { retrieveTitleAndChapter } from './app/core/src/domain/recuperer_titre_et_chapitre';
import { Scan } from './app/core/src/domain/scan.type';
import { updateScansWithNewVisitedScan } from './app/core/src/domain/update_scans';

chrome.runtime.onMessage.addListener(
  (message: { title: string; url: string }) => {
    console.log(message.title);
    if (!message.title) {
      return;
    }
    let titleAndChapter: string[] = retrieveTitleAndChapter(
      message.title,
      message.url
    );
    console.log(titleAndChapter);
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

import { container } from './app/core/container';
import { RetrieveTitleAndChapter } from './app/core/src/domain/retrieve_title_and_chapter';
import { Scan } from './app/core/src/domain/scan.type';
import { updateScansWithNewVisitedScan } from './app/core/src/domain/update_scans';

chrome.runtime.onMessage.addListener(
  (message: { title: string; url: string }) => {
    console.log(message.title);
    if (!message.title) {
      return;
    }

    const retrieveTitleAndChapter = container.get<RetrieveTitleAndChapter>(
      'RetrieveTitleAndChapter'
    );
    let titleAndChapter: string[] = retrieveTitleAndChapter.execute(
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

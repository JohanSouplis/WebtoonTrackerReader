import { container } from './app/core/container';
import { RetrieveTitleAndChapter } from './app/core/src/domain/retrieve_title_and_chapter';
import { Scan } from './app/core/src/domain/scan.type';
import { updateScansWithNewVisitedScan } from './app/core/src/domain/update_scans';

const retrieveTitleAndChapter = container.get<RetrieveTitleAndChapter>(
  'RetrieveTitleAndChapter'
);

chrome.runtime.onMessage.addListener(
  (message: { title: string; url: string }) => {
    if (!message.title) {
      return;
    }

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

chrome.storage.local.get(['dateLastSearch'], function (dateLastSearch) {
  let searchStartTime = 0;
  if (dateLastSearch['dateLastSearch']) {
    searchStartTime = dateLastSearch['dateLastSearch'];
  }
  chrome.history.search(
    {
      text: '',
      maxResults: 100000,
      startTime: searchStartTime,
    },
    function (results) {
      let scans: Scan[] = [];
      results.forEach((page) => {
        if (page.title && page.url) {
          let titleAndChapter: string[] = retrieveTitleAndChapter.execute(
            page.title,
            page.url
          );
          if (titleAndChapter.length === 0) {
            return;
          }
          let scan: Scan = {
            title: titleAndChapter[0],
            chapter: titleAndChapter[1],
            url: page.url,
            whenWasItRead: page.lastVisitTime
              ? new Date(page.lastVisitTime).toString()
              : '',
            isFavorite: false,
          };
          scans.push(scan);
        }
      });
      chrome.storage.local.get({ scans: [] }, function (result) {
        let scanList: Scan[] = result['scans'];
        scans.forEach((scan) => {
          scanList = updateScansWithNewVisitedScan(scanList, scan);
        });

        chrome.storage.local.set({ scans: scanList }, function () {});
      });
      chrome.storage.local.set({ dateLastSearch: Date.now() }, function () {});
    }
  );
});

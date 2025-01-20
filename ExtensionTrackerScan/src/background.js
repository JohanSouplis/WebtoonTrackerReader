import { retrieveTitleAndChapter } from "./app/core/src/recuperer_titre_et_chapitre";

chrome.runtime.onMessage.addListener((message) => {
  const [title, chapter] = retrieveTitleAndChapter(
    message.content,
    message.url
  );
  chrome.storage.local.set({ ["scans"]: title, chapter }, () => {
    console.log("Save :", title, chapter);
  });
});

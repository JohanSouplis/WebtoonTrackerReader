import { FullPageNavigatorPort } from '../service/full-page-navigator.port';

export class ChromeFullPageNavigator implements FullPageNavigatorPort {
  openFullPage(): void {
    chrome.tabs.create({ url: chrome.runtime.getURL('public/news.html') });
  }
}

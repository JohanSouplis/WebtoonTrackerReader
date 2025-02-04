import { Injectable } from '@angular/core';
import { NavigatorHandler } from '../angular/port/open_full_page.interface';

@Injectable({
  providedIn: 'root',
})
export class ChromeHandler implements NavigatorHandler {
  constructor() {}
  openFullPage(): void {
    chrome.tabs.create({ url: chrome.runtime.getURL('public/news.html') });
  }
}

import { inject } from 'inversify';
import { websiteJson } from '../../pattern/link-format-website-title';
import type { CrashReport } from './ports/crash_report.interface';
const titleIsHere: string = 't';
const chapterNumberIsHere: string = 'c';
const HTTPS = 'https://';

export class RetrieveTitleAndChapter {
  constructor(@inject('CrashReport') private crashReport: CrashReport) {}

  execute(titleWebpage: string, url: string): string[] {
    titleWebpage = this.removeBackSlashAndSpaceAtBeginning(titleWebpage);

    const webtoonParser: any = this.getParserForThisWebsite(url);
    if (webtoonParser.length === 0) {
      return [];
    }
    const parserList = webtoonParser[0];
    try {
      for (let j = 0; j < parserList.length; j++) {
        const parser = parserList[j][1].formatparse;
        let titleSplitted: string[] = parser.split('§');
        let title: string = '';
        let chapter: string = '';
        for (let i = 0; i < titleSplitted.length; i++) {
          if (titleSplitted[i] === titleIsHere) {
            title = this.getTitle(i, title, titleWebpage, titleSplitted);
          } else if (titleSplitted[i] === chapterNumberIsHere) {
            chapter = this.getChapter(titleWebpage, titleSplitted, i, chapter);
          }
        }
        if (title && title[0] === ' ') {
          title = title.substring(1);
        }
        if (title && chapter) {
          return [title, chapter];
        }
      }
    } catch (error) {
      console.log(error);
      this.sendCrashReport(url, error);
      return [];
    }
    this.sendCrashReport(url);
    return [];
  }

  private getTitle(
    i: number,
    title: string,
    titleWebpage: string,
    titleSplitted: string[]
  ) {
    if (i === 0) {
      title = titleWebpage.split(titleSplitted[i + 1])[i];
    } else {
      let stringFinishingWithTitle = titleWebpage.split(
        titleSplitted[i - 1]
      )[1];
      if (!stringFinishingWithTitle) {
        return '';
      }
      title = stringFinishingWithTitle.split(titleSplitted[i + 1])[0];
    }
    return title;
  }

  private getChapter(
    titleWebpage: string,
    titleSplitted: string[],
    i: number,
    chapter: string
  ) {
    let stringFinishingWithChapter = titleWebpage.split(
      titleSplitted[i - 1]
    )[1];
    if (!stringFinishingWithChapter) {
      return '';
    }
    chapter = stringFinishingWithChapter.split(' ')[0];
    chapter = chapter.replace(':', '');
    return chapter;
  }

  private removeBackSlashAndSpaceAtBeginning(titleWebpage: string) {
    titleWebpage = titleWebpage.replace('\n', '');
    if (titleWebpage[0] === ' ') {
      titleWebpage = titleWebpage.substring(1);
    }
    return titleWebpage;
  }

  private getParserForThisWebsite(url: string) {
    return Object.entries(websiteJson)
      .filter((website) => this.isMatchingWebsite(url, website))
      .map((website) => Object.entries(website[1]));
  }

  private isMatchingWebsite(url: string, website: any): boolean {
    let numberToAddInCase = 5;
    return (
      url.includes(website[0]) &&
      this.isNotARedirection(url, numberToAddInCase, website) &&
      this.isNotFirstWebpageWithoutScan(url, website, numberToAddInCase)
    );
  }

  private isNotFirstWebpageWithoutScan(
    url: string,
    website: any,
    numberToAddInCase: number
  ): boolean {
    return url.length > HTTPS.length + website[0].length + numberToAddInCase;
  }

  //Check that the url of website is at the beginning
  private isNotARedirection(
    url: string,
    numberToAddInCase: number,
    website: any
  ): boolean {
    return url
      .substring(0, HTTPS.length + numberToAddInCase + website[0].length)
      .includes(website[0]);
  }

  private async sendCrashReport(url: string, error?: any) {
    this.crashReport.execute(url, error);
  }
}

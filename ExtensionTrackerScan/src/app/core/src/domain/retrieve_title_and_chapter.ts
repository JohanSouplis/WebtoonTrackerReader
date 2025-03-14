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
        if (url.includes(parserList[j][1].excludePatternUrl)) {
          return [];
        }
        if (titleWebpage.includes(parserList[j][1].excludePatternTitle)) {
          return [];
        }

        let title: string = '';
        let chapter: string = '';
        ({ title, chapter } = this.getParsedInformation(
          parserList[j][1].formatParseTitle,
          title,
          titleWebpage,
          chapter
        ));
        if (parserList[j][1].formatParseUrl) {
          ({ title, chapter } = this.getParsedInformation(
            parserList[j][1].formatParseUrl,
            title,
            url,
            chapter
          ));
        }

        if (title && title[0] === ' ') {
          title = title.substring(1);
        }
        title = title.replace(' [Official]', '');
        if (title && chapter) {
          return [title, chapter];
        }
      }
    } catch (error) {
      console.log(error);
      this.sendCrashReport(url, titleWebpage, error);
      return [];
    }
    this.sendCrashReport(url, titleWebpage);
    return [];
  }

  private getParsedInformation(
    parser: any,
    title: string,
    informationFromWebsite: string,
    chapter: string
  ) {
    let titleSplitted: string[] = parser.split('§');
    for (let i = 0; i < titleSplitted.length; i++) {
      if (titleSplitted[i] === titleIsHere) {
        title = this.getTitle(i, title, informationFromWebsite, titleSplitted);
      } else if (titleSplitted[i] === chapterNumberIsHere) {
        chapter = this.getChapter(
          informationFromWebsite,
          titleSplitted,
          i,
          chapter
        );
      }
    }
    return { title, chapter };
  }

  private getTitle(
    i: number,
    title: string,
    informationFromWebsite: string,
    informationFromWebsiteSplitted: string[]
  ) {
    if (i === 0) {
      title = informationFromWebsite.split(
        informationFromWebsiteSplitted[i + 1]
      )[i];
    } else {
      let stringFinishingWithTitle = informationFromWebsite.split(
        informationFromWebsiteSplitted[i - 1]
      )[1];
      if (!stringFinishingWithTitle) {
        return '';
      }
      if (
        stringFinishingWithTitle.includes(informationFromWebsiteSplitted[i + 1])
      ) {
        title = stringFinishingWithTitle.split(
          informationFromWebsiteSplitted[i + 1]
        )[0];
      } else {
        title = stringFinishingWithTitle;
      }
    }
    return title;
  }

  private getChapter(
    informationFromWebsite: string,
    informationFromWebsiteSplitted: string[],
    i: number,
    chapter: string
  ) {
    let stringFinishingWithChapter = informationFromWebsite.split(
      informationFromWebsiteSplitted[i - 1]
    )[1];
    if (!stringFinishingWithChapter) {
      return '';
    }
    chapter = stringFinishingWithChapter.split(' ')[0];
    chapter = chapter
      .replace(':', '')
      .replace(',', '.')
      .replace('-', '.')
      .replace('_', '.');

    const chapterNumber = parseFloat(chapter);
    if (Number.isNaN(chapterNumber)) {
      return '';
    }
    return chapterNumber.toString();
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

  private async sendCrashReport(
    url: string,
    titleWebpage: string,
    error?: any
  ) {
    this.crashReport.execute(url, titleWebpage, error);
  }
}

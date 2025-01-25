import { websiteJson } from '../../pattern/link-format-website-title';
const titleIsHere: string = 't';
const chapterNumberIsHere: string = 'c';

export function retrieveTitleAndChapter(
  titleWebpage: string,
  url: string
): string[] {
  titleWebpage = removeBackSlashAndSpaceAtBeginning(titleWebpage);

  const webtoonParser: any = getParserForThisWebsite(url);
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
          title = getTitle(i, title, titleWebpage, titleSplitted);
        } else if (titleSplitted[i] === chapterNumberIsHere) {
          chapter = getChapter(titleWebpage, titleSplitted, i, chapter);
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
    return [];
  }
  return [];
}

function getTitle(
  i: number,
  title: string,
  titleWebpage: string,
  titleSplitted: string[]
) {
  if (i === 0) {
    title = titleWebpage.split(titleSplitted[i + 1])[i];
  } else {
    let stringFinishingWithTitle = titleWebpage.split(titleSplitted[i - 1])[1];
    title = stringFinishingWithTitle.split(titleSplitted[i + 1])[0];
  }
  return title;
}

function getChapter(
  titleWebpage: string,
  titleSplitted: string[],
  i: number,
  chapter: string
) {
  let stringFinishingWithChapter = titleWebpage.split(titleSplitted[i - 1])[1];
  if (!stringFinishingWithChapter) {
    return '';
  }
  chapter = stringFinishingWithChapter.split(' ')[0];
  chapter = chapter.replace(':', '');
  return chapter;
}

function removeBackSlashAndSpaceAtBeginning(titleWebpage: string) {
  titleWebpage = titleWebpage.replace('\n', '');
  if (titleWebpage[0] === ' ') {
    titleWebpage = titleWebpage.substring(1);
  }
  return titleWebpage;
}

function getParserForThisWebsite(url: string) {
  return Object.entries(websiteJson)
    .filter((website) => isMatchingWebsite(url, website))
    .map((website) => Object.entries(website[1]));
}

function isMatchingWebsite(url: string, website: any): boolean {
  return url.includes(website[0]);
}

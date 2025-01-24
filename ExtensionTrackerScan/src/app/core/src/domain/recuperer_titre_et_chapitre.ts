import { websiteJson } from '../../pattern/link-format-website-title';
const titleIsHere: string = 't';
const chapterNumberIsHere: string = 'c';

export function retrieveTitleAndChapter(
  titleWebpage: string,
  url: string
): string[] {
  const webtoonParser: any = getParserForThisWebsite(url);
  if (webtoonParser.length === 0) {
    return [];
  }
  const parser = webtoonParser[0][0][1].formatparse;

  let titleSplitted: string[] = parser.split('§');
  let title: string = '';
  let chapter: string = '';
  // console.log(titleSplitted);
  for (let i = 0; i < titleSplitted.length; i++) {
    if (titleSplitted[i] === titleIsHere) {
      if (i === 0) {
        title = titleWebpage.split(titleSplitted[i + 1])[i];
      } else {
        let stringFinishingWithTitle = titleWebpage.split(
          titleSplitted[i - 1]
        )[1];
        title = stringFinishingWithTitle.split(titleSplitted[i + 1])[0];
      }
    } else if (titleSplitted[i] === chapterNumberIsHere) {
      let stringFinishingWithChapter = titleWebpage.split(
        titleSplitted[i - 1]
      )[1];
      chapter = stringFinishingWithChapter.split(' ')[0];
    }
  }
  return [title, chapter];
}

function getParserForThisWebsite(url: string) {
  return Object.entries(websiteJson)
    .filter((website) => isMatchingWebsite(url, website))
    .map((website) => Object.entries(website[1]));
}

function isMatchingWebsite(url: string, website: any): boolean {
  return url.includes(website[0]);
}

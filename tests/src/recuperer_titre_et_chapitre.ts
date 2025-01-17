import websiteJson from "../pattern/link-format-website-title.json";

const titleIsHere = "t";
const chapterNumberIsHere = "c"

export function retrieveTitleAndChapter(titleWebpage: string, url: string): string[] {
  const parser = getParserForThisWebsite(url);
  let titleSplitted : string[] = parser.split("§");
  let title = "";
  let chapter = "";
  console.log(titleSplitted);
  for (let i = 0; i < titleSplitted.length; i++) {
    if(titleSplitted[i] === titleIsHere) {
      title = titleWebpage.split(titleSplitted[i+1])[i]
    }
    else if(titleSplitted[i] === chapterNumberIsHere) {
      let stringFinishingWithChapter = titleWebpage.split(titleSplitted[i-1])[1]
      chapter = stringFinishingWithChapter.split(" ")[0]
    }
  }
  return [title, chapter];
}


function getParserForThisWebsite(url: string): string {
  const webtoonParser = Object.entries(websiteJson)
    .filter(website => isMatchingWebsite(url, website))
    .map(website => Object.entries(website[1]));

  return webtoonParser[0][0][1].formatparse;
}

function isMatchingWebsite(url: string, website: any): boolean {
  return url.includes(website[0]);
}


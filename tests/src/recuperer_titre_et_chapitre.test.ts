import { retrieveTitleAndChapter } from "./recuperer_titre_et_chapitre";

describe("Should retrieve title and chapter ", () => {

  it("for the beginning on toonily", () => {
    expect(retrieveTitleAndChapter("The Beginning After the End Manga - Chapter 202 - Return to Ashber - Toonily"
      , "https://toonily.com/webtoon/beginning-after-end/chapter-202/"))
      .toEqual(["The Beginning After the End Manga", "202"]);
  });

  it("for life of a magic acadamy mage on asurascans", () => {
    expect(retrieveTitleAndChapter("Life of a Magic Academy Mage Chapter 111 - Asura Scans"
      , "https://asuracomic.net/series/life-of-a-magic-academy-mage-27f19aba/chapter/111"))
    .toEqual(["Life of a Magic Academy Mage", "111"]);
  });
});





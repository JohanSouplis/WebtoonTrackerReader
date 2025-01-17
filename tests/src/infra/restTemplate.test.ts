import { RestTemplate } from "./restTemplate";

describe("Should retrieve ", () => {
  let rest = new RestTemplate();
  it("title", async () => {
    
    return rest.recupererInformationsWebtoon("https://toonily.com/webtoon/beginning-after-end/chapter-202/").then((title) => {
        expect(title).toEqual("The Beginning After the End Manga - Chapter 202 - Return to Ashber - Toonily");
      });
  });
  it("title", async () => {
    return rest.recupererInformationsWebtoon("https://asuracomic.net/series/life-of-a-magic-academy-mage-27f19aba/chapter/111").then((title) => {
        expect(title).toEqual("Life of a Magic Academy Mage Chapter 111 - Asura Scans");
  
      });
  });
  it("title", async () => {
    return rest.recupererInformationsWebtoon("https://mangakakalot.com/chapter/pc935597/chapter_35").then((title) => {
        expect(title).toEqual("Rettougan No Tensei Majutsushi - Shiitagerareta Moto Yuusha Wa Mirai No Sekai O Yoyuu De Ikinuku (GIGATOON Studio) Chapter 35 - Mangakakalot.com");
      });
  });
});



export function getUrlNextChapter(url: string, chapter: string): string {
  const nextChapter = parseInt(chapter) + 1;
  return url.replace(chapter, nextChapter.toString());
}

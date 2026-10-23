import { ChapterWatch } from '../domain/chapter-watch';
import { ScanSnapshot } from '../domain/scan-library';
import { InMemoryChapterWatchRepository } from '../gateways/in-memory/in-memory-chapter-watch-repository.gateway';
import { InMemoryNewChapterAlerts } from '../gateways/in-memory/in-memory-new-chapter-alerts.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { ShowNewChapterCountUseCase } from './show-new-chapter-count.use-case';
import { aScan } from './scans.fixture';

describe('ShowNewChapterCountUseCase', () => {
  it('should count the favorites with a chapter after the last one read', async () => {
    const alerts = await countFor(
      [aFavorite('Solo Leveling', 100), aFavorite('Nano Machine', 50)],
      { 'Solo Leveling': newChapter(101), 'Nano Machine': newChapter(52) },
    );

    expect(alerts.counts).toEqual([2]);
  });

  it('should stop counting a new chapter once the reader has read it', async () => {
    const alerts = await countFor([aFavorite('Solo Leveling', 101)], {
      'Solo Leveling': newChapter(101),
    });

    expect(alerts.counts).toEqual([0]);
  });

  it('should not count a scan that is no longer a favorite', async () => {
    const alerts = await countFor(
      [{ ...aFavorite('Solo Leveling', 100), isFavorite: false }],
      { 'Solo Leveling': newChapter(101) },
    );

    expect(alerts.counts).toEqual([0]);
  });

  it('should not count a chapter found on another site than the last chapter read', async () => {
    const alerts = await countFor(
      [
        {
          ...aFavorite('Solo Leveling', 100),
          url: 'https://other-scans.org/solo-leveling/chapter-100',
        },
      ],
      { 'Solo Leveling': newChapter(101) },
    );

    expect(alerts.counts).toEqual([0]);
  });
});

const aFavorite = (title: string, chapter: number): ScanSnapshot =>
  aScan({
    title,
    chapter,
    url: `https://scans.org/${title}/chapter-${chapter}`,
    isFavorite: true,
  });

const newChapter = (latest: number): ChapterWatch => ({
  kind: 'new',
  site: 'scans.org',
  latest,
  foundAt: new Date('2026-10-23T10:00:00Z'),
  checkedAt: new Date('2026-10-23T10:00:00Z'),
});

const countFor = async (
  scans: ScanSnapshot[],
  watches: Readonly<Record<string, ChapterWatch>>,
): Promise<InMemoryNewChapterAlerts> => {
  const alerts = new InMemoryNewChapterAlerts();
  await new ShowNewChapterCountUseCase(
    new InMemoryScanRepository(scans),
    new InMemoryChapterWatchRepository(watches),
    alerts,
  ).execute();
  return alerts;
};

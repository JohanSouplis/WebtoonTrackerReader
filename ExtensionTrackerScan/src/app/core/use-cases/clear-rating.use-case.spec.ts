import { ScanNotFound } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { ClearRatingUseCase } from './clear-rating.use-case';
import { aScan } from './scans.fixture';

describe('ClearRatingUseCase', () => {
  it('should leave the scan unrated and keep its reading and favorite', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({
        title: 'Solo Leveling',
        chapter: 8,
        isFavorite: true,
        rating: 9,
      }),
    ]);

    const scans = await new ClearRatingUseCase(scanRepository).execute(
      ScanTitle.of('solo leveling'),
    );

    expect(scans).toEqual([
      aScan({ title: 'Solo Leveling', chapter: 8, isFavorite: true }),
    ]);
    expect(scans[0].rating).toBeUndefined();
    expect((await scanRepository.load()).snapshot()).toEqual(scans);
  });

  it('should fail with ScanNotFound when no scan has the title', async () => {
    await expect(
      new ClearRatingUseCase(
        new InMemoryScanRepository([aScan({ title: 'Solo Leveling' })]),
      ).execute(ScanTitle.of('Nano Machine')),
    ).rejects.toThrow(ScanNotFound);
  });
});

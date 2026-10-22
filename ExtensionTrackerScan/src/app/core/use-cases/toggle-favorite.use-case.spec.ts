import { ScanNotFound } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { ToggleFavoriteUseCase } from './toggle-favorite.use-case';
import { aScan } from './scans.fixture';

describe('ToggleFavoriteUseCase', () => {
  it('should mark the scan as favorite and keep its reading when it was not a favorite', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Title', chapter: 8, isFavorite: false }),
    ]);

    const scans = await new ToggleFavoriteUseCase(scanRepository).execute(
      ScanTitle.of('Title'),
    );

    expect(scans).toEqual([
      aScan({ title: 'Title', chapter: 8, isFavorite: true }),
    ]);
    expect((await scanRepository.load()).snapshot()).toEqual(scans);
  });

  it('should unmark the scan when it was a favorite', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Title', isFavorite: true }),
    ]);

    const scans = await new ToggleFavoriteUseCase(scanRepository).execute(
      ScanTitle.of('Title'),
    );

    expect(scans).toEqual([aScan({ title: 'Title', isFavorite: false })]);
  });

  it('should fail with ScanNotFound when no scan has the title', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Title' }),
    ]);

    await expect(
      new ToggleFavoriteUseCase(scanRepository).execute(ScanTitle.of('Other')),
    ).rejects.toThrow(ScanNotFound);
  });
});

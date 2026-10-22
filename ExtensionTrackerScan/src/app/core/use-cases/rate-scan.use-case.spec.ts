import { Rating } from '../domain/rating';
import { ScanNotFound } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { RateScanUseCase } from './rate-scan.use-case';
import { aScan } from './scans.fixture';

describe('RateScanUseCase', () => {
  it('should give the scan its first rating and keep its reading when it had none', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Title', chapter: 8 }),
    ]);

    const scans = await new RateScanUseCase(scanRepository).execute(
      ScanTitle.of('Title'),
      Rating.of(3),
    );

    expect(scans).toEqual([aScan({ title: 'Title', chapter: 8, rating: 3 })]);
    expect((await scanRepository.load()).snapshot()).toEqual(scans);
  });

  it('should replace the rating when the scan was already rated', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Title', chapter: 8, rating: 9 }),
    ]);

    const scans = await new RateScanUseCase(scanRepository).execute(
      ScanTitle.of('Title'),
      Rating.of(8),
    );

    expect(scans).toEqual([aScan({ title: 'Title', chapter: 8, rating: 8 })]);
  });

  it('should fail with ScanNotFound when no scan has the title', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Title' }),
    ]);

    await expect(
      new RateScanUseCase(scanRepository).execute(
        ScanTitle.of('Other'),
        Rating.of(5),
      ),
    ).rejects.toThrow(ScanNotFound);
  });
});

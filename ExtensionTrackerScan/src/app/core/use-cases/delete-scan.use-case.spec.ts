import { ScanNotFound } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { DeleteScanUseCase } from './delete-scan.use-case';
import { aScan } from './scans.fixture';

describe('DeleteScanUseCase', () => {
  it('should remove the scan with the same title whatever its chapter', async () => {
    const kept = aScan({ title: 'Solo leveling', chapter: 2 });
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: "Mount Hua Sect's Genius Phantom Swordsman", chapter: 3 }),
      kept,
    ]);

    const scans = await new DeleteScanUseCase(scanRepository).execute(
      ScanTitle.of("Mount Hua Sect's Genius Phantom Swordsman"),
    );

    expect(scans).toEqual([kept]);
    expect((await scanRepository.load()).snapshot()).toEqual([kept]);
  });

  it('should fail with ScanNotFound and keep every scan when no scan has the title', async () => {
    const followed = [
      aScan({ title: 'Genius phantom swordsman' }),
      aScan({ title: 'Solo leveling' }),
    ];
    const scanRepository = new InMemoryScanRepository(followed);

    await expect(
      new DeleteScanUseCase(scanRepository).execute(
        ScanTitle.of("Mount Hua Sect's Genius Phantom Swordsman"),
      ),
    ).rejects.toThrow(ScanNotFound);
    expect((await scanRepository.load()).snapshot()).toEqual(followed);
  });
});

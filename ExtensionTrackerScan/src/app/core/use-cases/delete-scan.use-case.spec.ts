import { Cover } from '../domain/cover';
import { ScanNotFound } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { InMemoryCoverRepository } from '../gateways/in-memory/in-memory-cover-repository.gateway';
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

    const scans = await new DeleteScanUseCase(
      scanRepository,
      new InMemoryCoverRepository(),
    ).execute(ScanTitle.of("Mount Hua Sect's Genius Phantom Swordsman"));

    expect(scans).toEqual([kept]);
    expect((await scanRepository.load()).snapshot()).toEqual([kept]);
  });

  it('should delete the cover of the series of the deleted scan and keep the others', async () => {
    const coverRepository = new InMemoryCoverRepository({
      'Solo Leveling': MISSING,
      'Nano Machine': MISSING,
    });

    await new DeleteScanUseCase(
      new InMemoryScanRepository([
        aScan({ title: 'Solo Leveling' }),
        aScan({ title: 'Nano Machine' }),
      ]),
      coverRepository,
    ).execute(ScanTitle.of('solo leveling'));

    expect(
      await coverRepository.find([
        ScanTitle.of('Solo Leveling'),
        ScanTitle.of('Nano Machine'),
      ]),
    ).toEqual(new Map([['Nano Machine', MISSING]]));
  });

  it('should fail with ScanNotFound and keep every scan and cover when no scan has the title', async () => {
    const followed = [
      aScan({ title: 'Genius phantom swordsman' }),
      aScan({ title: 'Solo leveling' }),
    ];
    const scanRepository = new InMemoryScanRepository(followed);
    const coverRepository = new InMemoryCoverRepository({
      "Mount Hua Sect's Genius Phantom Swordsman": MISSING,
    });

    await expect(
      new DeleteScanUseCase(scanRepository, coverRepository).execute(
        ScanTitle.of("Mount Hua Sect's Genius Phantom Swordsman"),
      ),
    ).rejects.toThrow(ScanNotFound);
    expect((await scanRepository.load()).snapshot()).toEqual(followed);
    expect(
      await coverRepository.find([
        ScanTitle.of("Mount Hua Sect's Genius Phantom Swordsman"),
      ]),
    ).toEqual(
      new Map([["Mount Hua Sect's Genius Phantom Swordsman", MISSING]]),
    );
  });
});

const MISSING: Cover = {
  kind: 'missing',
  triedAt: new Date('2025-03-10T12:00:00Z'),
};

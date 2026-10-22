import { ScanLibrary } from '../domain/scan-library';
import { aScan } from '../use-cases/scans.fixture';
import { ConsoleScanRepository } from './console-scan-repository.gateway';
import { InMemoryScanRepository } from './in-memory/in-memory-scan-repository.gateway';

describe('ConsoleScanRepository', () => {
  it('should save the library and log its message when a library is saved', async () => {
    const logs = jest.spyOn(console, 'log').mockImplementation(() => {});
    const scanRepository = new InMemoryScanRepository();
    const saved = [aScan({ title: 'Solo leveling' })];

    await new ConsoleScanRepository(scanRepository, 'scan is updated').save(
      ScanLibrary.restore(saved),
    );

    expect((await scanRepository.load()).snapshot()).toEqual(saved);
    expect(logs.mock.calls).toEqual([['scan is updated']]);
    logs.mockRestore();
  });
});

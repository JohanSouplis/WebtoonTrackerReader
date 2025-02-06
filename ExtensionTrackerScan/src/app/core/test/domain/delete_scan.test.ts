import { deleteScan } from '../../src/domain/delete_scan';
import { Scan } from '../../src/domain/scan.type';
import { createScanVisited } from './create_scan_visited.testhelper';

it('when removing a scan, if a scan have the same title, the scan is removed from the list of scans', () => {
  const scansResult: Scan[] = deleteScan(
    [
      createScanVisited(
        "Mount Hua Sect's Genius Phantom Swordsman",
        '3',
        'url2.com',
        'Sat Jun 03 2025 14:05:10 GMT+0100 (Central European Standard Time)'
      ),
      createScanVisited(
        'Solo leveling',
        '2',
        'url2.com',
        'Sat Jun 03 2024 14:05:10 GMT+0100 (Central European Standard Time)'
      ),
    ],
    createScanVisited(
      "Mount Hua Sect's Genius Phantom Swordsman",
      '1',
      'url.com',
      'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
    )
  );
  expect(scansResult.length).toEqual(1);
  expect(scansResult[0].title).toEqual('Solo leveling');
});

it('when removing a scan, if no scan have the same title, there is no scan that is removed from the list of scans', () => {
  const scansResult: Scan[] = deleteScan(
    [
      createScanVisited(
        'Genius phantom swordsman',
        '1',
        'url.com',
        'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
      ),
      createScanVisited(
        'Solo leveling',
        '2',
        'url2.com',
        'Sat Jun 03 2024 14:05:10 GMT+0100 (Central European Standard Time)'
      ),
    ],
    createScanVisited(
      "Mount Hua Sect's Genius Phantom Swordsman",
      '1',
      'url.com',
      'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
    )
  );
  expect(scansResult.length).toEqual(2);
});

import { Scan } from '../../src/domain/scan.type';
import {
  updateScansModifiedByUser,
  updateScansWithNewVisitedScan,
} from '../../src/domain/update_scans';
import { createScan, createScanVisited } from './create_scan_visited.test';
describe('When visiting a scan website, update the list of scans stored : ', () => {
  it('When there is no scans stored, one scan is added', () => {
    const scansResult: Scan[] = updateScansWithNewVisitedScan(
      [],
      createScanVisited(
        'Title',
        '8',
        'url.com',
        'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
      )
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('8');
    expect(scansResult[0].url).toEqual('url.com');
    expect(scansResult[0].whenWasItRead).toEqual(
      'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
    );
  });

  it('When its a new scan, one new scan is added to the list', () => {
    const scansResult: Scan[] = updateScansWithNewVisitedScan(
      [
        createScanVisited(
          'OldScanTitle',
          '8',
          'url.com',
          'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
        ),
      ],
      createScanVisited(
        'Title',
        '13',
        'url.com',
        'Sat Jan 01 2025 10:00:10 GMT+0100 (Central European Standard Time)'
      )
    );
    expect(scansResult.length).toEqual(2);
    expect(scansResult[1].title).toEqual('Title');
    expect(scansResult[1].chapter).toEqual('13');
    expect(scansResult[1].url).toEqual('url.com');
    expect(scansResult[1].whenWasItRead).toEqual(
      'Sat Jan 01 2025 10:00:10 GMT+0100 (Central European Standard Time)'
    );
  });

  describe('When its a scan of an existing scan ', () => {
    it('with a different chapter, the chapter is updated', () => {
      const scansResult: Scan[] = updateScansWithNewVisitedScan(
        [
          createScanVisited(
            'Title',
            '1',
            'url.com',
            'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
          ),
        ],
        createScanVisited(
          'Title',
          '2',
          'url.com',
          'Sat Jan 01 2025 10:00:10 GMT+0100 (Central European Standard Time)'
        )
      );
      expect(scansResult.length).toEqual(1);
      expect(scansResult[0].title).toEqual('Title');
      expect(scansResult[0].chapter).toEqual('2');
      expect(scansResult[0].url).toEqual('url.com');
      expect(scansResult[0].whenWasItRead).toEqual(
        'Sat Jan 01 2025 10:00:10 GMT+0100 (Central European Standard Time)'
      );
    });

    it('with a different chapter but it was seen before the one already known, then its not updated', () => {
      const scansResult: Scan[] = updateScansWithNewVisitedScan(
        [
          createScanVisited(
            'Title',
            '1',
            'url.com',
            'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
          ),
        ],
        createScanVisited(
          'Title',
          '2',
          'url.com',
          'Sat Jan 01 2022 10:00:10 GMT+0100 (Central European Standard Time)'
        )
      );
      expect(scansResult.length).toEqual(1);
      expect(scansResult[0].title).toEqual('Title');
      expect(scansResult[0].chapter).toEqual('1');
      expect(scansResult[0].url).toEqual('url.com');
      expect(scansResult[0].whenWasItRead).toEqual(
        'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
      );
    });

    it('with an empty chapter, the chapter is not updated', () => {
      const scansResult: Scan[] = updateScansWithNewVisitedScan(
        [
          createScanVisited(
            'Title',
            '1',
            'url.com',
            'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
          ),
        ],
        createScanVisited(
          'Title',
          '',
          'url.com',
          'Sat Jan 01 2025 10:00:10 GMT+0100 (Central European Standard Time)'
        )
      );
      expect(scansResult.length).toEqual(1);
      expect(scansResult[0].title).toEqual('Title');
      expect(scansResult[0].chapter).toEqual('1');
      expect(scansResult[0].url).toEqual('url.com');
      expect(scansResult[0].whenWasItRead).toEqual(
        'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
      );
    });

    describe('with a title close to be the same', () => {
      it('with only an apostroph of difference, the chapter and the title is updated', () => {
        const scansResult: Scan[] = updateScansWithNewVisitedScan(
          [
            createScanVisited(
              "Mount Hua Sect's Genius Phantom Swordsman",
              '1',
              'url.com',
              'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
            ),
          ],
          createScanVisited(
            'Mount Hua Sect’s Genius Phantom Swordsman',
            '2',
            'url.com',
            'Sat Jan 01 2025 10:00:10 GMT+0100 (Central European Standard Time)'
          )
        );
        expect(scansResult.length).toEqual(1);
        expect(scansResult[0].title).toEqual(
          "Mount Hua Sect's Genius Phantom Swordsman"
        );
        expect(scansResult[0].chapter).toEqual('2');
        expect(scansResult[0].url).toEqual('url.com');
        expect(scansResult[0].whenWasItRead).toEqual(
          'Sat Jan 01 2025 10:00:10 GMT+0100 (Central European Standard Time)'
        );
      });
      it('with capitalize letter at some part and not other, the chapter and the title is updated', () => {
        const scansResult: Scan[] = updateScansWithNewVisitedScan(
          [
            createScanVisited(
              'Mount Hua sect Genius',
              '1',
              'url.com',
              'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
            ),
          ],
          createScanVisited(
            'Mount hua Sect genius',
            '2',
            'url.com',
            'Sat Jan 01 2025 10:00:10 GMT+0100 (Central European Standard Time)'
          )
        );
        expect(scansResult.length).toEqual(1);
        expect(scansResult[0].title).toEqual('Mount hua Sect genius');
        expect(scansResult[0].chapter).toEqual('2');
        expect(scansResult[0].url).toEqual('url.com');
        expect(scansResult[0].whenWasItRead).toEqual(
          'Sat Jan 01 2025 10:00:10 GMT+0100 (Central European Standard Time)'
        );
      });
    });
  });

  it('When the title is empty, return the list of scans without changes', () => {
    const scansResult: Scan[] = updateScansWithNewVisitedScan(
      [
        createScanVisited(
          'Title',
          '1',
          'url.com',
          'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
        ),
      ],
      createScanVisited(
        '',
        '3',
        'url.com',
        'Sat Jan 01 2025 10:00:10 GMT+0100 (Central European Standard Time)'
      )
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('1');
    expect(scansResult[0].url).toEqual('url.com');
    expect(scansResult[0].whenWasItRead).toEqual(
      'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
    );
  });

  it('When the title is empty and the chapter as well, return the list of scans without changes', () => {
    const scansResult: Scan[] = updateScansWithNewVisitedScan(
      [
        createScanVisited(
          'Title',
          '1',
          'url.com',
          'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
        ),
      ],
      createScanVisited(
        '',
        '',
        'url.com',
        'Sat Jan 01 2025 10:00:10 GMT+0100 (Central European Standard Time)'
      )
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('1');
    expect(scansResult[0].url).toEqual('url.com');
    expect(scansResult[0].whenWasItRead).toEqual(
      'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
    );
  });

  it('When a scan with the same title exist but is missing url, update it with new url', () => {
    const scansResult: Scan[] = updateScansWithNewVisitedScan(
      [
        createScanVisited(
          'Title',
          '1',
          '',
          'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
        ),
      ],
      createScanVisited(
        'Title',
        '1',
        'url.com',
        'Sat Jan 01 2025 10:00:10 GMT+0100 (Central European Standard Time)'
      )
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('1');
    expect(scansResult[0].url).toEqual('url.com');
    expect(scansResult[0].whenWasItRead).toEqual(
      'Sat Jan 01 2025 10:00:10 GMT+0100 (Central European Standard Time)'
    );
  });

  it('When a scan with same title exist and already have favorite and rating, it doesnt change it', () => {
    const scansResult: Scan[] = updateScansWithNewVisitedScan(
      [
        createScan(
          'Title',
          '1',
          '',
          true,
          'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)',
          9
        ),
      ],
      createScanVisited(
        'Title',
        '1',
        'url.com',
        'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
      )
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('1');
    expect(scansResult[0].url).toEqual('url.com');
    expect(scansResult[0].whenWasItRead).toEqual(
      'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
    );
    expect(scansResult[0].isFavorite).toBeTruthy;
    expect(scansResult[0].rating).toEqual(9);
  });
});

describe('User change an information of a scan : ', () => {
  it('When changing the favorite, it is updated', () => {
    const scansResult: Scan[] = updateScansModifiedByUser(
      [
        createScan(
          'Title',
          '8',
          'url.com',
          false,
          'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
        ),
      ],
      createScan(
        'Title',
        '8',
        'url.com',
        true,
        'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
      )
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('8');
    expect(scansResult[0].url).toEqual('url.com');
    expect(scansResult[0].isFavorite).toBeTruthy;
    expect(scansResult[0].whenWasItRead).toEqual(
      'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
    );
  });
  it('When selecting a rating for the first time, the rating is update', () => {
    const scansResult: Scan[] = updateScansModifiedByUser(
      [
        createScan(
          'Title',
          '8',
          'url.com',
          false,
          'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
        ),
      ],
      createScan(
        'Title',
        '8',
        'url.com',
        false,
        'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)',
        3
      )
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('8');
    expect(scansResult[0].url).toEqual('url.com');
    expect(scansResult[0].isFavorite).toBeFalsy;
    expect(scansResult[0].whenWasItRead).toEqual(
      'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
    );
    expect(scansResult[0].rating).toEqual(3);
  });
  it('when selecting a new rating, it is updated', () => {
    const scansResult: Scan[] = updateScansModifiedByUser(
      [
        createScan(
          'Title',
          '8',
          'url.com',
          false,
          'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)',
          9
        ),
      ],
      createScan(
        'Title',
        '8',
        'url.com',
        false,
        'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)',
        8
      )
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('8');
    expect(scansResult[0].url).toEqual('url.com');
    expect(scansResult[0].isFavorite).toBeFalsy;
    expect(scansResult[0].whenWasItRead).toEqual(
      'Sat Jun 01 2024 14:05:10 GMT+0100 (Central European Standard Time)'
    );
    expect(scansResult[0].rating).toEqual(8);
  });
});

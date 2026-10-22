import { Scan } from '../../src/domain/scan.type';
import { updateScansModifiedByUser } from '../../src/domain/update_scans';
import { createScan } from './create_scan_visited.testhelper';

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

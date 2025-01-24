import { Scan } from '../../src/domain/scan.type';
import {
  updateScansModifiedByUser,
  updateScansWithNewVisitedScan,
} from '../../src/domain/update_scans';
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
        'Sat Jan 01 2022 10:00:10 GMT+0100 (Central European Standard Time)'
      )
    );
    expect(scansResult.length).toEqual(2);
    expect(scansResult[1].title).toEqual('Title');
    expect(scansResult[1].chapter).toEqual('13');
    expect(scansResult[1].url).toEqual('url.com');
    expect(scansResult[1].whenWasItRead).toEqual(
      'Sat Jan 01 2022 10:00:10 GMT+0100 (Central European Standard Time)'
    );
  });

  it('When its a scan of an existing scan with a different chapter, the chapter is updated', () => {
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
    expect(scansResult[0].chapter).toEqual('2');
    expect(scansResult[0].url).toEqual('url.com');
    expect(scansResult[0].whenWasItRead).toEqual(
      'Sat Jan 01 2022 10:00:10 GMT+0100 (Central European Standard Time)'
    );
  });

  it('When its a scan of an existing scan with an empty chapter, the chapter is not updated', () => {
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
        'Sat Jan 01 2022 10:00:10 GMT+0100 (Central European Standard Time)'
      )
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('1');
    expect(scansResult[0].url).toEqual('url.com');
    expect(scansResult[0].whenWasItRead).toEqual(
      'Sat Jan 01 2022 10:00:10 GMT+0100 (Central European Standard Time)'
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

function createScanVisited(
  title: string,
  chapter: string,
  url: string,
  whenWasItRead: string
): Scan {
  return {
    title: title,
    chapter: chapter,
    url: url,
    isFavorite: false,
    whenWasItRead: whenWasItRead,
  } as Scan;
}
function createScan(
  title: string,
  chapter: string,
  url: string,
  favorite: boolean,
  dateReading: string,
  rating?: number
): Scan {
  return {
    title: title,
    chapter: chapter,
    url: url,
    isFavorite: favorite,
    whenWasItRead: dateReading,
    rating: rating,
  } as Scan;
}

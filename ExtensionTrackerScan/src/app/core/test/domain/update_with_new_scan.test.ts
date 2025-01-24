import { Scan } from '../../src/domain/scan.type';
import { updateScansWithThisScan } from '../../src/domain/update_with_new_scan';
describe('When updating the list of scans stored', () => {
  it('if there is no scans stored, one scan is added', () => {
    const scansResult: Scan[] = updateScansWithThisScan(
      [],
      createScan('Title', '8', 'url.com')
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('8');
    expect(scansResult[0].url).toEqual('url.com');
  });

  it('if its a new scan, one new scan is added to the list', () => {
    const scansResult: Scan[] = updateScansWithThisScan(
      [createScan('OldScanTitle', '8', 'url.com')],
      createScan('Title', '13', 'url.com')
    );
    expect(scansResult.length).toEqual(2);
    expect(scansResult[1].title).toEqual('Title');
    expect(scansResult[1].chapter).toEqual('13');
    expect(scansResult[1].url).toEqual('url.com');
  });

  it('if its a scan of an existing scan with a different chapter, the chapter is updated', () => {
    const scansResult: Scan[] = updateScansWithThisScan(
      [createScan('Title', '1', 'url.com')],
      createScan('Title', '2', 'url.com')
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('2');
    expect(scansResult[0].url).toEqual('url.com');
  });

  it('if its a scan of an existing scan with a empty chapter, the chapter is not updated', () => {
    const scansResult: Scan[] = updateScansWithThisScan(
      [createScan('Title', '1', 'url.com')],
      createScan('Title', '', 'url.com')
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('1');
    expect(scansResult[0].url).toEqual('url.com');
  });

  it('if the title is empty, return the list of scans without changes', () => {
    const scansResult: Scan[] = updateScansWithThisScan(
      [createScan('Title', '1', 'url.com')],
      createScan('', '3', 'url.com')
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('1');
    expect(scansResult[0].url).toEqual('url.com');
  });

  it('if the title is empty and the chapter as well, return the list of scans without changes', () => {
    const scansResult: Scan[] = updateScansWithThisScan(
      [createScan('Title', '1', 'url.com')],
      createScan('', '', 'url.com')
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('1');
    expect(scansResult[0].url).toEqual('url.com');
  });

  it('if a scan with same title exist but is missing url, update it with new url', () => {
    const scansResult: Scan[] = updateScansWithThisScan(
      [createScan('Title', '1', '')],
      createScan('Title', '1', 'url.com')
    );
    expect(scansResult.length).toEqual(1);
    expect(scansResult[0].title).toEqual('Title');
    expect(scansResult[0].chapter).toEqual('1');
    expect(scansResult[0].url).toEqual('url.com');
  });
});

function createScan(title: string, chapter: string, url: string): Scan {
  return {
    title: title,
    chapter: chapter,
    url: url,
  } as Scan;
}

import { ReadingOrigin } from '../../../../core/domain/reading';
import { aScan } from '../../../../core/use-cases/scans.fixture';
import { toScanRow } from './scan-row.vm';

describe('toScanRow', () => {
  it('should offer to continue reading the last read chapter', () => {
    expect(
      toScanRow(aScan({ title: 'Solo Leveling', chapter: 38 }), {
        kind: 'quiet',
      }).readingHint,
    ).toBe('Continue reading Ch. 38');
  });

  it('should repeat a long title the row cuts before the reading hint', () => {
    const title = 'My School Life Pretending To Be a Worthless Person';

    expect(
      toScanRow(aScan({ title, chapter: 3 }), { kind: 'quiet' }).readingHint,
    ).toBe(`${title} · Continue reading Ch. 3`);
  });

  it('should hand the new chapter to the phone when a new chapter of a followed scan waits', () => {
    expect(
      toScanRow(
        aScan({
          title: 'Solo Leveling',
          chapter: 38,
          url: 'https://a.example/38',
        }),
        { kind: 'new', chapter: 39, url: 'https://a.example/39' },
      ).handoff,
    ).toEqual({
      title: 'Solo Leveling',
      chapterLabel: 'New · Ch. 39',
      url: 'https://a.example/39',
    });
  });

  it('should hand the last read chapter to the phone when no new chapter waits', () => {
    expect(
      toScanRow(
        aScan({
          title: 'Solo Leveling',
          chapter: 38,
          url: 'https://a.example/38',
        }),
        { kind: 'quiet' },
      ).handoff,
    ).toEqual({
      title: 'Solo Leveling',
      chapterLabel: 'Ch. 38',
      url: 'https://a.example/38',
    });
  });

  it('should tell the scan was last read on another device only when its reading came from one', () => {
    const readOnOtherDevice = (origin: ReadingOrigin) =>
      toScanRow(aScan({ origin }), { kind: 'quiet' }).readOnOtherDevice;

    expect(readOnOtherDevice('other-device')).toBe(true);
    expect(readOnOtherDevice('this-device')).toBe(false);
    expect(readOnOtherDevice('unknown')).toBe(false);
  });
});

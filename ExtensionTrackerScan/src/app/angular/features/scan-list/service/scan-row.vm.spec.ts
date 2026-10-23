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
});

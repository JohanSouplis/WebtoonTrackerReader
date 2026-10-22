import { SeriesKey } from './series-key';

export class ScanTitle {
  readonly seriesKey: SeriesKey;

  private constructor(readonly value: string) {
    this.seriesKey = SeriesKey.of(value);
  }

  static of(value: string): ScanTitle {
    return new ScanTitle(value);
  }

  static parse(text: string): ScanTitle | undefined {
    return text ? new ScanTitle(text.replace('’', "'")) : undefined;
  }

  equals(other: ScanTitle): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}

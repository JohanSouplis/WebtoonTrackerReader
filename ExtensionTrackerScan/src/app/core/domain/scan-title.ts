export class ScanTitle {
  private constructor(readonly value: string) {}

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

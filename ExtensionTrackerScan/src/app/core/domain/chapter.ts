export class Chapter {
  private constructor(readonly value: number) {}

  static of(value: number): Chapter {
    return new Chapter(value);
  }

  static parse(text: string): Chapter | undefined {
    const value = parseFloat(
      text
        .replace(':', '')
        .replace(',', '.')
        .replace('-', '.')
        .replace('_', '.'),
    );
    return Number.isNaN(value) ? undefined : new Chapter(value);
  }
}

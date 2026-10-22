export type SeriesMatch = 'same' | 'different' | 'ambiguous';

const ARTICLES = new Set(['the', 'a', 'an']);

const ROMAN_NUMERALS: Readonly<Record<string, string>> = {
  ii: '2',
  iii: '3',
  iv: '4',
  vi: '6',
  vii: '7',
  viii: '8',
  ix: '9',
};

const wordsOf = (title: string): string[] =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/×/g, ' x ')
    .replace(/&/g, ' and ')
    .replace(/['‘’ʼ`´]/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word !== '' && !ARTICLES.has(word))
    .map((word) => ROMAN_NUMERALS[word] ?? word);

const looseWordsOf = (words: readonly string[]): string[] =>
  words
    .filter((word) => word !== 'of')
    .map((word) => (word.length > 3 ? word.replace(/s$/, '') : word))
    .sort();

export class SeriesKey {
  private readonly compact: string;
  private readonly looseWords: readonly string[];

  private constructor(private readonly words: readonly string[]) {
    this.compact = words.join('');
    this.looseWords = looseWordsOf(words);
  }

  static of(title: string): SeriesKey {
    const words = wordsOf(title);
    return new SeriesKey(words.length > 0 ? words : [title]);
  }

  equals(other: SeriesKey): boolean {
    return this.words.join(' ') === other.words.join(' ');
  }

  match(other: SeriesKey): SeriesMatch {
    if (
      this.equals(other) ||
      this.compact === other.compact ||
      this.looseWords.join(' ') === other.looseWords.join(' ')
    ) {
      return 'same';
    }
    const [shorter, longer] =
      this.looseWords.length < other.looseWords.length
        ? [this.looseWords, other.looseWords]
        : [other.looseWords, this.looseWords];
    return shorter.every((word) => longer.indexOf(word) !== -1)
      ? 'ambiguous'
      : 'different';
  }
}

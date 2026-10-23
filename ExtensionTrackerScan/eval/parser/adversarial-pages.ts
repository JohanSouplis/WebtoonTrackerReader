import adversarialBlind from './captures/adversarial-blind.json';
import adversarialTune from './captures/adversarial-tune.json';
import sealed1 from './captures/sealed-1.json';
import { Expected } from './captured-pages';

type AdversarialCapture = {
  readonly url: string;
  readonly category: string;
  readonly expected: {
    readonly kind: string;
    readonly titles?: readonly string[];
    readonly chapters?: readonly number[];
  };
  readonly messages: readonly unknown[];
};

export type AdversarialPage = {
  readonly url: string;
  readonly category: string;
  readonly expected: Expected;
  readonly messages: readonly unknown[];
};

const adversarialPagesOf = (
  captures: readonly AdversarialCapture[],
): AdversarialPage[] =>
  captures.map(({ url, category, expected, messages }) => ({
    url,
    category,
    expected:
      expected.kind === 'reading'
        ? {
            kind: 'reading',
            titles: expected.titles ?? [],
            chapters: expected.chapters ?? [],
          }
        : { kind: 'other', reason: category },
    messages,
  }));

export const ADVERSARIAL_TUNE_PAGES: readonly AdversarialPage[] =
  adversarialPagesOf(adversarialTune.pages);

export const ADVERSARIAL_BLIND_PAGES: readonly AdversarialPage[] =
  adversarialPagesOf(adversarialBlind.pages);

export const SEALED_1_PAGES: readonly AdversarialPage[] = adversarialPagesOf(
  sealed1.pages,
);

export type RatePromptState =
  | { readonly kind: 'never-shown' }
  | {
      readonly kind: 'snoozed';
      readonly until: Date;
      readonly timesShown: number;
    }
  | { readonly kind: 'rated' }
  | { readonly kind: 'declined' };

export type RatePrompt = {
  readonly firstUsedAt: Date;
  readonly hasOpenedNewChapter: boolean;
  readonly state: RatePromptState;
};

export type RatePromptAnswer = 'rate' | 'not-now' | 'never';

export type RatingRequest = 'asked' | 'not-due';

export const RATE_PROMPT_RULES = {
  minScans: 10,
  minDaysOfUse: 7,
  snoozeDays: 30,
  maxPrompts: 3,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

const daysAfter = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * DAY_MS);

export const ratePromptOf = (
  stored: RatePrompt | undefined,
  now: Date,
): RatePrompt =>
  stored ?? {
    firstUsedAt: now,
    hasOpenedNewChapter: false,
    state: { kind: 'never-shown' },
  };

const hasServedTheReader = (
  { firstUsedAt, hasOpenedNewChapter }: RatePrompt,
  scanCount: number,
  now: Date,
): boolean =>
  hasOpenedNewChapter ||
  (scanCount >= RATE_PROMPT_RULES.minScans &&
    now >= daysAfter(firstUsedAt, RATE_PROMPT_RULES.minDaysOfUse));

const canAskAgain = (state: RatePromptState, now: Date): boolean => {
  switch (state.kind) {
    case 'never-shown':
      return true;
    case 'snoozed':
      return (
        now >= state.until && state.timesShown < RATE_PROMPT_RULES.maxPrompts
      );
    case 'rated':
    case 'declined':
      return false;
  }
};

const shouldAskForRating = (
  prompt: RatePrompt,
  scanCount: number,
  now: Date,
): boolean =>
  canAskAgain(prompt.state, now) && hasServedTheReader(prompt, scanCount, now);

const timesShownOf = (state: RatePromptState): number =>
  state.kind === 'snoozed' ? state.timesShown : 0;

const snoozed = (timesShown: number, now: Date): RatePromptState => ({
  kind: 'snoozed',
  until: daysAfter(now, RATE_PROMPT_RULES.snoozeDays),
  timesShown,
});

export const askForRating = (
  prompt: RatePrompt,
  scanCount: number,
  now: Date,
): { readonly request: RatingRequest; readonly prompt: RatePrompt } =>
  shouldAskForRating(prompt, scanCount, now)
    ? {
        request: 'asked',
        prompt: {
          ...prompt,
          state: snoozed(timesShownOf(prompt.state) + 1, now),
        },
      }
    : { request: 'not-due', prompt };

const ANSWERS: Record<
  RatePromptAnswer,
  (state: RatePromptState, now: Date) => RatePromptState
> = {
  rate: () => ({ kind: 'rated' }),
  never: () => ({ kind: 'declined' }),
  'not-now': (state, now) =>
    state.kind === 'rated' || state.kind === 'declined'
      ? state
      : snoozed(timesShownOf(state), now),
};

export const answerRatePrompt = (
  prompt: RatePrompt,
  answer: RatePromptAnswer,
  now: Date,
): RatePrompt => ({ ...prompt, state: ANSWERS[answer](prompt.state, now) });

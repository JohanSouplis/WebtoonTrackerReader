import { RatePrompt, RatePromptState } from '../domain/rate-prompt';
import { RatePromptRepository } from '../ports/rate-prompt-repository.port';

const RATE_PROMPT_KEY = 'rate-prompt';
const NEW_CHAPTER_OPENED_KEY = 'new-chapter-opened';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const dateOf = (value: unknown): Date | undefined => {
  const date = new Date(typeof value === 'string' ? value : NaN);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toState = (stored: unknown): RatePromptState | undefined => {
  if (!isRecord(stored)) {
    return undefined;
  }
  switch (stored['kind']) {
    case 'never-shown':
    case 'rated':
    case 'declined':
      return { kind: stored['kind'] };
    case 'snoozed': {
      const until = dateOf(stored['until']);
      const timesShown = stored['timesShown'];
      return until && typeof timesShown === 'number'
        ? { kind: 'snoozed', until, timesShown }
        : undefined;
    }
    default:
      return undefined;
  }
};

export class ChromeStorageRatePromptRepository implements RatePromptRepository {
  async load(): Promise<RatePrompt | undefined> {
    const items = await chrome.storage.local.get([
      RATE_PROMPT_KEY,
      NEW_CHAPTER_OPENED_KEY,
    ]);
    const stored: unknown = items[RATE_PROMPT_KEY];
    if (!isRecord(stored)) {
      return undefined;
    }
    const firstUsedAt = dateOf(stored['firstUsedAt']);
    const state = toState(stored['state']);
    return firstUsedAt && state
      ? {
          firstUsedAt,
          hasOpenedNewChapter: items[NEW_CHAPTER_OPENED_KEY] === true,
          state,
        }
      : undefined;
  }

  async save({ firstUsedAt, state }: RatePrompt): Promise<void> {
    await chrome.storage.local.set({
      [RATE_PROMPT_KEY]: {
        firstUsedAt: firstUsedAt.toISOString(),
        state:
          state.kind === 'snoozed'
            ? { ...state, until: state.until.toISOString() }
            : state,
      },
    });
  }

  async recordNewChapterOpened(): Promise<void> {
    await chrome.storage.local.set({ [NEW_CHAPTER_OPENED_KEY]: true });
  }
}

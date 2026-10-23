import { RatePrompt } from '../../domain/rate-prompt';

export const DEV_DUE_RATE_PROMPT: RatePrompt = {
  firstUsedAt: new Date('2025-01-02T09:00:00Z'),
  hasOpenedNewChapter: false,
  state: { kind: 'never-shown' },
};

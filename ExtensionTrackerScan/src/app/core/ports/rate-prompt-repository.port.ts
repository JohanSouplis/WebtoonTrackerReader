import { RatePrompt } from '../domain/rate-prompt';

export interface RatePromptRepository {
  load(): Promise<RatePrompt | undefined>;
  save(prompt: RatePrompt): Promise<void>;
  recordNewChapterOpened(): Promise<void>;
}

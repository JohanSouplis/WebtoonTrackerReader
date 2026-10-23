import { RatePrompt } from '../../domain/rate-prompt';
import { RatePromptRepository } from '../../ports/rate-prompt-repository.port';

export class InMemoryRatePromptRepository implements RatePromptRepository {
  private hasOpenedNewChapter: boolean;

  constructor(private prompt?: RatePrompt) {
    this.hasOpenedNewChapter = prompt?.hasOpenedNewChapter ?? false;
  }

  async load(): Promise<RatePrompt | undefined> {
    return (
      this.prompt && {
        ...this.prompt,
        hasOpenedNewChapter: this.hasOpenedNewChapter,
      }
    );
  }

  async save(prompt: RatePrompt): Promise<void> {
    this.prompt = prompt;
  }

  async recordNewChapterOpened(): Promise<void> {
    this.hasOpenedNewChapter = true;
  }
}

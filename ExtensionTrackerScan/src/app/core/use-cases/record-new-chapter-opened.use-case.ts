import { RatePromptRepository } from '../ports/rate-prompt-repository.port';

export class RecordNewChapterOpenedUseCase {
  constructor(private readonly ratePromptRepository: RatePromptRepository) {}

  execute(): Promise<void> {
    return this.ratePromptRepository.recordNewChapterOpened();
  }
}

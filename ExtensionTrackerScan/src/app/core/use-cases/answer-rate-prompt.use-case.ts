import {
  answerRatePrompt,
  RatePromptAnswer,
  ratePromptOf,
} from '../domain/rate-prompt';
import { ClockPort } from '../ports/clock.port';
import { RatePromptRepository } from '../ports/rate-prompt-repository.port';

export class AnswerRatePromptUseCase {
  constructor(
    private readonly ratePromptRepository: RatePromptRepository,
    private readonly clock: ClockPort,
  ) {}

  async execute(answer: RatePromptAnswer): Promise<void> {
    const now = this.clock.now();
    await this.ratePromptRepository.save(
      answerRatePrompt(
        ratePromptOf(await this.ratePromptRepository.load(), now),
        answer,
        now,
      ),
    );
  }
}

import {
  askForRating,
  ratePromptOf,
  RatingRequest,
} from '../domain/rate-prompt';
import { ClockPort } from '../ports/clock.port';
import { RatePromptRepository } from '../ports/rate-prompt-repository.port';
import { ScanRepository } from '../ports/scan-repository.port';

export class AskForRatingUseCase {
  constructor(
    private readonly ratePromptRepository: RatePromptRepository,
    private readonly scanRepository: ScanRepository,
    private readonly clock: ClockPort,
  ) {}

  async execute(): Promise<RatingRequest> {
    const now = this.clock.now();
    const { request, prompt } = askForRating(
      ratePromptOf(await this.ratePromptRepository.load(), now),
      (await this.scanRepository.load()).snapshot().length,
      now,
    );
    await this.ratePromptRepository.save(prompt);
    return request;
  }
}

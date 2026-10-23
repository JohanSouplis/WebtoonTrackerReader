import { ratePromptOf } from '../domain/rate-prompt';
import { ClockPort } from '../ports/clock.port';
import { RatePromptRepository } from '../ports/rate-prompt-repository.port';

export class RecordFirstUseUseCase {
  constructor(
    private readonly ratePromptRepository: RatePromptRepository,
    private readonly clock: ClockPort,
  ) {}

  async execute(): Promise<void> {
    await this.ratePromptRepository.save(
      ratePromptOf(await this.ratePromptRepository.load(), this.clock.now()),
    );
  }
}

import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryRatePromptRepository } from '../gateways/in-memory/in-memory-rate-prompt-repository.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { AskForRatingUseCase } from './ask-for-rating.use-case';
import { RecordNewChapterOpenedUseCase } from './record-new-chapter-opened.use-case';
import { aScan } from './scans.fixture';

describe('RecordNewChapterOpenedUseCase', () => {
  it('should ask for a rating at the next open once the reader opened a new chapter', async () => {
    const repository = new InMemoryRatePromptRepository();
    const askForRating = new AskForRatingUseCase(
      repository,
      new InMemoryScanRepository([aScan({ title: 'Solo Leveling' })]),
      new FixedClock(),
    );
    expect(await askForRating.execute()).toBe('not-due');

    await new RecordNewChapterOpenedUseCase(repository).execute();

    expect(await askForRating.execute()).toBe('asked');
  });
});

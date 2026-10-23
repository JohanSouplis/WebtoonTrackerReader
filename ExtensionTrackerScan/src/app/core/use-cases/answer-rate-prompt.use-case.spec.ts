import { RatePrompt, RatePromptAnswer } from '../domain/rate-prompt';
import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryRatePromptRepository } from '../gateways/in-memory/in-memory-rate-prompt-repository.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { AnswerRatePromptUseCase } from './answer-rate-prompt.use-case';
import { AskForRatingUseCase } from './ask-for-rating.use-case';
import { aScan } from './scans.fixture';

describe('AnswerRatePromptUseCase', () => {
  it.each`
    answer
    ${'rate'}
    ${'never'}
  `(
    'should never ask again when the reader answers $answer',
    async ({ answer }) => {
      const repository = await shownOn('2025-03-10');

      await answerAt(repository, '2025-03-10', answer);

      expect(await askAt(repository, '2026-03-10')).toBe('not-due');
    },
  );

  it('should ask again 30 days after the reader answered not now', async () => {
    const repository = await shownOn('2025-03-10');

    await answerAt(repository, '2025-03-20', 'not-now');

    expect(await askAt(repository, '2025-04-18')).toBe('not-due');
    expect(await askAt(repository, '2025-04-19')).toBe('asked');
  });

  it('should record the rating even when the prompt was never shown', async () => {
    const repository = new InMemoryRatePromptRepository();

    await answerAt(repository, '2025-03-10', 'rate');

    expect(await repository.load()).toEqual({
      firstUsedAt: new Date('2025-03-10T12:00:00Z'),
      hasOpenedNewChapter: false,
      state: { kind: 'rated' },
    });
  });

  it('should keep a rating when not now comes after it', async () => {
    const repository = await shownOn('2025-03-10');
    await answerAt(repository, '2025-03-10', 'rate');

    await answerAt(repository, '2025-03-10', 'not-now');

    expect(await askAt(repository, '2026-03-10')).toBe('not-due');
  });
});

const SERVED_READER: RatePrompt = {
  firstUsedAt: new Date('2025-01-01T12:00:00Z'),
  hasOpenedNewChapter: true,
  state: { kind: 'never-shown' },
};

const clockAt = (day: string) => new FixedClock(new Date(`${day}T12:00:00Z`));

const askAt = (repository: InMemoryRatePromptRepository, day: string) =>
  new AskForRatingUseCase(
    repository,
    new InMemoryScanRepository([aScan({ title: 'Solo Leveling' })]),
    clockAt(day),
  ).execute();

const shownOn = async (day: string) => {
  const repository = new InMemoryRatePromptRepository(SERVED_READER);
  expect(await askAt(repository, day)).toBe('asked');
  return repository;
};

const answerAt = (
  repository: InMemoryRatePromptRepository,
  day: string,
  answer: RatePromptAnswer,
) => new AnswerRatePromptUseCase(repository, clockAt(day)).execute(answer);

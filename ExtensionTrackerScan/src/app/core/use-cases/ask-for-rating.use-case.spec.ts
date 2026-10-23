import { RatePrompt } from '../domain/rate-prompt';
import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryRatePromptRepository } from '../gateways/in-memory/in-memory-rate-prompt-repository.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { AskForRatingUseCase } from './ask-for-rating.use-case';
import { aScan } from './scans.fixture';

describe('AskForRatingUseCase', () => {
  it('should not ask on the first open and count the days of use from it', async () => {
    const repository = new InMemoryRatePromptRepository();

    const request = await askAt(repository, '2025-03-10', 40);

    expect(request).toBe('not-due');
    expect(await repository.load()).toEqual(
      firstUsed('2025-03-10', { kind: 'never-shown' }),
    );
  });

  it.each`
    scanCount | firstUsedAt     | request
    ${10}     | ${'2025-03-03'} | ${'asked'}
    ${9}      | ${'2025-03-03'} | ${'not-due'}
    ${10}     | ${'2025-03-04'} | ${'not-due'}
  `(
    'should ask only once the reader tracks 10 scans for 7 days: $scanCount scans since $firstUsedAt',
    async ({ scanCount, firstUsedAt, request }) => {
      const repository = new InMemoryRatePromptRepository(
        firstUsed(firstUsedAt, { kind: 'never-shown' }),
      );

      expect(await askAt(repository, '2025-03-10', scanCount)).toBe(request);
    },
  );

  it('should ask a reader who opened a new chapter, whatever the scans and days', async () => {
    const repository = new InMemoryRatePromptRepository(
      firstUsed('2025-03-10', { kind: 'never-shown' }),
    );
    await repository.recordNewChapterOpened();

    expect(await askAt(repository, '2025-03-10', 1)).toBe('asked');
  });

  it('should not ask again at the next open when the prompt was shown and left unanswered', async () => {
    const repository = new InMemoryRatePromptRepository(
      firstUsed('2025-01-01', { kind: 'never-shown' }),
    );

    await askAt(repository, '2025-03-10', 20);

    expect(await askAt(repository, '2025-03-10', 20)).toBe('not-due');
    expect(await askAt(repository, '2025-04-08', 20)).toBe('not-due');
    expect(await askAt(repository, '2025-04-09', 20)).toBe('asked');
  });

  it('should never ask more than 3 times', async () => {
    const repository = new InMemoryRatePromptRepository(
      firstUsed('2025-01-01', { kind: 'never-shown' }),
    );

    const requests = [
      await askAt(repository, '2025-03-10', 20),
      await askAt(repository, '2025-04-10', 20),
      await askAt(repository, '2025-05-10', 20),
      await askAt(repository, '2025-06-10', 20),
      await askAt(repository, '2026-06-10', 20),
    ];

    expect(requests).toEqual(['asked', 'asked', 'asked', 'not-due', 'not-due']);
  });

  it.each`
    state
    ${{ kind: 'rated' }}
    ${{ kind: 'declined' }}
  `(
    'should never ask again once the reader answered for good: $state.kind',
    async ({ state }) => {
      const repository = new InMemoryRatePromptRepository(
        firstUsed('2024-01-01', state),
      );

      expect(await askAt(repository, '2026-01-01', 200)).toBe('not-due');
    },
  );
});

const firstUsed = (day: string, state: RatePrompt['state']): RatePrompt => ({
  firstUsedAt: new Date(`${day}T12:00:00Z`),
  hasOpenedNewChapter: false,
  state,
});

const askAt = (
  repository: InMemoryRatePromptRepository,
  day: string,
  scanCount: number,
) =>
  new AskForRatingUseCase(
    repository,
    new InMemoryScanRepository(
      Array.from({ length: scanCount }, (_, index) =>
        aScan({ title: `Scan ${index}` }),
      ),
    ),
    new FixedClock(new Date(`${day}T12:00:00Z`)),
  ).execute();

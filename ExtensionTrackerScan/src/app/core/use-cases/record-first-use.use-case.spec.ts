import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryRatePromptRepository } from '../gateways/in-memory/in-memory-rate-prompt-repository.gateway';
import { RecordFirstUseUseCase } from './record-first-use.use-case';

describe('RecordFirstUseUseCase', () => {
  it('should count the days of use from the install', async () => {
    const repository = new InMemoryRatePromptRepository();

    await recordFirstUseAt(repository, '2025-03-10T12:00:00Z');

    expect(await repository.load()).toEqual({
      firstUsedAt: new Date('2025-03-10T12:00:00Z'),
      hasOpenedNewChapter: false,
      state: { kind: 'never-shown' },
    });
  });

  it('should keep the first use already known when it runs again', async () => {
    const repository = new InMemoryRatePromptRepository();
    await recordFirstUseAt(repository, '2025-03-10T12:00:00Z');

    await recordFirstUseAt(repository, '2025-04-10T12:00:00Z');

    expect((await repository.load())?.firstUsedAt).toEqual(
      new Date('2025-03-10T12:00:00Z'),
    );
  });
});

const recordFirstUseAt = (
  repository: InMemoryRatePromptRepository,
  date: string,
) =>
  new RecordFirstUseUseCase(
    repository,
    new FixedClock(new Date(date)),
  ).execute();

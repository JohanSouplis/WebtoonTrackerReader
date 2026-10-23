import { RatePrompt } from '../domain/rate-prompt';
import { ChromeStorageRatePromptRepository } from './chrome-storage-rate-prompt-repository.gateway';
import { FakeChromeStorage, installChrome } from './fake-chrome.fixture';

describe('ChromeStorageRatePromptRepository', () => {
  it('should load the prompt it saved, dates included', async () => {
    useStorage({});
    const repository = new ChromeStorageRatePromptRepository();

    await repository.save(SNOOZED);

    expect(await repository.load()).toEqual(SNOOZED);
  });

  it.each`
    stored
    ${undefined}
    ${{ firstUsedAt: 'yesterday', state: { kind: 'never-shown' } }}
    ${{ firstUsedAt: '2025-03-10T12:00:00.000Z', state: { kind: 'snoozed' } }}
    ${{ firstUsedAt: '2025-03-10T12:00:00.000Z', state: { kind: 'later' } }}
  `(
    'should know no prompt when none it can read is stored: $stored',
    async ({ stored }) => {
      useStorage({ 'rate-prompt': stored });

      expect(await new ChromeStorageRatePromptRepository().load()).toBe(
        undefined,
      );
    },
  );

  it('should keep the opened new chapter when a prompt loaded before it is saved', async () => {
    useStorage({});
    const repository = new ChromeStorageRatePromptRepository();
    await repository.save(SNOOZED);
    const loadedBefore = await repository.load();

    await repository.recordNewChapterOpened();
    await repository.save({ ...SNOOZED, ...loadedBefore });

    expect(await repository.load()).toEqual({
      ...SNOOZED,
      hasOpenedNewChapter: true,
    });
  });
});

const SNOOZED: RatePrompt = {
  firstUsedAt: new Date('2025-03-10T12:00:00Z'),
  hasOpenedNewChapter: false,
  state: {
    kind: 'snoozed',
    until: new Date('2025-04-09T12:00:00Z'),
    timesShown: 1,
  },
};

const useStorage = (items: Record<string, unknown>): FakeChromeStorage => {
  const storage = new FakeChromeStorage(items);
  installChrome({ storage: { local: storage } });
  return storage;
};

import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Cover, Thumbnail } from '../../../../../../core/domain/cover';
import { RatePrompt } from '../../../../../../core/domain/rate-prompt';
import { ScanLibrary } from '../../../../../../core/domain/scan-library';
import { ScanTitle } from '../../../../../../core/domain/scan-title';
import { FixedClock } from '../../../../../../core/gateways/in-memory/fixed-clock.gateway';
import { InMemoryChapterWatchRepository } from '../../../../../../core/gateways/in-memory/in-memory-chapter-watch-repository.gateway';
import { InMemoryCoverRepository } from '../../../../../../core/gateways/in-memory/in-memory-cover-repository.gateway';
import { InMemoryRatePromptRepository } from '../../../../../../core/gateways/in-memory/in-memory-rate-prompt-repository.gateway';
import { InMemoryScanRepository } from '../../../../../../core/gateways/in-memory/in-memory-scan-repository.gateway';
import { InMemoryWatchSettingsRepository } from '../../../../../../core/gateways/in-memory/in-memory-watch-settings-repository.gateway';
import { AnswerRatePromptUseCase } from '../../../../../../core/use-cases/answer-rate-prompt.use-case';
import { AskForRatingUseCase } from '../../../../../../core/use-cases/ask-for-rating.use-case';
import { ChangeCheckIntervalUseCase } from '../../../../../../core/use-cases/change-check-interval.use-case';
import { ClearRatingUseCase } from '../../../../../../core/use-cases/clear-rating.use-case';
import { DeleteScanUseCase } from '../../../../../../core/use-cases/delete-scan.use-case';
import { RateScanUseCase } from '../../../../../../core/use-cases/rate-scan.use-case';
import { RecordNewChapterOpenedUseCase } from '../../../../../../core/use-cases/record-new-chapter-opened.use-case';
import { RestoreScanUseCase } from '../../../../../../core/use-cases/restore-scan.use-case';
import { aScan } from '../../../../../../core/use-cases/scans.fixture';
import { ToggleFavoriteUseCase } from '../../../../../../core/use-cases/toggle-favorite.use-case';
import {
  CHAPTER_WATCH_REPOSITORY,
  CLOCK,
  COVER_BACKFILL,
  COVER_REPOSITORY,
  NOTIFICATION_PERMISSION,
  SCAN_REPOSITORY,
  STORE_LISTING,
  WATCH_SETTINGS_REPOSITORY,
} from '../../../../../injection-tokens';
import { InMemoryCoverBackfill } from '../../../gateways/in-memory-cover-backfill.gateway';
import { InMemoryNotificationPermission } from '../../../gateways/in-memory-notification-permission.gateway';
import { CoverBackfillPort } from '../../../service/cover-backfill.port';
import { ScanListPage } from './scan-list.page';

describe('ScanListPage', () => {
  it('should show the stored cover of a shown scan and ask to search the covers of the others', async () => {
    const coverBackfill = new InMemoryCoverBackfill();
    await renderPage(
      new InMemoryScanRepository([
        aScan({ title: 'Solo Leveling' }),
        aScan({ title: 'Omniscient Reader' }),
      ]),
      {
        coverRepository: new InMemoryCoverRepository({
          'Solo Leveling': FOUND,
        }),
        coverBackfill,
      },
    );

    expect(
      await within(await rowOf('Solo Leveling')).findByRole('presentation'),
    ).toHaveAttribute('src', THUMBNAIL.dataUrl);
    expect(coverBackfill.requests).toEqual([['Omniscient Reader']]);
  });

  it('should show the cover the search found without reopening the list', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Solo Leveling' }),
    ]);
    const coverRepository = new InMemoryCoverRepository();
    await renderPage(scanRepository, {
      coverRepository,
      coverBackfill: {
        backfillCovers: async (titles, onCoverSaved) => {
          await Promise.all(
            titles.map((title) =>
              coverRepository.update(ScanTitle.of(title), () => FOUND),
            ),
          );
          onCoverSaved();
        },
      },
    });

    expect(
      await within(await rowOf('Solo Leveling')).findByRole('presentation'),
    ).toHaveAttribute('src', THUMBNAIL.dataUrl);
  });

  it('should show each cover as soon as the search saves it, before the search ends', async () => {
    const coverRepository = new InMemoryCoverRepository();
    await renderPage(
      new InMemoryScanRepository([
        aScan({ title: 'Solo Leveling' }),
        aScan({ title: 'Omniscient Reader' }),
      ]),
      {
        coverRepository,
        coverBackfill: {
          backfillCovers: async (_titles, onCoverSaved) => {
            await coverRepository.update(
              ScanTitle.of('Solo Leveling'),
              () => FOUND,
            );
            onCoverSaved();
            await new Promise<never>(() => undefined);
          },
        },
      },
    );

    expect(
      await within(await rowOf('Solo Leveling')).findByRole('presentation'),
    ).toHaveAttribute('src', THUMBNAIL.dataUrl);
  });

  it('should show the new chapter of a favorite and link it', async () => {
    await renderPage(
      new InMemoryScanRepository([
        aScan({
          title: 'Solo Leveling',
          chapter: 100,
          url: 'https://scans.org/solo-leveling/chapter-100',
          isFavorite: true,
        }),
      ]),
      {
        watchRepository: new InMemoryChapterWatchRepository({
          'Solo Leveling': {
            kind: 'new',
            site: 'scans.org',
            latest: 101,
            url: 'https://scans.org/solo-leveling/chapter-101',
            foundAt: new Date('2025-03-10T10:00:00Z'),
            checkedAt: new Date('2025-03-10T10:00:00Z'),
          },
        }),
      },
    );

    expect(
      within(await rowOf('Solo Leveling')).getByRole('link', {
        name: 'New · Ch. 101',
      }),
    ).toHaveAttribute('href', 'https://scans.org/solo-leveling/chapter-101');
  });

  it('should not ask for a rating on the first open of the library', async () => {
    await renderPage(new InMemoryScanRepository(TWELVE_SCANS));

    expect(await screen.findByText('12 series')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Enjoying Scan Tracker?' }),
    ).not.toBeInTheDocument();
  });

  it('should record the rating, then open the reviews, when a served reader clicks Rate it', async () => {
    const ratePromptRepository = new InMemoryRatePromptRepository(
      SERVED_READER,
    );
    const statesWhenOpened: unknown[] = [];
    await renderPage(new InMemoryScanRepository(TWELVE_SCANS), {
      ratePromptRepository,
      openReviews: async () =>
        statesWhenOpened.push((await ratePromptRepository.load())?.state),
    });

    await userEvent.click(
      within(
        await screen.findByRole('region', { name: 'Enjoying Scan Tracker?' }),
      ).getByRole('button', { name: 'Rate it' }),
    );

    await waitFor(() => expect(statesWhenOpened).toEqual([{ kind: 'rated' }]));
    expect(
      screen.queryByRole('region', { name: 'Enjoying Scan Tracker?' }),
    ).not.toBeInTheDocument();
  });

  it('should hide the prompt, focus the list and not open the reviews when Not now is clicked', async () => {
    const openReviews = jest.fn();
    await renderPage(new InMemoryScanRepository(TWELVE_SCANS), {
      ratePromptRepository: new InMemoryRatePromptRepository(SERVED_READER),
      openReviews,
    });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Not now' }),
    );

    expect(
      screen.queryByRole('region', { name: 'Enjoying Scan Tracker?' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Library' })).toHaveFocus();
    expect(openReviews).not.toHaveBeenCalled();
  });

  it('should remember that the reader opened a new chapter', async () => {
    const ratePromptRepository = new InMemoryRatePromptRepository();
    await renderPage(
      new InMemoryScanRepository([
        aScan({
          title: 'Solo Leveling',
          chapter: 100,
          url: 'https://scans.org/solo-leveling/chapter-100',
          isFavorite: true,
        }),
      ]),
      {
        ratePromptRepository,
        watchRepository: new InMemoryChapterWatchRepository({
          'Solo Leveling': {
            kind: 'new',
            site: 'scans.org',
            latest: 101,
            url: 'https://scans.org/solo-leveling/chapter-101',
            foundAt: new Date('2025-03-10T10:00:00Z'),
            checkedAt: new Date('2025-03-10T10:00:00Z'),
          },
        }),
      },
    );

    await userEvent.click(
      await within(await rowOf('Solo Leveling')).findByRole('link', {
        name: 'New · Ch. 101',
      }),
    );

    expect((await ratePromptRepository.load())?.hasOpenedNewChapter).toBe(true);
  });

  it('should check favorites once a day when the reader chooses it', async () => {
    const settingsRepository = new InMemoryWatchSettingsRepository();
    await renderPage(
      new InMemoryScanRepository([aScan({ title: 'Solo Leveling' })]),
      { settingsRepository },
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Checks every 6 hours · Alerts off',
      }),
    );
    await userEvent.click(
      screen.getByRole('menuitemradio', { name: 'Once a day' }),
    );

    expect(
      await screen.findByRole('button', {
        name: 'Checks once a day · Alerts off',
      }),
    ).toBeInTheDocument();
    expect(await settingsRepository.load()).toEqual({ checkEvery: '24h' });
  });

  it('should turn alerts on only when the browser grants them, and explain a refusal', async () => {
    const notificationPermission = new InMemoryNotificationPermission(
      false,
      false,
    );
    await renderPage(
      new InMemoryScanRepository([aScan({ title: 'Solo Leveling' })]),
      { notificationPermission },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /^Checks / }),
    );
    await userEvent.click(
      screen.getByRole('menuitemcheckbox', { name: 'Desktop alerts' }),
    );
    await userEvent.click(screen.getByRole('button', { name: /^Checks / }));

    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Desktop alerts' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(await notificationPermission.isGranted()).toBe(false);
    expect(
      await screen.findByText(/^Chrome didn't allow notifications/),
    ).toBeInTheDocument();
  });

  it('should show a scan under Following only and save it when its bell is clicked', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Solo Leveling' }),
      aScan({ title: 'Omniscient Reader' }),
    ]);
    await renderPage(scanRepository);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Follow Solo Leveling' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Following only' }),
    );

    expect(
      await screen.findByRole('link', { name: 'Solo Leveling' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Omniscient Reader' }),
    ).not.toBeInTheDocument();
    expect((await scanRepository.load()).snapshot()).toEqual([
      aScan({ title: 'Solo Leveling', isFavorite: true }),
      aScan({ title: 'Omniscient Reader' }),
    ]);
  });

  it('should remove a scan from the list and the library and keep the title filter when its delete button is clicked', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'SSS-Class Suicide Hunter' }),
      aScan({ title: 'Return of the SSS-Class Ranker' }),
      aScan({ title: 'Omniscient Reader' }),
    ]);
    await renderPage(scanRepository);
    await userEvent.type(
      await screen.findByRole('searchbox', { name: 'Filter by title' }),
      'sss',
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete SSS-Class Suicide Hunter' }),
    );

    expect(
      await screen.findByRole('link', {
        name: 'Return of the SSS-Class Ranker',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'SSS-Class Suicide Hunter' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Omniscient Reader' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('1 series')).toBeInTheDocument();
    expect((await scanRepository.load()).snapshot()).toEqual([
      aScan({ title: 'Return of the SSS-Class Ranker' }),
      aScan({ title: 'Omniscient Reader' }),
    ]);
  });

  it('should confirm what following and unfollowing a series does', async () => {
    await renderPage(
      new InMemoryScanRepository([aScan({ title: 'Solo Leveling' })]),
    );
    const follow = await screen.findByRole('button', {
      name: 'Follow Solo Leveling',
    });

    await userEvent.click(follow);
    expect(
      await screen.findByText(
        "Following “Solo Leveling”. We'll check for new chapters.",
      ),
    ).toBeInTheDocument();
    await userEvent.click(follow);

    expect(
      await screen.findByText(
        'Stopped checking “Solo Leveling” for new chapters.',
      ),
    ).toBeInTheDocument();
  });

  it('should bring a deleted scan back with its favorite when Undo is clicked', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Solo Leveling', isFavorite: true }),
      aScan({ title: 'Omniscient Reader' }),
    ]);
    await renderPage(scanRepository);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete Solo Leveling' }),
    );
    expect(
      await screen.findByText('Removed “Solo Leveling”'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Solo Leveling' }),
    ).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }));

    expect(
      await screen.findByRole('link', { name: 'Solo Leveling' }),
    ).toBeInTheDocument();
    expect((await scanRepository.load()).snapshot()).toEqual([
      aScan({ title: 'Omniscient Reader' }),
      aScan({ title: 'Solo Leveling', isFavorite: true }),
    ]);
  });

  it('should save a scan unrated when its rating is cleared', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Solo Leveling', rating: 9 }),
    ]);
    await renderPage(scanRepository);

    await userEvent.click(
      await screen.findByRole('button', { name: /^Rating for Solo Leveling/ }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Clear rating' }),
    );

    expect(
      await screen.findByRole('button', {
        name: 'Rating for Solo Leveling: not rated',
      }),
    ).toBeInTheDocument();
    expect((await scanRepository.load()).snapshot()).toEqual([
      aScan({ title: 'Solo Leveling' }),
    ]);
  });

  it('should load the library again when Retry is clicked after a failed load', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Solo Leveling' }),
    ]);
    jest
      .spyOn(scanRepository, 'load')
      .mockRejectedValueOnce(new Error('storage unavailable'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await renderPage(scanRepository);

    expect(
      await screen.findByText("Couldn't load your library"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('searchbox', { name: 'Filter by title' }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('link', { name: 'Solo Leveling' }),
    ).toBeInTheDocument();
  });

  it('should hide the filters, the sort and the checks when the library is empty', async () => {
    await renderPage(new InMemoryScanRepository([]));

    expect(
      await screen.findByRole('heading', { name: 'No series yet' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('searchbox', { name: 'Filter by title' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('group', { name: 'Sort by' }),
    ).not.toBeInTheDocument();
  });

  it('should tell the reader and refresh the list when the scan was already removed elsewhere', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Solo Leveling' }),
      aScan({ title: 'Omniscient Reader' }),
    ]);
    await renderPage(scanRepository);
    const deleteSoloLeveling = await screen.findByRole('button', {
      name: 'Delete Solo Leveling',
    });
    await scanRepository.save(
      ScanLibrary.restore([aScan({ title: 'Omniscient Reader' })]),
    );

    await userEvent.click(deleteSoloLeveling);

    expect(
      await screen.findByText(
        'This series is no longer in your library. The list is up to date.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Solo Leveling' }),
    ).not.toBeInTheDocument();
  });
});

const thumbnail = (): Thumbnail => {
  const parsed = Thumbnail.parse('data:image/webp;base64,UklGRg==');
  if (!parsed) {
    throw new Error('The thumbnail does not parse');
  }
  return parsed;
};

const THUMBNAIL = thumbnail();

const TWELVE_SCANS = Array.from({ length: 12 }, (_, index) =>
  aScan({ title: `Scan ${index + 1}` }),
);

const SERVED_READER: RatePrompt = {
  firstUsedAt: new Date('2025-01-01T12:00:00Z'),
  hasOpenedNewChapter: false,
  state: { kind: 'never-shown' },
};

const FOUND: Cover = {
  kind: 'found',
  thumbnail: THUMBNAIL,
  from: 'page',
  at: new Date('2025-03-10T12:00:00Z'),
};

const rowOf = async (title: string): Promise<HTMLElement> => {
  const link = await screen.findByRole('link', { name: title });
  const row = link.closest('li');
  if (!row) {
    throw new Error(`No row for ${title}`);
  }
  return row;
};

const renderPage = (
  scanRepository: InMemoryScanRepository,
  {
    coverRepository = new InMemoryCoverRepository(),
    coverBackfill = new InMemoryCoverBackfill(),
    watchRepository = new InMemoryChapterWatchRepository(),
    settingsRepository = new InMemoryWatchSettingsRepository(),
    notificationPermission = new InMemoryNotificationPermission(),
    ratePromptRepository = new InMemoryRatePromptRepository(),
    openReviews = jest.fn(),
  }: {
    coverRepository?: InMemoryCoverRepository;
    coverBackfill?: CoverBackfillPort;
    watchRepository?: InMemoryChapterWatchRepository;
    settingsRepository?: InMemoryWatchSettingsRepository;
    notificationPermission?: InMemoryNotificationPermission;
    ratePromptRepository?: InMemoryRatePromptRepository;
    openReviews?: () => void;
  } = {},
) =>
  render(ScanListPage, {
    providers: [
      provideNoopAnimations(),
      { provide: SCAN_REPOSITORY, useValue: scanRepository },
      { provide: COVER_REPOSITORY, useValue: coverRepository },
      { provide: COVER_BACKFILL, useValue: coverBackfill },
      { provide: CHAPTER_WATCH_REPOSITORY, useValue: watchRepository },
      { provide: WATCH_SETTINGS_REPOSITORY, useValue: settingsRepository },
      { provide: NOTIFICATION_PERMISSION, useValue: notificationPermission },
      { provide: CLOCK, useValue: new FixedClock() },
      {
        provide: ChangeCheckIntervalUseCase,
        useValue: new ChangeCheckIntervalUseCase(settingsRepository),
      },
      {
        provide: DeleteScanUseCase,
        useValue: new DeleteScanUseCase(
          scanRepository,
          coverRepository,
          watchRepository,
        ),
      },
      {
        provide: RestoreScanUseCase,
        useValue: new RestoreScanUseCase(
          scanRepository,
          coverRepository,
          watchRepository,
        ),
      },
      {
        provide: ToggleFavoriteUseCase,
        useValue: new ToggleFavoriteUseCase(scanRepository),
      },
      {
        provide: ClearRatingUseCase,
        useValue: new ClearRatingUseCase(scanRepository),
      },
      {
        provide: RateScanUseCase,
        useValue: new RateScanUseCase(scanRepository),
      },
      { provide: STORE_LISTING, useValue: { openReviews } },
      {
        provide: AskForRatingUseCase,
        useValue: new AskForRatingUseCase(
          ratePromptRepository,
          scanRepository,
          new FixedClock(),
        ),
      },
      {
        provide: AnswerRatePromptUseCase,
        useValue: new AnswerRatePromptUseCase(
          ratePromptRepository,
          new FixedClock(),
        ),
      },
      {
        provide: RecordNewChapterOpenedUseCase,
        useValue: new RecordNewChapterOpenedUseCase(ratePromptRepository),
      },
    ],
  });

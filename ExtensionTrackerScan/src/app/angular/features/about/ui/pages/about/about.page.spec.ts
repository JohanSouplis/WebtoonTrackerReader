import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { FixedClock } from '../../../../../../core/gateways/in-memory/fixed-clock.gateway';
import { InMemoryRatePromptRepository } from '../../../../../../core/gateways/in-memory/in-memory-rate-prompt-repository.gateway';
import { InMemoryReportSettingsRepository } from '../../../../../../core/gateways/in-memory/in-memory-report-settings-repository.gateway';
import { AnswerRatePromptUseCase } from '../../../../../../core/use-cases/answer-rate-prompt.use-case';
import { ChangeParseReportsUseCase } from '../../../../../../core/use-cases/change-parse-reports.use-case';
import {
  REPORT_SETTINGS_REPOSITORY,
  STORE_LISTING,
} from '../../../../../injection-tokens';
import { AboutPage } from './about.page';

describe('AboutPage', () => {
  it('should save the reports off when the reader turns their switch off', async () => {
    const settingsRepository = new InMemoryReportSettingsRepository();
    await renderPage(settingsRepository);

    await userEvent.click(
      screen.getByRole('switch', { name: 'Send anonymous diagnostics' }),
    );

    expect(await settingsRepository.load()).toEqual({
      sendsParseReports: false,
    });
    expect(
      screen.getByRole('switch', { name: 'Send anonymous diagnostics' }),
    ).not.toBeChecked();
  });

  it('should show the reports off when the reader turned them off before', async () => {
    await renderPage(
      new InMemoryReportSettingsRepository({ sendsParseReports: false }),
    );

    expect(
      await screen.findByRole('switch', {
        name: 'Send anonymous diagnostics',
        checked: false,
      }),
    ).toBeInTheDocument();
  });

  it('should never ask for a rating again and then open the reviews when Rate the extension is clicked', async () => {
    const ratePromptRepository = new InMemoryRatePromptRepository();
    const statesWhenOpened: unknown[] = [];
    await renderPage(new InMemoryReportSettingsRepository(), {
      ratePromptRepository,
      openReviews: async () =>
        statesWhenOpened.push((await ratePromptRepository.load())?.state),
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Rate the extension' }),
    );

    await waitFor(() => expect(statesWhenOpened).toEqual([{ kind: 'rated' }]));
  });
});

const renderPage = (
  settingsRepository: InMemoryReportSettingsRepository,
  {
    openReviews = jest.fn(),
    ratePromptRepository = new InMemoryRatePromptRepository(),
  }: {
    openReviews?: () => void;
    ratePromptRepository?: InMemoryRatePromptRepository;
  } = {},
) =>
  render(AboutPage, {
    providers: [
      { provide: REPORT_SETTINGS_REPOSITORY, useValue: settingsRepository },
      {
        provide: ChangeParseReportsUseCase,
        useValue: new ChangeParseReportsUseCase(settingsRepository),
      },
      { provide: STORE_LISTING, useValue: { openReviews } },
      {
        provide: AnswerRatePromptUseCase,
        useValue: new AnswerRatePromptUseCase(
          ratePromptRepository,
          new FixedClock(),
        ),
      },
    ],
  });

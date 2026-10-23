import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { InMemoryReportSettingsRepository } from '../../../../../../core/gateways/in-memory/in-memory-report-settings-repository.gateway';
import { ChangeParseReportsUseCase } from '../../../../../../core/use-cases/change-parse-reports.use-case';
import { REPORT_SETTINGS_REPOSITORY } from '../../../../../injection-tokens';
import { AboutPage } from './about.page';

describe('AboutPage', () => {
  it('should save the reports off when the reader turns their switch off', async () => {
    const settingsRepository = new InMemoryReportSettingsRepository();
    await renderPage(settingsRepository);

    await userEvent.click(
      screen.getByRole('switch', { name: 'Send anonymous parse reports' }),
    );

    expect(await settingsRepository.load()).toEqual({
      sendsParseReports: false,
    });
    expect(
      screen.getByRole('switch', { name: 'Send anonymous parse reports' }),
    ).not.toBeChecked();
  });

  it('should show the reports off when the reader turned them off before', async () => {
    await renderPage(
      new InMemoryReportSettingsRepository({ sendsParseReports: false }),
    );

    expect(
      await screen.findByRole('switch', {
        name: 'Send anonymous parse reports',
        checked: false,
      }),
    ).toBeInTheDocument();
  });
});

const renderPage = (settingsRepository: InMemoryReportSettingsRepository) =>
  render(AboutPage, {
    providers: [
      { provide: REPORT_SETTINGS_REPOSITORY, useValue: settingsRepository },
      {
        provide: ChangeParseReportsUseCase,
        useValue: new ChangeParseReportsUseCase(settingsRepository),
      },
    ],
  });

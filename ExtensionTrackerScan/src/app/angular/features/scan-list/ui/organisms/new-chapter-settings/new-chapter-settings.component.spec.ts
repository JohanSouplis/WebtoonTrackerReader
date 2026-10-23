import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NewChapterSettings } from '../../../service/new-chapter-settings.vm';
import { NewChapterSettingsComponent } from './new-chapter-settings.component';

describe('NewChapterSettingsComponent', () => {
  it.each`
    checkEvery | areNotificationsOn | summary
    ${'1h'}    | ${false}           | ${'Checks every hour · Alerts off'}
    ${'6h'}    | ${true}            | ${'Checks every 6 hours · Alerts on'}
    ${'24h'}   | ${false}           | ${'Checks once a day · Alerts off'}
    ${'off'}   | ${false}           | ${'Checks off · Alerts off'}
  `(
    'should say "$summary" in its button',
    async ({ checkEvery, areNotificationsOn, summary }) => {
      await renderSettings({ checkEvery, areNotificationsOn });

      expect(screen.getByRole('button', { name: summary })).toBeInTheDocument();
    },
  );

  it('should check the chosen frequency in its menu and mention the toolbar count', async () => {
    await renderSettings({ checkEvery: '1h', areNotificationsOn: false });

    await userEvent.click(screen.getByRole('button'));

    expect(
      screen.getByRole('menuitemradio', { name: 'Every hour' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('menuitemradio', { name: 'Once a day' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Desktop alerts' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(
      screen.getByText(
        'New chapters also show as a count on the toolbar icon.',
      ),
    ).toBeInTheDocument();
  });

  it('should ask to stop the checks when Off is picked', async () => {
    const intervalChosen = jest.fn();
    await renderSettings(
      { checkEvery: '6h', areNotificationsOn: false },
      { intervalChosen },
    );

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Off' }));

    expect(intervalChosen).toHaveBeenCalledWith('off');
  });

  it('should ask to turn alerts off when they are on', async () => {
    const notificationsToggled = jest.fn();
    await renderSettings(
      { checkEvery: '6h', areNotificationsOn: true },
      { notificationsToggled },
    );

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(
      screen.getByRole('menuitemcheckbox', { name: 'Desktop alerts' }),
    );

    expect(notificationsToggled).toHaveBeenCalledWith(false);
  });
});

const renderSettings = (
  settings: NewChapterSettings,
  on: { intervalChosen?: jest.Mock; notificationsToggled?: jest.Mock } = {},
) => render(NewChapterSettingsComponent, { inputs: { settings }, on });

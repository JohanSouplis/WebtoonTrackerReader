import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NewChapterSettings } from '../../../service/new-chapter-settings.vm';
import { NewChapterSettingsComponent } from './new-chapter-settings.component';

describe('NewChapterSettingsComponent', () => {
  it('should say how often favorites are checked and check the chosen interval in its menu', async () => {
    await renderSettings({ checkEvery: '1h', areNotificationsOn: false });

    await userEvent.click(
      screen.getByRole('button', { name: 'New chapter checks: Every hour' }),
    );

    expect(
      screen.getByRole('menuitemradio', { name: 'Every hour' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('menuitemradio', { name: 'Once a day' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Desktop notifications' }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('should ask to check once a day when Once a day is picked', async () => {
    const intervalChosen = jest.fn();
    await renderSettings(
      { checkEvery: '6h', areNotificationsOn: false },
      { intervalChosen },
    );

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(
      screen.getByRole('menuitemradio', { name: 'Once a day' }),
    );

    expect(intervalChosen).toHaveBeenCalledWith('24h');
  });

  it('should ask to turn notifications off when they are on', async () => {
    const notificationsToggled = jest.fn();
    await renderSettings(
      { checkEvery: '6h', areNotificationsOn: true },
      { notificationsToggled },
    );

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(
      screen.getByRole('menuitemcheckbox', { name: 'Desktop notifications' }),
    );

    expect(notificationsToggled).toHaveBeenCalledWith(false);
  });
});

const renderSettings = (
  settings: NewChapterSettings,
  on: { intervalChosen?: jest.Mock; notificationsToggled?: jest.Mock } = {},
) => render(NewChapterSettingsComponent, { inputs: { settings }, on });

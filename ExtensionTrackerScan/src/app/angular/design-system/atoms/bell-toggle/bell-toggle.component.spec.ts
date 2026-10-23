import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BellToggleComponent } from './bell-toggle.component';

describe('BellToggleComponent', () => {
  it('should show a pressed bell button when checked', async () => {
    await renderBell({ checked: true });

    expect(screen.getByRole('button', { name: 'Follow' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('should show a released bell button when unchecked', async () => {
    await renderBell({ checked: false });

    expect(screen.getByRole('button', { name: 'Follow' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('should describe what the bell does with its hint', async () => {
    await renderBell({ checked: false });

    expect(
      screen.getByRole('button', { name: 'Follow' }),
    ).toHaveAccessibleDescription('Follow · check for new chapters');
  });

  it('should ask to toggle when the bell is activated from the keyboard', async () => {
    const toggled = jest.fn();
    await renderBell({ checked: false, toggled });

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(toggled).toHaveBeenCalledTimes(1);
  });
});

const renderBell = ({
  checked,
  toggled = jest.fn(),
}: {
  checked: boolean;
  toggled?: jest.Mock;
}) =>
  render(BellToggleComponent, {
    inputs: {
      checked,
      label: 'Follow',
      hint: 'Follow · check for new chapters',
    },
    on: { toggled },
    providers: [provideNoopAnimations()],
  });

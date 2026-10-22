import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { StarToggleComponent } from './star-toggle.component';

describe('StarToggleComponent', () => {
  it('should show a pressed star button when checked', async () => {
    await renderStar({ checked: true });

    expect(screen.getByRole('button', { name: 'Favorite' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('should show a released star button when unchecked', async () => {
    await renderStar({ checked: false });

    expect(screen.getByRole('button', { name: 'Favorite' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('should ask to toggle when the star is activated from the keyboard', async () => {
    const toggled = jest.fn();
    await renderStar({ checked: false, toggled });

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(toggled).toHaveBeenCalledTimes(1);
  });
});

const renderStar = ({
  checked,
  toggled = jest.fn(),
}: {
  checked: boolean;
  toggled?: jest.Mock;
}) =>
  render(StarToggleComponent, {
    inputs: { checked, label: 'Favorite' },
    on: { toggled },
    providers: [provideNoopAnimations()],
  });

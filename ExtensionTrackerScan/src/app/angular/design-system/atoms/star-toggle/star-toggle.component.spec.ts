import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { StarToggleComponent } from './star-toggle.component';

describe('StarToggleComponent', () => {
  it('should show a filled star labelled Favorited when checked', async () => {
    await render(StarToggleComponent, { inputs: { checked: true } });

    expect(screen.getByRole('img', { name: 'Favorited' })).toHaveAttribute(
      'src',
      'assets/fav_star.png',
    );
  });

  it('should show an empty star labelled Not Favorited when unchecked', async () => {
    await render(StarToggleComponent, { inputs: { checked: false } });

    expect(screen.getByRole('img', { name: 'Not Favorited' })).toHaveAttribute(
      'src',
      'assets/not_fav_star.png',
    );
  });

  it('should ask to toggle when the star is clicked', async () => {
    const toggled = jest.fn();
    await render(StarToggleComponent, {
      inputs: { checked: false },
      on: { toggled },
    });

    await userEvent.click(screen.getByRole('img', { name: 'Not Favorited' }));

    expect(toggled).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NavBarComponent } from './nav-bar.component';

describe('NavBarComponent', () => {
  it('should go to the add website tab when Add website is clicked', async () => {
    const navigated = jest.fn();
    await renderNavBar('', { navigated });

    await userEvent.click(screen.getByRole('button', { name: 'Add website' }));

    expect(navigated).toHaveBeenCalledWith('add_website_pattern');
  });

  it('should go back to the library when Library is clicked', async () => {
    const navigated = jest.fn();
    await renderNavBar('add_website_pattern', { navigated });

    await userEvent.click(screen.getByRole('button', { name: 'Library' }));

    expect(navigated).toHaveBeenCalledWith('');
  });

  it('should mark the tab of the selected path as the current page', async () => {
    await renderNavBar('add_website_pattern');

    expect(screen.getByRole('button', { name: 'Add website' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Library' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('should ask for the full page when Informations is chosen in its menu', async () => {
    const fullPageRequested = jest.fn();
    await renderNavBar('', { fullPageRequested });

    await userEvent.click(screen.getByRole('button', { name: 'Informations' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: /Informations/ }),
    );

    expect(fullPageRequested).toHaveBeenCalled();
  });

  it('should ask for the reviews when Rate the extension is chosen in the Informations menu', async () => {
    const reviewsRequested = jest.fn();
    await renderNavBar('', { reviewsRequested });

    await userEvent.click(screen.getByRole('button', { name: 'Informations' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: /Rate the extension/ }),
    );

    expect(reviewsRequested).toHaveBeenCalled();
  });
});

const renderNavBar = (
  selectedPath: string,
  outputs: Record<string, jest.Mock> = {},
) => render(NavBarComponent, { inputs: { selectedPath }, on: outputs });

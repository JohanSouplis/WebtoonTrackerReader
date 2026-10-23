import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NavBarComponent } from './nav-bar.component';

describe('NavBarComponent', () => {
  it('should go to the add website tab when Request a site is clicked', async () => {
    const navigated = jest.fn();
    await renderNavBar('', { navigated });

    await userEvent.click(
      screen.getByRole('button', { name: 'Request a site' }),
    );

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

    expect(
      screen.getByRole('button', { name: 'Request a site' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Library' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('should go to the about page when About is clicked', async () => {
    const navigated = jest.fn();
    await renderNavBar('', { navigated });

    await userEvent.click(screen.getByRole('button', { name: 'About' }));

    expect(navigated).toHaveBeenCalledWith('about');
  });

  it('should mark About as the current page on the about path', async () => {
    await renderNavBar('about');

    expect(screen.getByRole('button', { name: 'About' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

const renderNavBar = (
  selectedPath: string,
  outputs: Record<string, jest.Mock> = {},
) => render(NavBarComponent, { inputs: { selectedPath }, on: outputs });

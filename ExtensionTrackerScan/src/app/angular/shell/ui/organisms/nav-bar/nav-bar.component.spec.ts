import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NavBarComponent } from './nav-bar.component';

describe('NavBarComponent', () => {
  it('should go to the add website tab when Add Website is clicked', async () => {
    const navigated = jest.fn();
    await render(NavBarComponent, {
      inputs: { selectedPath: '' },
      on: { navigated },
    });

    await userEvent.click(screen.getByText('Add Website'));

    expect(navigated).toHaveBeenCalledWith('add_website_pattern');
  });

  it('should go back to the scan list when Scan list is clicked', async () => {
    const navigated = jest.fn();
    await render(NavBarComponent, {
      inputs: { selectedPath: 'add_website_pattern' },
      on: { navigated },
    });

    await userEvent.click(screen.getByText('Scan list'));

    expect(navigated).toHaveBeenCalledWith('');
  });

  it('should ask for the full page when Informations is clicked', async () => {
    const fullPageRequested = jest.fn();
    await render(NavBarComponent, {
      inputs: { selectedPath: '' },
      on: { fullPageRequested },
    });

    await userEvent.click(screen.getByText('Informations'));

    expect(fullPageRequested).toHaveBeenCalled();
  });
});

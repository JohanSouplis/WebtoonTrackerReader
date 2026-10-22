import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ScanFiltersComponent } from './scan-filters.component';

describe('ScanFiltersComponent', () => {
  it('should ask for favorites only and keep the rating filter when Favorites Only is checked', async () => {
    const filtersChanged = jest.fn();
    await render(ScanFiltersComponent, {
      inputs: { filters: { favoritesOnly: false, ratedOnly: true } },
      on: { filtersChanged },
    });

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Favorites Only' }),
    );

    expect(filtersChanged).toHaveBeenCalledWith({
      favoritesOnly: true,
      ratedOnly: true,
    });
  });

  it('should ask for rated scans only when Rating Only is checked', async () => {
    const filtersChanged = jest.fn();
    await render(ScanFiltersComponent, {
      inputs: { filters: { favoritesOnly: false, ratedOnly: false } },
      on: { filtersChanged },
    });

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Rating Only' }),
    );

    expect(filtersChanged).toHaveBeenCalledWith({
      favoritesOnly: false,
      ratedOnly: true,
    });
  });

  it('should search the typed title when the reader types in Filter by title', async () => {
    const searched = jest.fn();
    await render(ScanFiltersComponent, {
      inputs: { filters: { favoritesOnly: false, ratedOnly: false } },
      on: { searched },
    });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Filter by title' }),
      'Solo',
    );

    expect(searched).toHaveBeenLastCalledWith('solo');
  });
});

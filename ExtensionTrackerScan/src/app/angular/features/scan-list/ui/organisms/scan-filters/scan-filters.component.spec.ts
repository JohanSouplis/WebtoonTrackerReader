import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NO_FILTERS, ScanFilters } from '../../../service/scan-filters.rules';
import { ScanFiltersComponent } from './scan-filters.component';

describe('ScanFiltersComponent', () => {
  it('should ask for favorites only when Favorites only is pressed', async () => {
    const filtersChanged = jest.fn();
    await renderFilters(
      { title: 'solo', favoritesOnly: false, ratedOnly: true },
      filtersChanged,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Favorites only' }),
    );

    expect(filtersChanged).toHaveBeenCalledWith({ favoritesOnly: true });
  });

  it('should ask for every scan again when a pressed Rated only is pressed', async () => {
    const filtersChanged = jest.fn();
    await renderFilters({ ...NO_FILTERS, ratedOnly: true }, filtersChanged);

    await userEvent.click(screen.getByRole('button', { name: 'Rated only' }));

    expect(filtersChanged).toHaveBeenCalledWith({ ratedOnly: false });
  });

  it('should show which filters are on', async () => {
    await renderFilters({ ...NO_FILTERS, favoritesOnly: true });

    expect(
      screen.getByRole('button', { name: 'Favorites only' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Rated only' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('should search the typed title when the reader types in Filter by title', async () => {
    const filtersChanged = jest.fn();
    await renderFilters({ ...NO_FILTERS, favoritesOnly: true }, filtersChanged);

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Filter by title' }),
      'S',
    );

    expect(filtersChanged).toHaveBeenLastCalledWith({ title: 'S' });
  });
});

const renderFilters = (filters: ScanFilters, filtersChanged = jest.fn()) =>
  render(ScanFiltersComponent, {
    inputs: { filters },
    on: { filtersChanged },
  });

import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ScanSortBarComponent } from './scan-sort-bar.component';

describe('ScanSortBarComponent', () => {
  it('should show how many series match', async () => {
    await renderSortBar();

    expect(screen.getByText('12 series')).toBeInTheDocument();
  });

  it('should show the sorted key pressed with its direction', async () => {
    await renderSortBar();

    expect(
      screen.getByRole('button', { name: 'Title (ascending)' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Last read' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('should ask to sort by chapter when Chapter is clicked', async () => {
    const sorted = jest.fn();
    await renderSortBar(sorted);

    await userEvent.click(screen.getByRole('button', { name: 'Chapter' }));

    expect(sorted).toHaveBeenCalledWith('chapter');
  });
});

const renderSortBar = (sorted = jest.fn()) =>
  render(ScanSortBarComponent, {
    inputs: { sort: { key: 'title', direction: 'asc' }, count: 12 },
    on: { sorted },
  });

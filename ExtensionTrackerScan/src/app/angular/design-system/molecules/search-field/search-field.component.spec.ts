import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SearchFieldComponent } from './search-field.component';

describe('SearchFieldComponent', () => {
  it('should search the text as typed when the reader types', async () => {
    const searched = jest.fn();
    await render(SearchFieldComponent, {
      inputs: { label: 'Filter by title', value: '' },
      on: { searched },
    });

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Filter by title' }),
      'Solo L',
    );

    expect(searched).toHaveBeenLastCalledWith('Solo L');
  });

  it('should show the current search in the field', async () => {
    await render(SearchFieldComponent, {
      inputs: { label: 'Filter by title', value: 'sss' },
    });

    expect(
      screen.getByRole('searchbox', { name: 'Filter by title' }),
    ).toHaveValue('sss');
  });

  it('should offer no clear button when the field is empty', async () => {
    await render(SearchFieldComponent, {
      inputs: { label: 'Filter by title', value: '' },
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should search nothing when the clear button is clicked', async () => {
    const searched = jest.fn();
    await render(SearchFieldComponent, {
      inputs: { label: 'Filter by title', value: 'sss' },
      on: { searched },
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Clear Filter by title' }),
    );

    expect(searched).toHaveBeenCalledWith('');
  });
});

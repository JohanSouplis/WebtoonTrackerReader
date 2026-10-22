import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SearchFieldComponent } from './search-field.component';

describe('SearchFieldComponent', () => {
  it('should search the typed text trimmed and in lower case when the reader types', async () => {
    const searched = jest.fn();
    await render(SearchFieldComponent, {
      inputs: { label: 'Filter by title' },
      on: { searched },
    });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Filter by title' }),
      ' SSS ',
    );

    expect(searched).toHaveBeenLastCalledWith('sss');
  });
});

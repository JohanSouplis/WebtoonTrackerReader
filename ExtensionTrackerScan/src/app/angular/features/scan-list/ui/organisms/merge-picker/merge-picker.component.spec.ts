import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MergePickerComponent } from './merge-picker.component';

describe('MergePickerComponent', () => {
  it('should offer every other series in alphabetical order', async () => {
    await renderPicker();

    expect(
      screen.getByRole('heading', { name: 'Merge “Punch” into…' }),
    ).toBeInTheDocument();
    expect(optionNames()).toEqual(['Eleceed', 'Lookism', 'One Punch-Man']);
  });

  it('should offer only the series whose title contains the search', async () => {
    await renderPicker();

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Find a series' }),
      'PUNCH',
    );

    expect(optionNames()).toEqual(['One Punch-Man']);
  });

  it('should merge into the series clicked', async () => {
    const picked = jest.fn();
    await renderPicker({ picked });

    await userEvent.click(screen.getByRole('button', { name: 'Lookism' }));

    expect(picked).toHaveBeenCalledWith('Lookism');
  });

  it('should merge into the first series shown when Enter is pressed in the search', async () => {
    const picked = jest.fn();
    await renderPicker({ picked });

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Find a series' }),
      'o{Enter}',
    );

    expect(picked).toHaveBeenCalledWith('Lookism');
  });

  it('should say so and merge nothing on Enter when no series matches', async () => {
    const picked = jest.fn();
    await renderPicker({ picked });

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Find a series' }),
      'Solo{Enter}',
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'No other series match.',
    );
    expect(picked).not.toHaveBeenCalled();
  });

  it('should cancel when Cancel is clicked', async () => {
    const cancelled = jest.fn();
    await renderPicker({ cancelled });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(cancelled).toHaveBeenCalled();
  });
});

const optionNames = (): string[] =>
  within(screen.getByRole('list', { name: 'Series to merge into' }))
    .getAllByRole('button')
    .map((option) => option.textContent?.trim() ?? '');

const renderPicker = (outputs: Record<string, jest.Mock> = {}) =>
  render(MergePickerComponent, {
    inputs: {
      source: 'Punch',
      titles: ['Punch', 'One Punch-Man', 'Lookism', 'Eleceed'],
    },
    on: outputs,
  });

import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { InlineEditComponent } from './inline-edit.component';

describe('InlineEditComponent', () => {
  it('should start with the current text selected so typing replaces it', async () => {
    const saved = jest.fn();
    await renderEdit({ saved });

    await userEvent.keyboard('One Punch-Man{Enter}');

    expect(saved).toHaveBeenCalledWith('One Punch-Man');
  });

  it('should save the trimmed text when Save is clicked', async () => {
    const saved = jest.fn();
    await renderEdit({ saved });
    const field = screen.getByRole('textbox', { name: 'New title for Punch' });

    await userEvent.clear(field);
    await userEvent.type(field, '  One Punch-Man ');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(saved).toHaveBeenCalledWith('One Punch-Man');
  });

  it('should cancel when Escape is pressed', async () => {
    const saved = jest.fn();
    const cancelled = jest.fn();
    await renderEdit({ saved, cancelled });

    await userEvent.keyboard('One Punch-Man{Escape}');

    expect(cancelled).toHaveBeenCalled();
    expect(saved).not.toHaveBeenCalled();
  });

  it('should cancel when Cancel is clicked', async () => {
    const cancelled = jest.fn();
    await renderEdit({ cancelled });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(cancelled).toHaveBeenCalled();
  });

  it('should keep editing when the text is empty', async () => {
    const saved = jest.fn();
    const cancelled = jest.fn();
    await renderEdit({ saved, cancelled });

    await userEvent.keyboard('{Backspace}   {Enter}');

    expect(saved).not.toHaveBeenCalled();
    expect(cancelled).not.toHaveBeenCalled();
    expect(
      screen.getByRole('textbox', { name: 'New title for Punch' }),
    ).toHaveFocus();
  });

  it('should cancel when the text is saved unchanged', async () => {
    const saved = jest.fn();
    const cancelled = jest.fn();
    await renderEdit({ saved, cancelled });

    await userEvent.keyboard('{Enter}');

    expect(cancelled).toHaveBeenCalled();
    expect(saved).not.toHaveBeenCalled();
  });
});

const renderEdit = (outputs: Record<string, jest.Mock>) =>
  render(InlineEditComponent, {
    inputs: { label: 'New title for Punch', value: 'Punch' },
    on: outputs,
  });

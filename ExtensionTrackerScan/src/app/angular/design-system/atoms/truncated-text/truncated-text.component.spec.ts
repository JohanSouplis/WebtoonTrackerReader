import { render, screen } from '@testing-library/angular';
import { TruncatedTextComponent } from './truncated-text.component';

describe('TruncatedTextComponent', () => {
  it('should cut the text and describe it whole when it is longer than the max length', async () => {
    await render(TruncatedTextComponent, {
      inputs: { text: 'Solo Leveling: Ragnarok', maxLength: 12 },
    });

    expect(screen.getByText('Solo Levelin...')).toHaveAccessibleDescription(
      'Solo Leveling: Ragnarok',
    );
  });

  it('should show the text intact without description when it fits the max length', async () => {
    await render(TruncatedTextComponent, {
      inputs: { text: 'Solo Leveling', maxLength: 13 },
    });

    expect(screen.getByText('Solo Leveling')).not.toHaveAccessibleDescription();
  });
});

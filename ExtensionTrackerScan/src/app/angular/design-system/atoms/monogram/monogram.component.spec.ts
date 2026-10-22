import { render } from '@testing-library/angular';
import { MonogramComponent } from './monogram.component';

describe('MonogramComponent', () => {
  it.each`
    text                               | initials
    ${'Omniscient Reader’s Viewpoint'} | ${'OR'}
    ${'The Executioner'}               | ${'E'}
    ${'a Dragonslayer Story'}          | ${'DS'}
    ${'toonily.com'}                   | ${'T'}
  `(
    'should show $initials when the text is $text',
    async ({ text, initials }) => {
      const { container } = await render(MonogramComponent, {
        inputs: { text },
      });

      expect(container).toHaveTextContent(initials);
    },
  );

  it('should stay out of the accessibility tree when it repeats the text beside it', async () => {
    const { container } = await render(MonogramComponent, {
      inputs: { text: 'Solo Leveling' },
    });

    expect(container).toHaveAttribute('aria-hidden', 'true');
  });
});

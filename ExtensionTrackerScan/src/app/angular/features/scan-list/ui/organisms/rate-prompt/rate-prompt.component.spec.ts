import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { RatePromptComponent } from './rate-prompt.component';

describe('RatePromptComponent', () => {
  it.each`
    action               | answer
    ${'Rate it'}         | ${'rate'}
    ${'Not now'}         | ${'not-now'}
    ${"Don't ask again"} | ${'never'}
  `(
    'should answer $answer when $action is clicked',
    async ({ action, answer }) => {
      const answered = jest.fn();
      await render(RatePromptComponent, { on: { answered } });

      await userEvent.click(
        within(
          screen.getByRole('region', { name: 'Enjoying Scan Tracker?' }),
        ).getByRole('button', { name: action }),
      );

      expect(answered).toHaveBeenCalledWith(answer);
    },
  );
});

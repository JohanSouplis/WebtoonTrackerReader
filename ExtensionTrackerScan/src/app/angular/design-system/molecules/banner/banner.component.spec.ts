import { render, screen, within } from '@testing-library/angular';
import { BannerComponent } from './banner.component';

describe('BannerComponent', () => {
  it('should show its message and actions in a region named by its heading', async () => {
    await render(
      `<ds-banner icon="grade" heading="Enjoying it?" message="Tell others.">
        <button type="button">Do it</button>
      </ds-banner>`,
      { imports: [BannerComponent] },
    );

    const banner = screen.getByRole('region', { name: 'Enjoying it?' });
    expect(within(banner).getByText('Tell others.')).toBeInTheDocument();
    expect(
      within(banner).getByRole('button', { name: 'Do it' }),
    ).toBeInTheDocument();
  });
});

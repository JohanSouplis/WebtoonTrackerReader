import { render, screen } from '@testing-library/angular';
import { CoverComponent } from './cover.component';

describe('CoverComponent', () => {
  it('should show the thumbnail as a decorative image since the title is beside it', async () => {
    await render(CoverComponent, { inputs: { src: THUMBNAIL } });

    expect(screen.getByRole('presentation')).toHaveAttribute('src', THUMBNAIL);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

const THUMBNAIL = 'data:image/webp;base64,UklGRg==';

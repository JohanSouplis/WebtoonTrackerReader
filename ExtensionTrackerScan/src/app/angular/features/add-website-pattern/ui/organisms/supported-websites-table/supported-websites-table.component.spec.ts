import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SupportedWebsitesTableComponent } from './supported-websites-table.component';

describe('SupportedWebsitesTableComponent', () => {
  it('should explain that a website url is the one where a story is read', async () => {
    await render(SupportedWebsitesTableComponent, {
      inputs: { websites: ['toonily.com'] },
      providers: [provideNoopAnimations()],
    });

    expect(
      screen.getByText(/the one where you read a story/),
    ).toBeInTheDocument();
  });

  it('should list only the websites containing the filter when the reader filters', async () => {
    await render(SupportedWebsitesTableComponent, {
      inputs: { websites: ['toonily.com', 'mangadex.org', 'mangapark'] },
      providers: [provideNoopAnimations()],
    });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Filter by website' }),
      'MANGA',
    );

    expect(
      screen.getAllByRole('cell').map((cell) => cell.textContent?.trim()),
    ).toEqual(['mangadex.org', 'mangapark']);
  });
});

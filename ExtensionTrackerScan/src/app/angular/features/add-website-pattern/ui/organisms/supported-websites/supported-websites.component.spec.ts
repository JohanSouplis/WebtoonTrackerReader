import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SupportedWebsitesComponent } from './supported-websites.component';

describe('SupportedWebsitesComponent', () => {
  it('should count every supported website next to the title', async () => {
    await renderWebsites(['toonily.com', 'mangadex.org', 'mangapark']);

    expect(
      screen.getByRole('heading', { name: 'Supported websites 3' }),
    ).toBeInTheDocument();
  });

  it('should list only the websites containing the filter whatever its case when the reader filters', async () => {
    await renderWebsites(['toonily.com', 'mangadex.org', 'mangapark']);

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Filter by website' }),
      'MANGA',
    );

    expect(shownWebsites()).toEqual(['mangadex.org', 'mangapark']);
  });

  it('should show ten websites per page and the rest on the next page', async () => {
    await renderWebsites(
      Array.from({ length: 12 }, (_, index) => `site-${index + 1}.com`),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(shownWebsites()).toEqual(['site-11.com', 'site-12.com']);
  });

  it('should say no website matches when the filter matches nothing', async () => {
    await renderWebsites(['toonily.com']);

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Filter by website' }),
      'nothing-here',
    );

    expect(
      screen.getByText('No supported website matches “nothing-here”.'),
    ).toBeInTheDocument();
  });
});

const shownWebsites = (): string[] =>
  within(screen.getByRole('list', { name: 'Supported websites' }))
    .getAllByRole('listitem')
    .map(
      (item) =>
        within(item).getByText(/.+/, { ignore: 'ds-monogram' }).textContent ??
        '',
    );

const renderWebsites = (websites: string[]) =>
  render(SupportedWebsitesComponent, {
    inputs: { websites },
    providers: [provideNoopAnimations()],
  });

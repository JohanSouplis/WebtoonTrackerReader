import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { VerifiedWebsitesComponent } from './verified-websites.component';

describe('VerifiedWebsitesComponent', () => {
  it('should count every verified website next to the title', async () => {
    await renderWebsites(['toonily.com', 'mangadex.org', 'mangapark']);

    expect(
      screen.getByRole('heading', { name: 'Verified websites 3' }),
    ).toBeInTheDocument();
  });

  it('should list only the websites containing the filter whatever its case when the reader filters', async () => {
    await renderWebsites(['toonily.com', 'mangadex.org', 'mangapark']);

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Filter by website or address' }),
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

  it('should say no website matches and offer to request it when the filter matches nothing', async () => {
    const siteRequested = jest.fn();
    await renderWebsites(['toonily.com'], { siteRequested });

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Filter by website or address' }),
      'https://nothing-here.net/chapter-2',
    );
    expect(
      screen.getByText(
        'No verified website matches “https://nothing-here.net/chapter-2”.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Request this site' }),
    );

    expect(siteRequested).toHaveBeenCalledWith(
      'https://nothing-here.net/chapter-2',
    );
  });

  it('should find the verified website of a pasted chapter address', async () => {
    await renderWebsites(['toonily.com', 'mangadex.org']);

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Filter by website or address' }),
      'https://toonily.com/webtoon/solo/chapter-3',
    );

    expect(shownWebsites()).toEqual(['toonily.com']);
  });
});

const shownWebsites = (): string[] =>
  within(screen.getByRole('list', { name: 'Verified websites' }))
    .getAllByRole('listitem')
    .map(
      (item) =>
        within(item).getByText(/.+/, { ignore: 'ds-monogram' }).textContent ??
        '',
    );

const renderWebsites = (
  websites: string[],
  outputs: Record<string, jest.Mock> = {},
) =>
  render(VerifiedWebsitesComponent, {
    inputs: { websites },
    on: outputs,
    providers: [provideNoopAnimations()],
  });

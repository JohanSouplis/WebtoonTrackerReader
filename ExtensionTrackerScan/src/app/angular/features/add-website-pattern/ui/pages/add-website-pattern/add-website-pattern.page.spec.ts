import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { InMemoryWebsiteProposal } from '../../../../../../core/gateways/in-memory/in-memory-website-proposal.gateway';
import { WebsiteProposalPort } from '../../../../../../core/ports/website-proposal.port';
import { ProposeWebsiteUseCase } from '../../../../../../core/use-cases/propose-website.use-case';
import { AddWebsitePatternPage } from './add-website-pattern.page';

describe('AddWebsitePatternPage', () => {
  it('should send the chapter page and thank the reader once it is sent', async () => {
    const websiteProposal = new InMemoryWebsiteProposal();
    await renderPage(websiteProposal);

    await userEvent.type(field(), 'https://example-scans.com/chapter-1');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));

    expect(
      await screen.findByText("Thanks, we'll review it."),
    ).toBeInTheDocument();
    expect(websiteProposal.proposedWebsites).toEqual([
      'https://example-scans.com/chapter-1',
    ]);
    expect(field()).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Sent' })).toBeDisabled();
  });

  it('should say the site is already supported instead of sending it', async () => {
    const websiteProposal = new InMemoryWebsiteProposal();
    await renderPage(websiteProposal);

    await userEvent.type(field(), 'https://asurascans.com/chapter-1');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));

    expect(
      await screen.findByText(/^\s*Already supported\./),
    ).toBeInTheDocument();
    expect(websiteProposal.proposedWebsites).toEqual([]);
  });

  it('should keep the address and offer to retry when the request cannot be sent', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await renderPage({ propose: () => Promise.reject(new Error('offline')) });

    await userEvent.type(field(), 'https://example-scans.com/chapter-1');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));

    expect(await screen.findByRole('button', { name: 'Retry' })).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent("Couldn't send.");
    expect(field()).toHaveValue('https://example-scans.com/chapter-1');
  });

  it('should fill the request with a pasted address the verified list does not know', async () => {
    await renderPage(new InMemoryWebsiteProposal());

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Filter by website or address' }),
      'https://unknown-scans.net/manga/chapter-3',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Request this site' }),
    );

    expect(field()).toHaveValue('https://unknown-scans.net/manga/chapter-3');
    expect(field()).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Send request' })).toBeEnabled();
  });
});

const field = (): HTMLElement =>
  screen.getByRole('textbox', { name: 'Chapter page URL' });

const renderPage = (websiteProposal: WebsiteProposalPort) =>
  render(AddWebsitePatternPage, {
    providers: [
      provideNoopAnimations(),
      {
        provide: ProposeWebsiteUseCase,
        useValue: new ProposeWebsiteUseCase(websiteProposal),
      },
    ],
  });

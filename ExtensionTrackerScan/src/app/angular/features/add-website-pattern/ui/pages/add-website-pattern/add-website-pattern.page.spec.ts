import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { InMemoryWebsiteProposal } from '../../../../../../core/gateways/in-memory/in-memory-website-proposal.gateway';
import { ProposeWebsiteUseCase } from '../../../../../../core/use-cases/propose-website.use-case';
import { AddWebsitePatternPage } from './add-website-pattern.page';

describe('AddWebsitePatternPage', () => {
  it('should send the proposal and thank the reader when they propose a website', async () => {
    const websiteProposal = await renderPage();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Website name' }),
      'example-scans.com',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Propose' }));

    expect(websiteProposal.proposedWebsites).toEqual(['example-scans.com']);
    expect(
      await screen.findByText('Website proposed. Thanks!'),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Website name' })).toHaveValue(
      '',
    );
    expect(screen.getByRole('button', { name: 'Sent' })).toBeDisabled();
  });

  it('should let the reader propose again once the thanks are dismissed', async () => {
    await renderPage();
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Website name' }),
      'example-scans.com',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Propose' }));

    await userEvent.click(
      await screen.findByRole('button', { name: 'Dismiss' }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Website name' }),
      'other-scans.com',
    );

    expect(
      await screen.findByRole('button', { name: 'Propose' }),
    ).toBeEnabled();
  });

  it('should keep Propose disabled when only spaces are typed', async () => {
    await renderPage();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Website name' }),
      '   ',
    );

    expect(screen.getByRole('button', { name: 'Propose' })).toBeDisabled();
  });
});

const renderPage = async (): Promise<InMemoryWebsiteProposal> => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  const websiteProposal = new InMemoryWebsiteProposal();
  await render(AddWebsitePatternPage, {
    providers: [
      provideNoopAnimations(),
      {
        provide: ProposeWebsiteUseCase,
        useValue: new ProposeWebsiteUseCase(websiteProposal),
      },
    ],
  });
  return websiteProposal;
};

import { render, screen } from '@testing-library/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import userEvent from '@testing-library/user-event';
import { InMemoryWebsiteProposal } from '../../../../../../core/gateways/in-memory/in-memory-website-proposal.gateway';
import { ProposeWebsiteUseCase } from '../../../../../../core/use-cases/propose-website.use-case';
import { AddWebsitePatternPage } from './add-website-pattern.page';

describe('AddWebsitePatternPage', () => {
  it('should send the proposal and confirm it when the reader asks for a website', async () => {
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

    await userEvent.type(
      screen.getByPlaceholderText('Enter website name'),
      'example-scans.com',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));

    expect(websiteProposal.proposedWebsites).toEqual(['example-scans.com']);
    expect(
      screen.getByText('The website has been proposed successfully'),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter website name')).toHaveValue('');
  });
});

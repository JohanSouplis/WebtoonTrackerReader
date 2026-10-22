import { InMemoryWebsiteProposal } from '../gateways/in-memory/in-memory-website-proposal.gateway';
import { ProposeWebsiteUseCase } from './propose-website.use-case';

describe('ProposeWebsiteUseCase', () => {
  it('should send the website the reader proposes', () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const websiteProposal = new InMemoryWebsiteProposal();

    new ProposeWebsiteUseCase(websiteProposal).execute('example-scans.com');

    expect(websiteProposal.proposedWebsites).toEqual(['example-scans.com']);
  });
});

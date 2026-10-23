import { InMemoryWebsiteProposal } from '../gateways/in-memory/in-memory-website-proposal.gateway';
import { ProposeWebsiteUseCase } from './propose-website.use-case';

describe('ProposeWebsiteUseCase', () => {
  it('should send the chapter page of a site that is not verified yet', async () => {
    const websiteProposal = new InMemoryWebsiteProposal();

    const outcome = await new ProposeWebsiteUseCase(websiteProposal).execute(
      'https://example-scans.com/series/solo/chapter-12',
    );

    expect(outcome).toBe('sent');
    expect(websiteProposal.proposedWebsites).toEqual([
      'https://example-scans.com/series/solo/chapter-12',
    ]);
  });

  it('should send nothing and say the site is supported when it is already verified', async () => {
    const websiteProposal = new InMemoryWebsiteProposal();

    const outcome = await new ProposeWebsiteUseCase(websiteProposal).execute(
      'https://www.asurascans.com/series/solo/chapter-12',
    );

    expect(outcome).toBe('already-supported');
    expect(websiteProposal.proposedWebsites).toEqual([]);
  });

  it('should fail when the proposal cannot be sent', async () => {
    const unreachable = {
      propose: () => Promise.reject(new Error('offline')),
    };

    await expect(
      new ProposeWebsiteUseCase(unreachable).execute(
        'https://example-scans.com/series/solo/chapter-12',
      ),
    ).rejects.toThrow('offline');
  });
});

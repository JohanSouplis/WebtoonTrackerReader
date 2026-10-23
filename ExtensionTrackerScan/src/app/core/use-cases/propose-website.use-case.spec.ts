import { InMemoryTelemetryRecorder } from '../gateways/in-memory/in-memory-telemetry-recorder.gateway';
import { InMemoryWebsiteProposal } from '../gateways/in-memory/in-memory-website-proposal.gateway';
import { WebsiteProposalPort } from '../ports/website-proposal.port';
import { ProposeWebsiteUseCase } from './propose-website.use-case';

describe('ProposeWebsiteUseCase', () => {
  it('should send the chapter page of a site that is not verified yet', async () => {
    const websiteProposal = new InMemoryWebsiteProposal();
    const { proposeWebsite, telemetry } = setUp(websiteProposal);

    const outcome = await proposeWebsite.execute(
      'https://example-scans.com/series/solo/chapter-12',
    );

    expect(outcome).toBe('sent');
    expect(websiteProposal.proposedWebsites).toEqual([
      'https://example-scans.com/series/solo/chapter-12',
    ]);
    expect(telemetry.recordedEvents).toEqual([]);
  });

  it('should send nothing and say the site is supported when it is already verified', async () => {
    const websiteProposal = new InMemoryWebsiteProposal();
    const { proposeWebsite } = setUp(websiteProposal);

    const outcome = await proposeWebsite.execute(
      'https://www.asurascans.com/series/solo/chapter-12',
    );

    expect(outcome).toBe('already-supported');
    expect(websiteProposal.proposedWebsites).toEqual([]);
  });

  it('should fail and count the failure when the proposal cannot be sent', async () => {
    const { proposeWebsite, telemetry } = setUp({
      propose: () => Promise.reject(new Error('offline')),
    });

    await expect(
      proposeWebsite.execute(
        'https://example-scans.com/series/solo/chapter-12',
      ),
    ).rejects.toThrow('offline');
    expect(telemetry.recordedEvents).toEqual([
      { kind: 'proposal-send-failed' },
    ]);
  });
});

const setUp = (websiteProposal: WebsiteProposalPort) => {
  const telemetry = new InMemoryTelemetryRecorder();
  return {
    telemetry,
    proposeWebsite: new ProposeWebsiteUseCase(websiteProposal, telemetry),
  };
};

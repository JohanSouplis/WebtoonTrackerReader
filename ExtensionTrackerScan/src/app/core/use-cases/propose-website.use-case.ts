import { isVerifiedWebsite } from '../domain/verified-websites';
import { TelemetryRecorderPort } from '../ports/telemetry-recorder.port';
import { WebsiteProposalPort } from '../ports/website-proposal.port';

export type WebsiteProposalOutcome = 'sent' | 'already-supported';

export class ProposeWebsiteUseCase {
  constructor(
    private readonly websiteProposal: WebsiteProposalPort,
    private readonly telemetry: TelemetryRecorderPort,
  ) {}

  async execute(chapterUrl: string): Promise<WebsiteProposalOutcome> {
    if (isVerifiedWebsite(chapterUrl)) {
      return 'already-supported';
    }
    try {
      await this.websiteProposal.propose(chapterUrl);
    } catch (error) {
      this.telemetry.record({ kind: 'proposal-send-failed' });
      throw error;
    }
    return 'sent';
  }
}

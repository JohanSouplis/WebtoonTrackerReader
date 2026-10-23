import { isVerifiedWebsite } from '../domain/verified-websites';
import { WebsiteProposalPort } from '../ports/website-proposal.port';

export type WebsiteProposalOutcome = 'sent' | 'already-supported';

export class ProposeWebsiteUseCase {
  constructor(private readonly websiteProposal: WebsiteProposalPort) {}

  async execute(chapterUrl: string): Promise<WebsiteProposalOutcome> {
    if (isVerifiedWebsite(chapterUrl)) {
      return 'already-supported';
    }
    await this.websiteProposal.propose(chapterUrl);
    return 'sent';
  }
}

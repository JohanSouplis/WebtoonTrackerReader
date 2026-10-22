import { WebsiteProposalPort } from '../ports/website-proposal.port';

export class ProposeWebsiteUseCase {
  constructor(private readonly websiteProposal: WebsiteProposalPort) {}

  execute(website: string): void {
    this.websiteProposal.propose(website);
  }
}

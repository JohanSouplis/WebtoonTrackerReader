import { WebsiteProposalPort } from '../../ports/website-proposal.port';

export class InMemoryWebsiteProposal implements WebsiteProposalPort {
  readonly proposedWebsites: string[] = [];

  async propose(chapterUrl: string): Promise<void> {
    this.proposedWebsites.push(chapterUrl);
  }
}

import { WebsiteProposalPort } from '../../ports/website-proposal.port';

export class InMemoryWebsiteProposal implements WebsiteProposalPort {
  readonly proposedWebsites: string[] = [];

  propose(website: string): void {
    this.proposedWebsites.push(website);
    console.log('Notify Mocked');
  }
}

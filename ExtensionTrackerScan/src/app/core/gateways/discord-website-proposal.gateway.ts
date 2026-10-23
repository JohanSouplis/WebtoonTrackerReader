import { WebsiteProposalPort } from '../ports/website-proposal.port';
import { WEBSITE_PROPOSAL_WEBHOOK_URL } from './discord-webhooks';

export class DiscordWebsiteProposal implements WebsiteProposalPort {
  async propose(chapterUrl: string): Promise<void> {
    const response = await fetch(WEBSITE_PROPOSAL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `📢 **New website proposed :**\n\`\`\`${chapterUrl}\`\`\``,
      }),
    });
    if (!response.ok) {
      throw new Error(`The proposal webhook answered HTTP ${response.status}`);
    }
  }
}

import { WebsiteProposalPort } from '../ports/website-proposal.port';

const WEBHOOK_URL =
  'https://discord.com/api/webhooks/1335709119444811846/vA5rdOv8-CGL9QhgbO95mZUOyToggmpvPjEBSiskvMmfJFn_o0bVODbqjyJ5xBT31Am4';

export class DiscordWebsiteProposal implements WebsiteProposalPort {
  async propose(chapterUrl: string): Promise<void> {
    const response = await fetch(WEBHOOK_URL, {
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

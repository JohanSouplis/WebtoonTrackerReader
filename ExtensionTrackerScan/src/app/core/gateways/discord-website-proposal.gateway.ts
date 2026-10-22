import { WebsiteProposalPort } from '../ports/website-proposal.port';

const WEBHOOK_URL =
  'https://discord.com/api/webhooks/1335709119444811846/vA5rdOv8-CGL9QhgbO95mZUOyToggmpvPjEBSiskvMmfJFn_o0bVODbqjyJ5xBT31Am4';

const post = async (website: string): Promise<void> => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `📢 **New website proposed :**\n\`\`\`${website}\`\`\``,
      }),
    });
    if (!response.ok) {
      console.error('Error when sending to discord', response.statusText);
      throw new Error(`Erreur HTTP : ${response.status}`);
    }
  } catch (error) {
    console.error('Error while sending to discord :', error);
  }
};

export class DiscordWebsiteProposal implements WebsiteProposalPort {
  propose(website: string): void {
    void post(website);
  }
}

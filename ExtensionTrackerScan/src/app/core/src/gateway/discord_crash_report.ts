import { CrashReport } from '../domain/ports/crash_report.interface';

export class DiscordCrashReport implements CrashReport {
  async execute(url: string, titleWebpage: string, error?: any) {
    const payload = {
      content: `📢 **New scans known but not parsed correctly :**\n\`\`\`${url}\`\`\`
      \`\`\`${titleWebpage}\`\`\`
      \`\`\`${error}\`\`\``,
    };

    try {
      const response = await fetch(
        'https://discord.com/api/webhooks/1336426162653757450/wYGF0H04jEF0Z55H7xLhYV7dKrPLlDhXIMCwj0q21vx1Vhj2o8qUBHSt9DbyrsIMQ_ZH',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        console.error('Error when sending to discord', response.statusText);
        throw new Error(`Erreur HTTP : ${response.status}`);
      }
    } catch (error) {
      console.error('Error while sending to discord :', error);
    }
  }
}

import { CrashReport } from '../domain/ports/crash_report.interface';

export class DiscordCrashReport implements CrashReport {
  async execute(url: string, error?: any) {
    const payload = {
      content: `📢 **New scans known but not parsed correctly :**\n\`\`\`${
        url + '\n' + error
      }\`\`\``,
    };

    try {
      const response = await fetch(
        'https://discord.com/api/webhooks/1332722641228009536/vdece0juuv7E_IViAKNytG0Vw2-A5KKXxvYu0uRBu99gXeW6B6cOFpv6hdel9PEnZkAR',
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

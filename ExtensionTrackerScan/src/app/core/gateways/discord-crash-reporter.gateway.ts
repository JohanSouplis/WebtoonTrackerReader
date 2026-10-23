import { VisitedPage } from '../domain/parsed-page';
import { CrashReporterPort } from '../ports/crash-reporter.port';
import { CRASH_REPORT_WEBHOOK_URL } from './discord-webhooks';

const toMessage = (page: VisitedPage): string =>
  [
    '📢 **New scans known but not parsed correctly :**',
    `\`\`\`${page.url}\`\`\``,
    `      \`\`\`${page.pageTitle}\`\`\``,
    '      ```undefined```',
  ].join('\n');

const post = async (page: VisitedPage): Promise<void> => {
  try {
    const response = await fetch(CRASH_REPORT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: toMessage(page) }),
    });
    if (!response.ok) {
      console.error('Error when sending to discord', response.statusText);
      throw new Error(
        `The crash report webhook answered HTTP ${response.status}`,
      );
    }
  } catch (error) {
    console.error('Error while sending to discord :', error);
  }
};

export class DiscordCrashReporter implements CrashReporterPort {
  reportUnparsedPage(page: VisitedPage): void {
    void post(page);
  }
}

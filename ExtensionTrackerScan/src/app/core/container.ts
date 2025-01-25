import { Container } from 'inversify';

import { CrashReport } from './src/domain/ports/crash_report.interface';
import { DiscordCrashReport } from './src/gateway/discord_crash_report';
import { RetrieveTitleAndChapter } from './src/domain/retrieve_title_and_chapter';

const container = new Container();
container.bind<CrashReport>('CrashReport').to(DiscordCrashReport);
container
  .bind<RetrieveTitleAndChapter>('RetrieveTitleAndChapter')
  .to(RetrieveTitleAndChapter);

export { container };

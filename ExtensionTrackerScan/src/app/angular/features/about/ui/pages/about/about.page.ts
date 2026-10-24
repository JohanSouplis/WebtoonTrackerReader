import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { AnswerRatePromptUseCase } from '../../../../../../core/use-cases/answer-rate-prompt.use-case';
import { ChangeParseReportsUseCase } from '../../../../../../core/use-cases/change-parse-reports.use-case';
import { StopIgnoringSiteUseCase } from '../../../../../../core/use-cases/stop-ignoring-site.use-case';
import manifest from '../../../../../../../manifest.json';
import {
  REPORT_SETTINGS_REPOSITORY,
  SERIES_SUGGESTIONS_REPOSITORY,
  STORE_LISTING,
} from '../../../../../injection-tokens';
import { AboutSectionsComponent } from '../../organisms/about-sections/about-sections.component';
import { AboutStore } from './about.store';

@Component({
  selector: 'app-about',
  imports: [AboutSectionsComponent],
  templateUrl: './about.page.html',
  styleUrl: './about.page.css',
  providers: [AboutStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage implements OnInit {
  private readonly settingsRepository = inject(REPORT_SETTINGS_REPOSITORY);
  private readonly changeParseReports = inject(ChangeParseReportsUseCase);
  private readonly suggestionsRepository = inject(
    SERIES_SUGGESTIONS_REPOSITORY,
  );
  private readonly stopIgnoringSiteUseCase = inject(StopIgnoringSiteUseCase);
  private readonly answerRatePrompt = inject(AnswerRatePromptUseCase);
  private readonly storeListing = inject(STORE_LISTING);
  protected readonly store = inject(AboutStore);
  protected readonly version = manifest.version;

  ngOnInit(): void {
    this.settingsRepository
      .load()
      .then((settings) => this.store.showReportSettings(settings))
      .catch((error: unknown) =>
        console.error('Error retrieving the report settings:', error),
      );
    this.suggestionsRepository
      .load()
      .then((suggestions) =>
        this.store.showIgnoredSites(suggestions.ignoredHosts()),
      )
      .catch((error: unknown) =>
        console.error('Error retrieving the ignored sites:', error),
      );
  }

  protected async stopIgnoringSite(host: string): Promise<void> {
    this.store.showIgnoredSites(
      await this.stopIgnoringSiteUseCase.execute(host),
    );
  }

  protected async toggleParseReports(isWanted: boolean): Promise<void> {
    this.store.showReportSettings(
      await this.changeParseReports.execute(isWanted),
    );
  }

  protected async openReviews(): Promise<void> {
    await this.answerRatePrompt.execute('rate');
    this.storeListing.openReviews();
  }
}

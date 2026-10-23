import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { ChangeParseReportsUseCase } from '../../../../../../core/use-cases/change-parse-reports.use-case';
import manifest from '../../../../../../../manifest.json';
import { REPORT_SETTINGS_REPOSITORY } from '../../../../../injection-tokens';
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
  protected readonly store = inject(AboutStore);
  protected readonly version = manifest.version;

  ngOnInit(): void {
    this.settingsRepository
      .load()
      .then((settings) => this.store.showReportSettings(settings))
      .catch((error: unknown) =>
        console.error('Error retrieving the report settings:', error),
      );
  }

  protected async toggleParseReports(isWanted: boolean): Promise<void> {
    this.store.showReportSettings(
      await this.changeParseReports.execute(isWanted),
    );
  }
}

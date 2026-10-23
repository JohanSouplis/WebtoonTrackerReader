import {
  ChangeDetectionStrategy,
  Component,
  inject,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
} from '@angular/forms';
import { VERIFIED_WEBSITES } from '../../../../../../core/domain/verified-websites';
import { ProposeWebsiteUseCase } from '../../../../../../core/use-cases/propose-website.use-case';
import { isChapterUrl } from '../../../service/site-request.rules';
import { VerifiedWebsitesComponent } from '../../organisms/verified-websites/verified-websites.component';
import { WebsiteProposalFormComponent } from '../../organisms/website-proposal-form/website-proposal-form.component';
import { WebsiteProposalForm } from '../../organisms/website-proposal-form/website-proposal-form.types';
import { AddWebsitePatternStore } from './add-website-pattern.store';

const chapterUrl = (
  control: AbstractControl<string>,
): ValidationErrors | null =>
  isChapterUrl(control.value) ? null : { chapterUrl: true };

@Component({
  selector: 'app-add-website-pattern',
  imports: [WebsiteProposalFormComponent, VerifiedWebsitesComponent],
  templateUrl: './add-website-pattern.page.html',
  styleUrl: './add-website-pattern.page.css',
  providers: [AddWebsitePatternStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddWebsitePatternPage {
  private readonly proposeWebsite = inject(ProposeWebsiteUseCase);
  private readonly proposalForm = viewChild.required(
    WebsiteProposalFormComponent,
  );
  protected readonly store = inject(AddWebsitePatternStore);
  protected readonly verifiedWebsites = VERIFIED_WEBSITES.map(
    ({ host }) => host,
  );
  protected readonly form: WebsiteProposalForm = new FormGroup({
    website: new FormControl('', {
      nonNullable: true,
      validators: chapterUrl,
    }),
  });

  protected async propose(url: string): Promise<void> {
    this.store.startSending();
    try {
      const outcome = await this.proposeWebsite.execute(url);
      this.store.showOutcome(outcome);
      if (outcome === 'sent') {
        this.form.reset();
      }
    } catch (error: unknown) {
      console.error('Error sending the site request:', error);
      this.store.showFailure();
    }
  }

  protected requestSite(query: string): void {
    if (isChapterUrl(query)) {
      this.form.setValue({ website: query.trim() });
    }
    this.store.edit();
    this.proposalForm().focus();
  }
}

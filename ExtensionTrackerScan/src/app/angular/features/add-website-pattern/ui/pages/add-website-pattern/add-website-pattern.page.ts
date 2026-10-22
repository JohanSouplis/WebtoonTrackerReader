import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VERIFIED_WEBSITES } from '../../../../../../core/domain/verified-websites';
import { ProposeWebsiteUseCase } from '../../../../../../core/use-cases/propose-website.use-case';
import { VerifiedWebsitesComponent } from '../../organisms/verified-websites/verified-websites.component';
import { WebsiteProposalFormComponent } from '../../organisms/website-proposal-form/website-proposal-form.component';
import { WebsiteProposalForm } from '../../organisms/website-proposal-form/website-proposal-form.types';

@Component({
  selector: 'app-add-website-pattern',
  imports: [WebsiteProposalFormComponent, VerifiedWebsitesComponent],
  templateUrl: './add-website-pattern.page.html',
  styleUrl: './add-website-pattern.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddWebsitePatternPage {
  private readonly proposeWebsite = inject(ProposeWebsiteUseCase);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly verifiedWebsites = VERIFIED_WEBSITES.map(
    ({ host }) => host,
  );
  protected readonly isProposalSent = signal(false);
  protected readonly form: WebsiteProposalForm = new FormGroup({
    website: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
  });

  protected propose(website: string): void {
    this.proposeWebsite.execute(website);
    this.form.reset();
    this.isProposalSent.set(true);
    this.snackBar
      .open('Website proposed. Thanks!', 'Dismiss', {
        duration: 4500,
        panelClass: 'is-success',
      })
      .afterDismissed()
      .subscribe(() => this.isProposalSent.set(false));
  }
}

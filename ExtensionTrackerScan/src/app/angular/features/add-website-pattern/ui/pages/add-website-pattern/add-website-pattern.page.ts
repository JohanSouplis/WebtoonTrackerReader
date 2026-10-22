import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ProposeWebsiteUseCase } from '../../../../../../core/use-cases/propose-website.use-case';
import { SupportedWebsitesTableComponent } from '../../organisms/supported-websites-table/supported-websites-table.component';
import { WebsiteProposalFormComponent } from '../../organisms/website-proposal-form/website-proposal-form.component';
import { WebsiteProposalForm } from '../../organisms/website-proposal-form/website-proposal-form.types';

const SUPPORTED_WEBSITES = [
  'toonily.com',
  'asuracomic.net',
  'manhuatop.org',
  'arvencomics.com',
  'vortexscans.org',
  'manhuaus.com',
  'manhuafast.net',
  'comick.io',
  'reaper-scan.net',
  'en-thunderscans.com',
  'dragontea.ink',
  'toongod.org',
  'mangadex.org',
  'chapmanganato.to',
  'chapmanganelo.com',
  'scantrad-union.com',
  'manta.net',
  'webtoons.com',
  'tappytoon.com',
  'mangapanda.in',
  'toomics.com',
  'comics.inkr.com',
  'pocketcomics.com',
  'bato.to',
  'mangapark',
  'manhuaplus.com',
  'raijinscan',
  'mangaplus.shueisha.co.jp',
  'mangainn.org',
  'mangadistrict.com',
  'manhuaplus.org',
  'manhwahub.net',
  '1st-kissmanga',
  'templetoons.com',
  'mangafire.to',
  'kunmanga.com',
];

@Component({
  selector: 'app-add-website-pattern',
  imports: [WebsiteProposalFormComponent, SupportedWebsitesTableComponent],
  templateUrl: './add-website-pattern.page.html',
  styleUrl: './add-website-pattern.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddWebsitePatternPage {
  private readonly proposeWebsite = inject(ProposeWebsiteUseCase);
  protected readonly supportedWebsites = SUPPORTED_WEBSITES;
  protected readonly isProposalSent = signal(false);
  protected readonly form: WebsiteProposalForm = new FormGroup({
    website: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
  });

  protected propose(website: string): void {
    this.isProposalSent.set(true);
    this.proposeWebsite.execute(website);
    this.form.reset();
    setTimeout(() => this.isProposalSent.set(false), 3000);
  }
}

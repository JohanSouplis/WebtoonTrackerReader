import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MonogramComponent } from '../../../../../design-system/atoms/monogram/monogram.component';
import { SearchFieldComponent } from '../../../../../design-system/molecules/search-field/search-field.component';
import { matchWebsites } from '../../../service/site-request.rules';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-verified-websites',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MonogramComponent,
    SearchFieldComponent,
  ],
  templateUrl: './verified-websites.component.html',
  styleUrl: './verified-websites.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifiedWebsitesComponent {
  readonly websites = input.required<readonly string[]>();
  readonly siteRequested = output<string>();
  protected readonly pageSize = PAGE_SIZE;
  protected readonly query = signal('');
  protected readonly pageIndex = signal(0);
  protected readonly searchedWebsite = computed(() => this.query().trim());
  protected readonly matchingWebsites = computed(() =>
    matchWebsites(this.websites(), this.searchedWebsite()),
  );
  protected readonly shownWebsites = computed(() =>
    this.matchingWebsites().slice(
      this.pageIndex() * PAGE_SIZE,
      (this.pageIndex() + 1) * PAGE_SIZE,
    ),
  );

  protected search(query: string): void {
    this.query.set(query);
    this.pageIndex.set(0);
  }

  protected turnPage({ pageIndex }: PageEvent): void {
    this.pageIndex.set(pageIndex);
  }
}

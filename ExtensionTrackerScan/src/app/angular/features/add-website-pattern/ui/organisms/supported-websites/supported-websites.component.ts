import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MonogramComponent } from '../../../../../design-system/atoms/monogram/monogram.component';
import { SearchFieldComponent } from '../../../../../design-system/molecules/search-field/search-field.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-supported-websites',
  imports: [
    MatIconModule,
    MatPaginatorModule,
    MonogramComponent,
    SearchFieldComponent,
  ],
  templateUrl: './supported-websites.component.html',
  styleUrl: './supported-websites.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportedWebsitesComponent {
  readonly websites = input.required<readonly string[]>();
  protected readonly pageSize = PAGE_SIZE;
  protected readonly query = signal('');
  protected readonly pageIndex = signal(0);
  protected readonly searchedWebsite = computed(() => this.query().trim());
  protected readonly matchingWebsites = computed(() => {
    const query = this.searchedWebsite().toLowerCase();
    return this.websites().filter((website) =>
      website.toLowerCase().includes(query),
    );
  });
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

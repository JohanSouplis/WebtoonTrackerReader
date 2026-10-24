import { animate, style, transition, trigger } from '@angular/animations';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CoverComponent } from '../../../../../design-system/atoms/cover/cover.component';
import { BellToggleComponent } from '../../../../../design-system/atoms/bell-toggle/bell-toggle.component';
import { InlineEditComponent } from '../../../../../design-system/molecules/inline-edit/inline-edit.component';
import { MonogramComponent } from '../../../../../design-system/atoms/monogram/monogram.component';
import { RelativeDateComponent } from '../../../../../design-system/atoms/relative-date/relative-date.component';
import { ScanListView, ScanPage } from '../../../service/scan-list-view.vm';
import { ScanRow } from '../../../service/scan-row.vm';
import { ScanRating, ScanRename } from './scan-rows.types';

const SHIFTED_ROW_GUARD_MS = 300;

@Component({
  selector: 'app-scan-rows',
  imports: [
    BellToggleComponent,
    CoverComponent,
    InlineEditComponent,
    MatIconModule,
    MatPaginatorModule,
    MatMenuModule,
    MatTooltipModule,
    MonogramComponent,
    RelativeDateComponent,
  ],
  templateUrl: './scan-rows.component.html',
  styleUrl: './scan-rows.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('row', [
      transition(':leave', [
        animate(
          '200ms ease',
          style({
            opacity: 0,
            transform: 'translateX(24px)',
            height: 0,
            marginBottom: '-6px',
          }),
        ),
      ]),
    ]),
  ],
})
export class ScanRowsComponent {
  readonly view = input.required<ScanListView>();
  readonly now = input.required<Date>();
  readonly deleted = output<ScanRow>();
  readonly favoriteToggled = output<ScanRow>();
  readonly rated = output<ScanRating>();
  readonly ratingCleared = output<ScanRow>();
  readonly renamed = output<ScanRename>();
  readonly mergeRequested = output<ScanRow>();
  readonly pageTurned = output<ScanPage>();
  readonly filtersCleared = output<void>();
  readonly retried = output<void>();
  readonly newChapterOpened = output<void>();
  protected readonly skeletonRows = [0, 1, 2, 3, 4];
  protected readonly ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  protected readonly pageSizes = [5, 10, 20, 50, 100];
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');
  private readonly titleLinks =
    viewChildren<ElementRef<HTMLElement>>('titleLink');
  private lastDeleteAt = -Infinity;
  protected readonly renamingTitle = signal<string | undefined>(undefined);
  private readonly focusedTitle = signal<string | undefined>(undefined);
  private readonly shownTitles = computed(() => {
    const view = this.view();
    return view.kind === 'scans' ? view.rows.map(({ title }) => title) : [];
  });

  constructor() {
    afterRenderEffect(() => {
      const title = this.focusedTitle();
      if (title === undefined) {
        return;
      }
      const links = this.titleLinks();
      const link = links.find(
        ({ nativeElement }) => nativeElement.textContent?.trim() === title,
      );
      link?.nativeElement.focus();
      if (link || links.length === this.shownTitles().length) {
        this.focusedTitle.set(undefined);
      }
    });
  }

  focus(): void {
    this.list()?.nativeElement.focus();
  }

  focusTitle(title: string): void {
    this.focusedTitle.set(title);
  }

  protected startRenaming(row: ScanRow): void {
    this.renamingTitle.set(row.title);
  }

  protected stopRenaming(row: ScanRow): void {
    this.renamingTitle.set(undefined);
    this.focusTitle(row.title);
  }

  protected rename(row: ScanRow, title: string): void {
    this.renamingTitle.set(undefined);
    this.renamed.emit({ scan: row, title });
  }

  protected delete(row: ScanRow, index: number, click: MouseEvent): void {
    if (click.timeStamp - this.lastDeleteAt < SHIFTED_ROW_GUARD_MS) {
      return;
    }
    this.lastDeleteAt = click.timeStamp;
    const links = this.titleLinks();
    const neighbor = links[index + 1] ?? links[index - 1];
    (neighbor ?? this.list())?.nativeElement.focus({ preventScroll: true });
    this.deleted.emit(row);
  }
}

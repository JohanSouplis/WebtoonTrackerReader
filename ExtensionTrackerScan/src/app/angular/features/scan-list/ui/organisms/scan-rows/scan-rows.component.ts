import { animate, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { CoverComponent } from '../../../../../design-system/atoms/cover/cover.component';
import { MonogramComponent } from '../../../../../design-system/atoms/monogram/monogram.component';
import { RelativeDateComponent } from '../../../../../design-system/atoms/relative-date/relative-date.component';
import { StarToggleComponent } from '../../../../../design-system/atoms/star-toggle/star-toggle.component';
import { TruncatedTextComponent } from '../../../../../design-system/atoms/truncated-text/truncated-text.component';
import { ScanListView, ScanPage } from '../../../service/scan-list-view.vm';
import { ScanRow } from '../../../service/scan-row.vm';
import { ScanRating } from './scan-rows.types';

@Component({
  selector: 'app-scan-rows',
  imports: [
    CoverComponent,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule,
    MonogramComponent,
    RelativeDateComponent,
    StarToggleComponent,
    TruncatedTextComponent,
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
  readonly pageTurned = output<ScanPage>();
  readonly filtersCleared = output<void>();
  protected readonly ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  protected readonly pageSizes = [5, 10, 20, 50, 100];
}

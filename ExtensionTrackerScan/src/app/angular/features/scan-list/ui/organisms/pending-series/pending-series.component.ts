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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MonogramComponent } from '../../../../../design-system/atoms/monogram/monogram.component';
import { RelativeDateComponent } from '../../../../../design-system/atoms/relative-date/relative-date.component';
import { InlineEditComponent } from '../../../../../design-system/molecules/inline-edit/inline-edit.component';
import {
  PendingSeriesCard,
  PendingSeriesGroup,
} from '../../../service/pending-series.vm';
import { PendingSeriesRename } from './pending-series.types';

type FocusRequest = {
  readonly key: string;
  readonly index: number;
  readonly isLeaving: boolean;
};

@Component({
  selector: 'app-pending-series',
  imports: [
    InlineEditComponent,
    MatIconModule,
    MatTooltipModule,
    MonogramComponent,
    RelativeDateComponent,
  ],
  templateUrl: './pending-series.component.html',
  styleUrl: './pending-series.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingSeriesComponent {
  readonly groups = input.required<readonly PendingSeriesGroup[]>();
  readonly now = input.required<Date>();
  readonly added = output<PendingSeriesCard>();
  readonly renamed = output<PendingSeriesRename>();
  readonly dismissed = output<PendingSeriesCard>();
  readonly mergeRequested = output<PendingSeriesCard>();
  readonly siteAdded = output<string>();
  protected readonly isOpen = signal(false);
  protected readonly editingKey = signal<string | undefined>(undefined);
  protected readonly count = computed(() =>
    this.groups().reduce((sum, { cards }) => sum + cards.length, 0),
  );
  private readonly cards = computed(() =>
    this.groups().flatMap(({ cards }) => cards),
  );
  private readonly toggle =
    viewChild.required<ElementRef<HTMLButtonElement>>('toggle');
  private readonly addButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('addButton');
  private readonly focusRequest = signal<FocusRequest | undefined>(undefined);

  constructor() {
    afterRenderEffect(() => {
      const request = this.focusRequest();
      if (request === undefined) {
        return;
      }
      const cards = this.cards();
      const shownIndex = cards.findIndex(({ key }) => key === request.key);
      if (request.isLeaving && shownIndex !== -1) {
        return;
      }
      const buttons = this.addButtons();
      const index = request.isLeaving ? request.index : shownIndex;
      (
        buttons[Math.min(index, buttons.length - 1)] ?? this.toggle()
      ).nativeElement.focus();
      this.focusRequest.set(undefined);
    });
  }

  focusCard(card: PendingSeriesCard): void {
    this.focusRequest.set({ key: card.key, index: 0, isLeaving: false });
  }

  protected switchOpen(): void {
    this.isOpen.update((isOpen) => !isOpen);
  }

  protected add(card: PendingSeriesCard): void {
    this.leave(card);
    this.added.emit(card);
  }

  protected dismiss(card: PendingSeriesCard): void {
    this.leave(card);
    this.dismissed.emit(card);
  }

  protected merge(card: PendingSeriesCard): void {
    this.leave(card);
    this.mergeRequested.emit(card);
  }

  protected addSite({ host, cards }: PendingSeriesGroup): void {
    this.leave(cards[0]);
    this.siteAdded.emit(host);
  }

  protected startEditing(card: PendingSeriesCard): void {
    this.editingKey.set(card.key);
  }

  protected stopEditing(card: PendingSeriesCard): void {
    this.editingKey.set(undefined);
    this.focusCard(card);
  }

  protected rename(card: PendingSeriesCard, title: string): void {
    this.editingKey.set(undefined);
    this.leave(card);
    this.renamed.emit({ card, title });
  }

  private leave(card: PendingSeriesCard): void {
    this.focusRequest.set({
      key: card.key,
      index: this.cards().findIndex(({ key }) => key === card.key),
      isLeaving: true,
    });
  }
}

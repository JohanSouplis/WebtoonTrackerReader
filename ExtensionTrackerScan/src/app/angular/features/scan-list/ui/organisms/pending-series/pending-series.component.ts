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

type FocusRequest =
  | { readonly kind: 'card'; readonly key: string }
  | {
      readonly kind: 'after-leaving';
      readonly key: string;
      readonly nextKey?: string;
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
      const indexOf = (shown?: string) =>
        cards.findIndex(({ key }) => key === shown);
      if (request.kind === 'after-leaving' && indexOf(request.key) !== -1) {
        return;
      }
      const index = indexOf(
        request.kind === 'card' ? request.key : request.nextKey,
      );
      (
        this.addButtons()[Math.max(index, 0)] ?? this.toggle()
      ).nativeElement.focus();
      this.focusRequest.set(undefined);
    });
  }

  focusCard(card: PendingSeriesCard): void {
    this.focusRequest.set({ kind: 'card', key: card.key });
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
    this.focusRequest.set({
      kind: 'after-leaving',
      key: cards[0].key,
      nextKey: this.cards().find((card) => card.host !== host)?.key,
    });
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
    const cards = this.cards();
    const index = cards.findIndex(({ key }) => key === card.key);
    this.focusRequest.set({
      kind: 'after-leaving',
      key: card.key,
      nextKey: (cards[index + 1] ?? cards[index - 1])?.key,
    });
  }
}

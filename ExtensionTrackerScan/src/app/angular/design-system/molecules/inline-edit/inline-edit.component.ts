import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'ds-inline-edit',
  imports: [MatIconModule],
  templateUrl: './inline-edit.component.html',
  styleUrl: './inline-edit.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineEditComponent implements AfterViewInit {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly saved = output<string>();
  readonly cancelled = output<void>();
  private readonly field =
    viewChild.required<ElementRef<HTMLInputElement>>('field');

  ngAfterViewInit(): void {
    this.field().nativeElement.focus();
    this.field().nativeElement.select();
  }

  protected save(submit: Event): void {
    submit.preventDefault();
    const text = this.field().nativeElement.value.trim();
    if (text === '') {
      return;
    }
    if (text === this.value()) {
      this.cancelled.emit();
      return;
    }
    this.saved.emit(text);
  }
}

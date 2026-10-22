import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'ds-search-field',
  imports: [MatFormFieldModule, MatInputModule],
  templateUrl: './search-field.component.html',
  styleUrl: './search-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFieldComponent {
  readonly label = input.required<string>();
  readonly searched = output<string>();

  protected search(text: string): void {
    this.searched.emit(text.trim().toLowerCase());
  }
}

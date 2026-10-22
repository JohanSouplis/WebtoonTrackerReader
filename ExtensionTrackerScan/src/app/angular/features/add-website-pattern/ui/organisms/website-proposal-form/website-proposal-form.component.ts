import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { WebsiteProposalForm } from './website-proposal-form.types';

@Component({
  selector: 'app-website-proposal-form',
  imports: [ReactiveFormsModule],
  templateUrl: './website-proposal-form.component.html',
  styleUrl: './website-proposal-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProposalFormComponent {
  readonly form = input.required<WebsiteProposalForm>();
  readonly isProposalSent = input.required<boolean>();
  readonly proposed = output<string>();

  protected propose(): void {
    this.proposed.emit(this.form().getRawValue().website);
  }
}

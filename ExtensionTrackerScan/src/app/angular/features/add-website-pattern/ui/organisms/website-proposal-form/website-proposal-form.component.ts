import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WebsiteProposalForm } from './website-proposal-form.types';

@Component({
  selector: 'app-website-proposal-form',
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule],
  templateUrl: './website-proposal-form.component.html',
  styleUrl: './website-proposal-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProposalFormComponent {
  readonly form = input.required<WebsiteProposalForm>();
  readonly isProposalSent = input.required<boolean>();
  readonly proposed = output<string>();
  protected readonly submit = computed(() =>
    this.isProposalSent()
      ? { icon: 'check', label: 'Sent' }
      : { icon: 'send', label: 'Propose' },
  );

  protected propose(): void {
    this.proposed.emit(this.form().getRawValue().website.trim());
  }
}

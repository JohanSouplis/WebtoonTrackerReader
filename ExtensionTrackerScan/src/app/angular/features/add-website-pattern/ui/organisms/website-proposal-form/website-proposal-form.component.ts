import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProposalStatus } from '../../../service/site-request.rules';
import { WebsiteProposalForm } from './website-proposal-form.types';

type StatusView = {
  readonly icon: string;
  readonly label: string;
  readonly isSubmitDisabled: boolean;
  readonly message: string;
};

const STATUS_VIEWS: Readonly<Record<ProposalStatus, StatusView>> = {
  idle: {
    icon: 'send',
    label: 'Send request',
    isSubmitDisabled: false,
    message: '',
  },
  sending: {
    icon: 'send',
    label: 'Sending…',
    isSubmitDisabled: true,
    message: '',
  },
  sent: {
    icon: 'check',
    label: 'Sent',
    isSubmitDisabled: true,
    message: "Thanks, we'll review it.",
  },
  'already-supported': {
    icon: 'check',
    label: 'Send request',
    isSubmitDisabled: true,
    message:
      'Already supported. Read a chapter on this site and it shows up in your library.',
  },
  failed: {
    icon: 'refresh',
    label: 'Retry',
    isSubmitDisabled: false,
    message: "Couldn't send. Check your connection and retry.",
  },
};

@Component({
  selector: 'app-website-proposal-form',
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule],
  templateUrl: './website-proposal-form.component.html',
  styleUrl: './website-proposal-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProposalFormComponent {
  readonly form = input.required<WebsiteProposalForm>();
  readonly status = input.required<ProposalStatus>();
  readonly proposed = output<string>();
  readonly edited = output<void>();
  private readonly field =
    viewChild.required<ElementRef<HTMLInputElement>>('field');
  protected readonly view = computed(() => STATUS_VIEWS[this.status()]);

  focus(): void {
    this.field().nativeElement.focus();
  }

  protected propose(): void {
    if (this.form().valid && !this.view().isSubmitDisabled) {
      this.proposed.emit(this.form().getRawValue().website.trim());
    }
  }
}

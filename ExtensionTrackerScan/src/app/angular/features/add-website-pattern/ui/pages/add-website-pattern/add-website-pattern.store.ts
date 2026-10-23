import { Injectable, signal } from '@angular/core';
import { WebsiteProposalOutcome } from '../../../../../../core/use-cases/propose-website.use-case';
import { ProposalStatus } from '../../../service/site-request.rules';

@Injectable()
export class AddWebsitePatternStore {
  private readonly status = signal<ProposalStatus>('idle');
  readonly proposalStatus = this.status.asReadonly();

  startSending(): void {
    this.status.set('sending');
  }

  showOutcome(outcome: WebsiteProposalOutcome): void {
    this.status.set(outcome);
  }

  showFailure(): void {
    this.status.set('failed');
  }

  edit(): void {
    this.status.update((status) => (status === 'sending' ? status : 'idle'));
  }
}

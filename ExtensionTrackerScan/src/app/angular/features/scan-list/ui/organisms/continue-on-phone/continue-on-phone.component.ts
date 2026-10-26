import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { QrCodeComponent } from '../../../../../design-system/atoms/qr-code/qr-code.component';
import { PhoneHandoff } from '../../../service/scan-row.vm';

export const CONTINUE_ON_PHONE_HEADING_ID = 'continue-on-phone-heading';

@Component({
  selector: 'app-continue-on-phone',
  imports: [QrCodeComponent],
  templateUrl: './continue-on-phone.component.html',
  styleUrl: './continue-on-phone.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContinueOnPhoneComponent {
  readonly handoff = input.required<PhoneHandoff>();
  readonly closed = output<void>();
  protected readonly headingId = CONTINUE_ON_PHONE_HEADING_ID;
}

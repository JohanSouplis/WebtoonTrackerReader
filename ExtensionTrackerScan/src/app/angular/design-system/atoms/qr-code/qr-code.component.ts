import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import qrcode from 'qrcode-generator';

const QUIET_ZONE = 4;

const asBytes = (text: string): string =>
  Array.from(new TextEncoder().encode(text), (byte) =>
    String.fromCharCode(byte),
  ).join('');

const darkRunsOf = (code: ReturnType<typeof qrcode>): string => {
  const size = code.getModuleCount();
  const runs: string[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!code.isDark(row, col) || (col > 0 && code.isDark(row, col - 1))) {
        continue;
      }
      let length = 1;
      while (col + length < size && code.isDark(row, col + length)) {
        length += 1;
      }
      runs.push(
        `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h${length}v1h-${length}z`,
      );
    }
  }
  return runs.join('');
};

@Component({
  selector: 'ds-qr-code',
  templateUrl: './qr-code.component.html',
  styleUrl: './qr-code.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': 'label()' },
})
export class QrCodeComponent {
  readonly text = input.required<string>();
  readonly label = input.required<string>();
  protected readonly code = computed(() => {
    const code = qrcode(0, 'M');
    // qrcode-generator keeps the low byte of each char code: hand it UTF-8 bytes.
    code.addData(asBytes(this.text()), 'Byte');
    code.make();
    const side = code.getModuleCount() + 2 * QUIET_ZONE;
    return { viewBox: `0 0 ${side} ${side}`, path: darkRunsOf(code) };
  });
}

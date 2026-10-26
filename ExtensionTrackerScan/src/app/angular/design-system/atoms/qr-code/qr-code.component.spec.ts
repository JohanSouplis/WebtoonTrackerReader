import { render, screen } from '@testing-library/angular';
import qrcode from 'qrcode-generator';
import { QrCodeComponent } from './qr-code.component';

describe('QrCodeComponent', () => {
  it('should name the code with its label for assistive technology', async () => {
    await renderCode('https://asuracomic.net/series/solo-leveling/chapter/38');

    expect(
      screen.getByRole('img', { name: 'QR code of the chapter address' }),
    ).toBeInTheDocument();
  });

  it('should draw the modules of the text inside a white quiet zone of four modules', async () => {
    const text = 'https://asuracomic.net/series/solo-leveling/chapter/38';
    const { container } = await renderCode(text);

    const expected = modulesOf(text);
    expect(viewBoxOf(container)).toBe(
      `0 0 ${expected.size + 8} ${expected.size + 8}`,
    );
    expect(darkCellsOf(container)).toEqual(
      expected.dark.map(([row, col]) => [row + 4, col + 4]),
    );
  });

  it('should encode a text outside ASCII as UTF-8, as phone cameras read it', async () => {
    const text = 'https://mangalib.me/герой-возвращается/v1/c129';
    const { container } = await renderCode(text);

    expect(darkCellsOf(container)).toEqual(
      modulesOf(unescape(encodeURIComponent(text))).dark.map(([row, col]) => [
        row + 4,
        col + 4,
      ]),
    );
  });

  it('should stay black on white whatever the theme, so a camera can read it', async () => {
    const { container } = await renderCode('https://a.example/1');

    expect(container.querySelector('rect')).toHaveAttribute('fill', '#fff');
    expect(container.querySelector('path')).toHaveAttribute('fill', '#000');
  });
});

const renderCode = async (text: string) =>
  render(QrCodeComponent, {
    inputs: { text, label: 'QR code of the chapter address' },
  });

const modulesOf = (bytes: string) => {
  const code = qrcode(0, 'M');
  code.addData(bytes, 'Byte');
  code.make();
  const size = code.getModuleCount();
  const dark: [number, number][] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (code.isDark(row, col)) {
        dark.push([row, col]);
      }
    }
  }
  return { size, dark };
};

const viewBoxOf = (container: Element): string | null =>
  container.querySelector('svg')?.getAttribute('viewBox') ?? null;

const darkCellsOf = (container: Element): [number, number][] => {
  const path = container.querySelector('path')?.getAttribute('d') ?? '';
  return Array.from(path.matchAll(/M(\d+) (\d+)h(\d+)/g)).flatMap(
    ([, col, row, length]) =>
      Array.from({ length: Number(length) }, (_, offset): [number, number] => [
        Number(row),
        Number(col) + offset,
      ]),
  );
};

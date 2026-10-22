import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const OUTPUT = new URL(
  '../src/app/core/gateways/in-memory/dev-covers.ts',
  import.meta.url,
);

const COVERS = [
  { title: 'Omniscient Reader’s Viewpoint', hue: 214 },
  { title: 'The Executioner', hue: 352 },
  { title: 'I Obtained a Mythic Item', hue: 42 },
  { title: 'Duke Pendragon', hue: 152 },
  { title: 'Solo Leveling: Ragnarok', hue: 268 },
  { title: 'Pick Me Up, Infinite Gacha', hue: 186 },
];

const paint = ({ hue }) => {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const sky = context.createLinearGradient(0, 0, 0, 128);
  sky.addColorStop(0, `hsl(${hue} 70% 62%)`);
  sky.addColorStop(1, `hsl(${hue + 40} 55% 18%)`);
  context.fillStyle = sky;
  context.fillRect(0, 0, 96, 128);
  context.fillStyle = `hsl(${hue + 180} 80% 85% / 0.85)`;
  context.beginPath();
  context.arc(66, 34, 16, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = `hsl(${hue + 20} 45% 12%)`;
  context.beginPath();
  context.moveTo(0, 128);
  context.lineTo(0, 92);
  context.lineTo(30, 70);
  context.lineTo(52, 88);
  context.lineTo(78, 62);
  context.lineTo(96, 80);
  context.lineTo(96, 128);
  context.fill();
  return canvas.toDataURL('image/webp', 0.8);
};

const browser = await chromium.launch();
const page = await browser.newPage();
const covers = [];
for (const cover of COVERS) {
  covers.push({ ...cover, dataUrl: await page.evaluate(paint, cover) });
}
await browser.close();

await writeFile(
  OUTPUT,
  `import { Cover, Thumbnail } from '../../domain/cover';

const thumbnail = (dataUrl: string): Thumbnail => {
  const parsed = Thumbnail.parse(dataUrl);
  if (!parsed) {
    throw new Error('A dev cover is not a thumbnail');
  }
  return parsed;
};

const found = (dataUrl: string): Cover => ({
  kind: 'found',
  thumbnail: thumbnail(dataUrl),
  from: 'page',
  at: new Date('2025-01-24T18:00:00Z'),
});

export const DEV_COVERS: Readonly<Record<string, Cover>> = {
${covers.map(({ title, dataUrl }) => `  ${JSON.stringify(title)}: found(\n    '${dataUrl}',\n  ),`).join('\n')}
};
`,
);
console.log(
  covers.map(({ title, dataUrl }) => `${title}: ${dataUrl.length}`).join('\n'),
);

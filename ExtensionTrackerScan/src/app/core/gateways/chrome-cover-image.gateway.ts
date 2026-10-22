import { Thumbnail } from '../domain/cover';
import { CoverCandidate, CoverImage } from '../domain/cover-search';
import { CoverImagePort } from '../ports/cover-image.port';

const THUMBNAIL = { width: 96, height: 128, quality: 0.8 };

const ruleIdOf = (host: string): number =>
  1 +
  host
    .split('')
    .reduce((id, char) => (id * 31 + char.charCodeAt(0)) % 1000000, 7);

const fetchWithReferer = async (
  imageUrl: string,
  refererUrl: string,
): Promise<Response> => {
  const host = new URL(imageUrl).hostname;
  const id = ruleIdOf(host);
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [id],
    addRules: [
      {
        id,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
          requestHeaders: [
            {
              header: 'referer',
              operation: chrome.declarativeNetRequest.HeaderOperation.SET,
              value: refererUrl,
            },
          ],
        },
        condition: {
          initiatorDomains: [chrome.runtime.id],
          requestDomains: [host],
          resourceTypes: [
            chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
          ],
        },
      },
    ],
  });
  try {
    return await fetch(imageUrl, { credentials: 'include' });
  } finally {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [id],
    });
  }
};

const dataUrlOf = async (blob: Blob): Promise<string> => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `data:${blob.type};base64,${btoa(binary)}`;
};

const thumbnailOf = async (
  image: ImageBitmap,
): Promise<Thumbnail | undefined> => {
  const { width, height, quality } = THUMBNAIL;
  const scale = Math.max(width / image.width, height / image.height);
  const canvas = new OffscreenCanvas(width, height);
  canvas
    .getContext('2d')
    ?.drawImage(
      image,
      (width - image.width * scale) / 2,
      (height - image.height * scale) / 2,
      image.width * scale,
      image.height * scale,
    );
  const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
  return Thumbnail.parse(await dataUrlOf(blob));
};

export class ChromeCoverImages implements CoverImagePort {
  async download({
    imageUrl,
    refererUrl,
  }: CoverCandidate): Promise<CoverImage | undefined> {
    try {
      const response = refererUrl
        ? await fetchWithReferer(imageUrl, refererUrl)
        : await fetch(imageUrl, { credentials: 'include' });
      if (!response.ok) {
        return undefined;
      }
      const image = await createImageBitmap(await response.blob());
      const thumbnail = await thumbnailOf(image);
      return thumbnail
        ? { width: image.width, height: image.height, thumbnail }
        : undefined;
    } catch {
      return undefined;
    }
  }
}

import { parsePageSignals } from '../../../page-signals-message';
import { PageSignals } from '../domain/parsed-page';
import { PageReaderPort } from '../ports/page-reader.port';

export type ReadPageMessage = {
  readonly kind: 'read-page';
  readonly url: string;
};

const OFFSCREEN_DOCUMENT = 'offscreen.html';

let creatingDocument: Promise<void> | undefined;

const openOffscreenDocument = async (): Promise<void> => {
  if (await chrome.offscreen.hasDocument()) {
    return;
  }
  creatingDocument ??= chrome.offscreen
    .createDocument({
      url: OFFSCREEN_DOCUMENT,
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Read the series page of a scan to find its cover',
    })
    .finally(() => {
      creatingDocument = undefined;
    });
  await creatingDocument;
};

export class ChromeOffscreenPageReader implements PageReaderPort {
  async read(url: string): Promise<PageSignals | undefined> {
    try {
      await openOffscreenDocument();
      const message: ReadPageMessage = { kind: 'read-page', url };
      return parsePageSignals(await chrome.runtime.sendMessage(message));
    } catch {
      return undefined;
    }
  }
}

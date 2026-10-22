import { PageSignalsMessage, StructuredDataNode } from './page-signals-message';

const FIRST_SEND_DELAY_MS = 5000;
const SETTLE_DELAY_MS = 2000;

const textOf = (selector: string): string | undefined =>
  document.querySelector<HTMLElement>(selector)?.innerText;

const metaContent = (property: string): string | undefined =>
  document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
    ?.content;

const structuredDataNodesIn = (value: unknown): StructuredDataNode[] => {
  if (Array.isArray(value)) {
    return value.flatMap(structuredDataNodesIn);
  }
  if (typeof value !== 'object' || value === null) {
    return [];
  }
  const nested = Object.values(value).flatMap(structuredDataNodesIn);
  return '@type' in value
    ? [
        {
          type: value['@type'],
          name: 'name' in value ? value.name : undefined,
          headline: 'headline' in value ? value.headline : undefined,
          position: 'position' in value ? value.position : undefined,
        },
        ...nested,
      ]
    : nested;
};

const parsedJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const structuredData = (): StructuredDataNode[] =>
  Array.from(
    document.querySelectorAll('script[type="application/ld+json"]'),
    (script) => structuredDataNodesIn(parsedJson(script.textContent ?? '')),
  ).flat();

const readPageSignals = (): PageSignalsMessage => ({
  pageTitle: document.title,
  url: window.location.href,
  ogTitle: metaContent('og:title'),
  ogSiteName: metaContent('og:site_name'),
  canonicalUrl: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    ?.href,
  heading: textOf('h1'),
  breadcrumb: textOf(
    'nav[aria-label*="breadcrumb" i], [class*="breadcrumb" i]',
  ),
  structuredData: structuredData(),
  selectedOptions: Array.from(
    document.querySelectorAll('select option:checked'),
    (option) => option.textContent ?? '',
  ),
});

let sentTitle: string | undefined;
let pendingSend: ReturnType<typeof setTimeout> | undefined;

const sendWhenTitleChanged = (): void => {
  if (document.title === sentTitle) {
    return;
  }
  sentTitle = document.title;
  void chrome.runtime.sendMessage(readPageSignals());
};

const sendWhenTitleSettles = (): void => {
  clearTimeout(pendingSend);
  pendingSend = setTimeout(sendWhenTitleChanged, SETTLE_DELAY_MS);
};

setTimeout(() => {
  sendWhenTitleChanged();
  new MutationObserver(sendWhenTitleSettles).observe(document.head, {
    subtree: true,
    childList: true,
    characterData: true,
  });
}, FIRST_SEND_DELAY_MS);

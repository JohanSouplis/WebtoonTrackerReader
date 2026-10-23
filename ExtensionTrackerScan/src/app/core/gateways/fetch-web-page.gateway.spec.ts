import { FetchWebPages } from './fetch-web-page.gateway';

describe('FetchWebPages', () => {
  it('should give the status, final address and text of the page, error pages included', async () => {
    useFetch(async () => ({
      status: 404,
      url: 'https://scans.org/solo-leveling/',
      text: async () => '<title>Not found</title>',
    }));

    expect(
      await new FetchWebPages().fetchPage('https://scans.org/solo-leveling'),
    ).toEqual({
      kind: 'page',
      status: 404,
      url: 'https://scans.org/solo-leveling/',
      text: '<title>Not found</title>',
    });
  });

  it('should tell a page is unreachable when the request fails', async () => {
    useFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    expect(
      await new FetchWebPages().fetchPage('https://scans.org/solo-leveling'),
    ).toEqual({ kind: 'unreachable' });
  });
});

const useFetch = (answer: () => Promise<object>): void => {
  Object.defineProperty(globalThis, 'fetch', {
    value: answer,
    configurable: true,
  });
};

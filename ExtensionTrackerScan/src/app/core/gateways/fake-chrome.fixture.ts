export class FakeChromeStorage {
  constructor(readonly items: Record<string, unknown> = {}) {}

  async get(
    keys: string[] | Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const defaults = Array.isArray(keys)
      ? Object.fromEntries(keys.map((key) => [key, undefined]))
      : keys;
    return Object.fromEntries(
      Object.entries(defaults).map(([key, fallback]) => [
        key,
        structuredClone(this.items[key] ?? fallback),
      ]),
    );
  }

  async set(items: Record<string, unknown>): Promise<void> {
    Object.assign(this.items, JSON.parse(JSON.stringify(items)));
  }
}

export const installChrome = (chrome: object): void => {
  Object.defineProperty(globalThis, 'chrome', {
    value: chrome,
    configurable: true,
  });
};

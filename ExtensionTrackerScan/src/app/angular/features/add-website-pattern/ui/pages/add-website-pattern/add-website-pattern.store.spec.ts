import { AddWebsitePatternStore } from './add-website-pattern.store';

describe('AddWebsitePatternStore', () => {
  it('should go back to a fresh request when the reader edits the address after an answer', () => {
    const store = new AddWebsitePatternStore();
    store.startSending();
    store.showOutcome('already-supported');

    store.edit();

    expect(store.proposalStatus()).toBe('idle');
  });

  it('should keep sending when the reader edits the address while it is sent', () => {
    const store = new AddWebsitePatternStore();
    store.startSending();

    store.edit();

    expect(store.proposalStatus()).toBe('sending');
  });
});

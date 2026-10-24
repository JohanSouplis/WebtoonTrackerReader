import {
  EMPTY_SERIES_SUGGESTIONS,
  SeriesSuggestions,
  SeriesSuggestionsSnapshot,
} from '../../domain/series-suggestions';
import { SeriesSuggestionsRepository } from '../../ports/series-suggestions-repository.port';

export class InMemorySeriesSuggestionsRepository implements SeriesSuggestionsRepository {
  constructor(
    private snapshot: SeriesSuggestionsSnapshot = EMPTY_SERIES_SUGGESTIONS,
  ) {}

  async load(): Promise<SeriesSuggestions> {
    return SeriesSuggestions.restore(this.snapshot);
  }

  async save(suggestions: SeriesSuggestions): Promise<void> {
    this.snapshot = suggestions.snapshot();
  }
}

import { SeriesSuggestions } from '../domain/series-suggestions';

export interface SeriesSuggestionsRepository {
  load(): Promise<SeriesSuggestions>;
  save(suggestions: SeriesSuggestions): Promise<void>;
}

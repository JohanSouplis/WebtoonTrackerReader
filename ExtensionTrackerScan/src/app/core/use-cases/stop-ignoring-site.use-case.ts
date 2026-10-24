import { SeriesSuggestionsRepository } from '../ports/series-suggestions-repository.port';

export class StopIgnoringSiteUseCase {
  constructor(
    private readonly suggestionsRepository: SeriesSuggestionsRepository,
  ) {}

  async execute(host: string): Promise<string[]> {
    const suggestions = await this.suggestionsRepository.load();
    suggestions.stopIgnoring(host);
    await this.suggestionsRepository.save(suggestions);
    return suggestions.ignoredHosts();
  }
}

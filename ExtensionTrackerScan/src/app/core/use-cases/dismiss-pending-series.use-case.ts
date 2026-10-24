import {
  PendingSeriesRef,
  PendingSeriesSnapshot,
} from '../domain/series-suggestions';
import { SeriesSuggestionsRepository } from '../ports/series-suggestions-repository.port';
import { TelemetryRecorderPort } from '../ports/telemetry-recorder.port';

export type DismissedSeries = {
  readonly pending: readonly PendingSeriesSnapshot[];
  readonly isSiteIgnored: boolean;
};

export class DismissPendingSeriesUseCase {
  constructor(
    private readonly suggestionsRepository: SeriesSuggestionsRepository,
    private readonly telemetry: TelemetryRecorderPort,
  ) {}

  async execute(ref: PendingSeriesRef): Promise<DismissedSeries> {
    const suggestions = await this.suggestionsRepository.load();
    suggestions.dismiss(ref);
    await this.suggestionsRepository.save(suggestions);
    this.telemetry.record({
      kind: 'pending-series',
      host: ref.host,
      outcome: 'dismissed',
    });
    return {
      pending: suggestions.snapshot().pending,
      isSiteIgnored: suggestions.ignoredHosts().includes(ref.host),
    };
  }
}

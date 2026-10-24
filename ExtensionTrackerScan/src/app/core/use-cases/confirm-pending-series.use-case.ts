import { ScanSnapshot } from '../domain/scan-library';
import {
  PendingSeriesRef,
  PendingSeriesSnapshot,
  SeriesConfirmation,
} from '../domain/series-suggestions';
import { pendingSeriesEvent } from '../domain/telemetry';
import { ScanRepository } from '../ports/scan-repository.port';
import { SeriesSuggestionsRepository } from '../ports/series-suggestions-repository.port';
import { TelemetryRecorderPort } from '../ports/telemetry-recorder.port';

export type ConfirmedSeries = {
  readonly library: ScanSnapshot[];
  readonly pending: readonly PendingSeriesSnapshot[];
};

export class ConfirmPendingSeriesUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly suggestionsRepository: SeriesSuggestionsRepository,
    private readonly telemetry: TelemetryRecorderPort,
  ) {}

  async execute(
    ref: PendingSeriesRef,
    confirmation: SeriesConfirmation,
  ): Promise<ConfirmedSeries> {
    const library = await this.scanRepository.load();
    const suggestions = await this.suggestionsRepository.load();
    suggestions.confirm(ref, confirmation, library);
    await this.scanRepository.save(library);
    await this.suggestionsRepository.save(suggestions);
    this.telemetry.record(pendingSeriesEvent(ref, confirmation));
    return {
      library: library.snapshot(),
      pending: suggestions.snapshot().pending,
    };
  }
}

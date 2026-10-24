import { ScanTitle } from '../domain/scan-title';
import { pendingSeriesEvent } from '../domain/telemetry';
import { ScanRepository } from '../ports/scan-repository.port';
import { SeriesSuggestionsRepository } from '../ports/series-suggestions-repository.port';
import { TelemetryRecorderPort } from '../ports/telemetry-recorder.port';
import { ConfirmedSeries } from './confirm-pending-series.use-case';

export class ConfirmSiteSeriesUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly suggestionsRepository: SeriesSuggestionsRepository,
    private readonly telemetry: TelemetryRecorderPort,
  ) {}

  async execute(host: string): Promise<ConfirmedSeries> {
    const library = await this.scanRepository.load();
    const suggestions = await this.suggestionsRepository.load();
    const waiting = suggestions
      .snapshot()
      .pending.filter((series) => series.host === host);
    suggestions.confirmAllFrom(host, library);
    await this.scanRepository.save(library);
    await this.suggestionsRepository.save(suggestions);
    for (const { title } of waiting) {
      this.telemetry.record(
        pendingSeriesEvent(
          { title: ScanTitle.of(title), host },
          { kind: 'as-detected' },
        ),
      );
    }
    return {
      library: library.snapshot(),
      pending: suggestions.snapshot().pending,
    };
  }
}

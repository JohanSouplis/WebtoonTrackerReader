import { Cover, Covers } from '../../domain/cover';
import { ScanTitle } from '../../domain/scan-title';
import { CoverRepository } from '../../ports/cover-repository.port';

export class InMemoryCoverRepository implements CoverRepository {
  private readonly covers: Map<string, Cover>;

  constructor(covers: Readonly<Record<string, Cover>> = {}) {
    this.covers = new Map(
      Object.entries(covers).map(([title, cover]) => [
        ScanTitle.of(title).seriesKey.value,
        cover,
      ]),
    );
  }

  async find(titles: readonly ScanTitle[]): Promise<Covers> {
    return new Map(
      titles.flatMap((title) => {
        const cover = this.covers.get(title.seriesKey.value);
        return cover ? [[title.value, cover]] : [];
      }),
    );
  }

  async save(title: ScanTitle, cover: Cover): Promise<void> {
    this.covers.set(title.seriesKey.value, cover);
  }
}

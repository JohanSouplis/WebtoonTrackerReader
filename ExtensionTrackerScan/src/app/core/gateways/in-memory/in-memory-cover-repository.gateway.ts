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

  async update(
    title: ScanTitle,
    change: (stored: Cover | undefined) => Cover,
  ): Promise<void> {
    const key = title.seriesKey.value;
    this.covers.set(key, change(this.covers.get(key)));
  }

  async move(from: ScanTitle, to: ScanTitle): Promise<void> {
    const cover = this.covers.get(from.seriesKey.value);
    if (cover) {
      this.covers.delete(from.seriesKey.value);
      this.covers.set(to.seriesKey.value, cover);
    }
  }

  async remove(title: ScanTitle): Promise<void> {
    this.covers.delete(title.seriesKey.value);
  }
}

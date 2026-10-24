import { PendingSeriesSnapshot } from '../../../../core/domain/series-suggestions';

export type PendingSeriesCard = {
  readonly key: string;
  readonly title: string;
  readonly chapter: number;
  readonly url: string;
  readonly host: string;
  readonly seenAt: Date;
};

export type PendingSeriesGroup = {
  readonly host: string;
  readonly cards: readonly PendingSeriesCard[];
};

const toCard = ({
  title,
  chapter,
  url,
  host,
  seenAt,
}: PendingSeriesSnapshot): PendingSeriesCard => ({
  key: `${host} ${title}`,
  title,
  chapter,
  url,
  host,
  seenAt,
});

export const toPendingSeriesGroups = (
  pending: readonly PendingSeriesSnapshot[],
): PendingSeriesGroup[] =>
  [...pending]
    .sort((a, b) => b.seenAt.getTime() - a.seenAt.getTime())
    .map(toCard)
    .reduce<PendingSeriesGroup[]>((groups, card) => {
      const group = groups.find(({ host }) => host === card.host);
      return group
        ? groups.map((known) =>
            known === group
              ? { ...group, cards: [...group.cards, card] }
              : known,
          )
        : [...groups, { host: card.host, cards: [card] }];
    }, []);

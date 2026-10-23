import responsesJson from './responses.json';
import {
  Corpus,
  NewChapterCase,
  recordedPageOf,
  replay,
  Replay,
  Responses,
} from './replay';

type Scored = NewChapterCase & Replay;

type Tally = {
  readonly cases: number;
  readonly answered: number;
  readonly correct: number;
  readonly falseNew: number;
  readonly missedNew: number;
  readonly unanswered: Readonly<Record<string, number>>;
  readonly requests: number;
};

const responses: Responses = responsesJson as Responses;

const isAnswered = (scored: Scored): boolean =>
  scored.verdict.kind === 'answered';

const isFalseNew = ({ verdict, truth }: Scored): boolean =>
  verdict.kind === 'answered' && verdict.isNew && truth === 'none';

const isMissedNew = ({ verdict, truth }: Scored): boolean =>
  verdict.kind === 'answered' && !verdict.isNew && truth === 'new';

const tallyOf = (scored: readonly Scored[]): Tally => ({
  cases: scored.length,
  answered: scored.filter(isAnswered).length,
  correct: scored.filter(
    (each) => isAnswered(each) && !isFalseNew(each) && !isMissedNew(each),
  ).length,
  falseNew: scored.filter(isFalseNew).length,
  missedNew: scored.filter(isMissedNew).length,
  unanswered: scored
    .filter((each) => !isAnswered(each))
    .reduce<Record<string, number>>((counts, { verdict }) => {
      const key =
        verdict.kind === 'unsupported'
          ? `unsupported (${verdict.reason})`
          : verdict.kind;
      return { ...counts, [key]: (counts[key] ?? 0) + 1 };
    }, {}),
  requests: scored.reduce((total, { requests }) => total + requests.length, 0),
});

const percent = (part: number, whole: number): string =>
  whole === 0 ? '-' : `${((100 * part) / whole).toFixed(1)}%`;

const line = (label: string, tally: Tally): string =>
  `${label}: cases ${tally.cases}, answered ${tally.answered} (${percent(tally.answered, tally.cases)}), ` +
  `correct ${tally.correct} (${percent(tally.correct, tally.answered)} of answered), ` +
  `FALSE NEW ${tally.falseNew}, missed new ${tally.missedNew}, ` +
  `requests ${(tally.requests / Math.max(1, tally.cases)).toFixed(2)} per case` +
  (Object.keys(tally.unanswered).length > 0
    ? `; unanswered ${Object.entries(tally.unanswered)
        .map(([reason, count]) => `${reason} ${count}`)
        .join(', ')}`
    : '');

const groupedBy = (
  scored: readonly Scored[],
  key: (each: Scored) => string,
): [string, Scored[]][] =>
  [
    ...scored
      .reduce(
        (groups, each) =>
          groups.set(key(each), [...(groups.get(key(each)) ?? []), each]),
        new Map<string, Scored[]>(),
      )
      .entries(),
  ].sort(([left], [right]) => left.localeCompare(right));

const verdictText = ({ verdict }: Scored): string =>
  verdict.kind === 'answered'
    ? `${verdict.strategy} latest ${verdict.latest} -> ${verdict.isNew ? 'new' : 'nothing new'}`
    : verdict.kind === 'unsupported'
      ? `unsupported (${verdict.reason})`
      : verdict.kind;

const strategyOf = ({ verdict }: Scored): string =>
  verdict.kind === 'answered' ? verdict.strategy : 'no answer';

const corpora: readonly Corpus[] = ['series pages', 'feeds'];

const scoredCases: Scored[] = responses.cases.map((testCase) => ({
  ...testCase,
  ...replay(testCase, recordedPageOf(responses, testCase.corpus)),
}));

corpora.forEach((corpus) => {
  const scored = scoredCases.filter((each) => each.corpus === corpus);
  console.log(`\n## ${corpus}`);
  console.log(line('all', tallyOf(scored)));
  console.log('\n### per strategy that answered');
  groupedBy(scored.filter(isAnswered), strategyOf).forEach(
    ([strategy, group]) => console.log(line(strategy, tallyOf(group))),
  );
  console.log('\n### per source of the truth');
  groupedBy(scored, ({ truthFrom }) => truthFrom).forEach(([source, group]) =>
    console.log(line(source, tallyOf(group))),
  );
  console.log('\n### per host');
  groupedBy(scored, ({ host }) => host).forEach(([host, group]) =>
    console.log(
      `${host} | ${group
        .map(
          (each) =>
            `read ${each.chapter}, truth ${each.truth}: ${verdictText(each)}${isFalseNew(each) ? ' FALSE NEW' : ''}${isMissedNew(each) ? ' MISSED' : ''}`,
        )
        .join(' ; ')}`,
    ),
  );
});

const falseNew = scoredCases.filter(isFalseNew);
console.log(`\n## overall\n${line('all', tallyOf(scoredCases))}`);
if (falseNew.length > 0) {
  console.log(
    `FALSE NEW on ${falseNew.map(({ host, chapter }) => `${host} (read ${chapter})`).join(', ')}`,
  );
  process.exitCode = 1;
}

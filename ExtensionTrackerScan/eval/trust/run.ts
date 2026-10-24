import { readFileSync } from 'node:fs';
import { VisitedPage } from '../../src/app/core/domain/parsed-page';
import { ScanTitle } from '../../src/app/core/domain/scan-title';
import { PendingSeriesSnapshot } from '../../src/app/core/domain/series-suggestions';
import { siteOf } from '../../src/app/core/domain/site';
import { FixedClock } from '../../src/app/core/gateways/in-memory/fixed-clock.gateway';
import { InMemoryBrowserHistory } from '../../src/app/core/gateways/in-memory/in-memory-browser-history.gateway';
import { InMemoryCrashReporter } from '../../src/app/core/gateways/in-memory/in-memory-crash-reporter.gateway';
import { InMemoryReportSettingsRepository } from '../../src/app/core/gateways/in-memory/in-memory-report-settings-repository.gateway';
import { InMemoryScanRepository } from '../../src/app/core/gateways/in-memory/in-memory-scan-repository.gateway';
import { InMemorySeriesSuggestionsRepository } from '../../src/app/core/gateways/in-memory/in-memory-series-suggestions-repository.gateway';
import { InMemoryTelemetryRecorder } from '../../src/app/core/gateways/in-memory/in-memory-telemetry-recorder.gateway';
import { ConfirmPendingSeriesUseCase } from '../../src/app/core/use-cases/confirm-pending-series.use-case';
import { DismissPendingSeriesUseCase } from '../../src/app/core/use-cases/dismiss-pending-series.use-case';
import { ImportReadingHistoryUseCase } from '../../src/app/core/use-cases/import-reading-history.use-case';
import { RecordVisitedPageUseCase } from '../../src/app/core/use-cases/record-visited-page.use-case';
import { parsePageSignals } from '../../src/page-signals-message';
import {
  ADVERSARIAL_BLIND_PAGES,
  ADVERSARIAL_TUNE_PAGES,
} from '../parser/adversarial-pages';
import {
  CAPTURED_PAGES,
  CapturedPage,
  Expected,
  HELD_OUT_PAGES,
  messagesOf,
} from '../parser/captured-pages';
import { capturedOutcomeOf, Recorded } from '../parser/recorded';

type TrustPage = {
  readonly host: string;
  readonly expected: Expected;
  readonly messages: readonly unknown[];
  readonly history?: VisitedPage;
};

type PageSet = { readonly name: string; readonly pages: readonly TrustPage[] };

type Mode = 'content' | 'history';

const OUTCOMES = [
  'entered exact',
  'entered WRONG',
  'entered non-chapter',
  'waiting exact',
  'waiting wrong',
  'waiting non-chapter',
  'missed',
  'ignored non-chapter',
] as const;

type Outcome = (typeof OUTCOMES)[number];

type SealedRecord = {
  readonly finalUrl: string;
  readonly host: string;
  readonly kind: string;
  readonly category: string;
  readonly status: string;
  readonly messages?: readonly unknown[];
  readonly history?: { readonly title: string; readonly url: string };
  readonly groundTruth?: {
    readonly seriesTitle: string;
    readonly chapter: number;
    readonly altTitles?: readonly string[];
  };
};

const START = Date.UTC(2025, 0, 1);

const titlesOf = (title: string): string[] => {
  const outsideParentheses = /^(.+?)\s*\([^()]*\)$/.exec(title);
  return outsideParentheses ? [title, outsideParentheses[1]] : [title];
};

const hostOf = (url: string): string => siteOf(url) ?? url;

const capturedTrustPage = (page: CapturedPage): TrustPage => ({
  host: hostOf(page.capture.finalUrl),
  expected: page.expected,
  messages: messagesOf(page.capture),
  history: page.capture.titleSettled
    ? { pageTitle: page.capture.titleSettled, url: page.capture.finalUrl }
    : undefined,
});

const sealedTrustPage = (record: SealedRecord): TrustPage => ({
  host: hostOf(record.finalUrl),
  expected: record.groundTruth
    ? {
        kind: 'reading',
        titles: [
          record.groundTruth.seriesTitle,
          ...(record.groundTruth.altTitles ?? []),
        ].flatMap(titlesOf),
        chapters: [record.groundTruth.chapter],
      }
    : { kind: 'other', reason: record.category },
  messages: record.messages ?? [],
  history: record.history && {
    pageTitle: record.history.title,
    url: record.history.url,
  },
});

const sealedSetOf = (path: string, index: number): PageSet => {
  const { records }: { records: SealedRecord[] } = JSON.parse(
    readFileSync(path, 'utf8'),
  );
  return {
    name: `sealed-${index + 1} (${path})`,
    pages: records
      .filter(({ status }) => status === 'captured')
      .map(sealedTrustPage),
  };
};

const repositorySets: PageSet[] = [
  ...['en-aggregators', 'official', 'non-english', 'negatives'].map(
    (partition) => ({
      name: `captures: ${partition}`,
      pages: CAPTURED_PAGES.filter((page) => page.partition === partition).map(
        capturedTrustPage,
      ),
    }),
  ),
  { name: 'captures: held-out', pages: HELD_OUT_PAGES.map(capturedTrustPage) },
  ...[
    { name: 'adversarial-tune', pages: ADVERSARIAL_TUNE_PAGES },
    { name: 'adversarial-blind', pages: ADVERSARIAL_BLIND_PAGES },
  ].map(({ name, pages }) => ({
    name,
    pages: pages.map((page) => ({
      host: hostOf(page.url),
      expected: page.expected,
      messages: page.messages,
    })),
  })),
];

const sealedSets = process.argv.slice(2).map(sealedSetOf);

const recordedOf = (
  series: readonly { title: string; chapter: number }[],
): Recorded[] => series.map(({ title, chapter }) => ({ title, chapter }));

const verdictOf = (
  expected: Expected,
  series: readonly { title: string; chapter: number }[],
): 'exact' | 'wrong' | 'non-chapter' =>
  expected.kind === 'other'
    ? 'non-chapter'
    : capturedOutcomeOf(expected, recordedOf(series)) === 'exact'
      ? 'exact'
      : 'wrong';

const reader = () => {
  const scanRepository = new InMemoryScanRepository();
  const suggestionsRepository = new InMemorySeriesSuggestionsRepository();
  const telemetry = new InMemoryTelemetryRecorder();
  const visit = async (
    page: TrustPage,
    mode: Mode,
    readAt: Date,
  ): Promise<boolean> => {
    if (mode === 'history') {
      if (!page.history) {
        return false;
      }
      await new ImportReadingHistoryUseCase(
        new InMemoryBrowserHistory([{ page: page.history, readAt }]),
        scanRepository,
        suggestionsRepository,
        new InMemoryCrashReporter(),
        new InMemoryReportSettingsRepository({ sendsParseReports: false }),
        telemetry,
      ).execute();
      return true;
    }
    const recordVisitedPage = new RecordVisitedPageUseCase(
      scanRepository,
      suggestionsRepository,
      new InMemoryCrashReporter(),
      new InMemoryReportSettingsRepository({ sendsParseReports: false }),
      new FixedClock(readAt),
      telemetry,
    );
    for (const message of page.messages) {
      const signals = parsePageSignals(message);
      if (signals) {
        await recordVisitedPage.execute(signals);
      }
    }
    return true;
  };
  return {
    visit,
    scans: async () => (await scanRepository.load()).snapshot(),
    pending: async () =>
      (await suggestionsRepository.load()).snapshot().pending,
    ignoredHosts: async () =>
      (await suggestionsRepository.load()).ignoredHosts(),
    confirm: new ConfirmPendingSeriesUseCase(
      scanRepository,
      suggestionsRepository,
      telemetry,
    ),
    dismiss: new DismissPendingSeriesUseCase(suggestionsRepository, telemetry),
  };
};

const changedSince = <T>(before: readonly T[], after: readonly T[]): T[] => {
  const known = new Set(before.map((item) => JSON.stringify(item)));
  return after.filter((item) => !known.has(JSON.stringify(item)));
};

const outcomeOf = (
  expected: Expected,
  entered: readonly { title: string; chapter: number }[],
  waiting: readonly { title: string; chapter: number }[],
): Outcome => {
  if (entered.length > 0) {
    return `entered ${verdictOf(expected, entered) === 'wrong' ? 'WRONG' : verdictOf(expected, entered)}`;
  }
  if (waiting.length > 0) {
    return `waiting ${verdictOf(expected, waiting)}`;
  }
  return expected.kind === 'other' ? 'ignored non-chapter' : 'missed';
};

const countsOf = <K extends string>(keys: readonly K[]): Map<K, number> =>
  new Map(keys.map((key) => [key, 0]));

const add = <K extends string>(counts: Map<K, number>, key: K): void => {
  counts.set(key, (counts.get(key) ?? 0) + 1);
};

const withEmptyLibrary = async (pages: readonly TrustPage[], mode: Mode) => {
  const counts = countsOf(OUTCOMES);
  const wrongs: string[] = [];
  let measured = 0;
  for (const page of pages) {
    const library = reader();
    if (!(await library.visit(page, mode, new Date(START)))) {
      continue;
    }
    measured += 1;
    const outcome = outcomeOf(
      page.expected,
      await library.scans(),
      await library.pending(),
    );
    add(counts, outcome);
    if (outcome === 'entered WRONG' || outcome === 'entered non-chapter') {
      wrongs.push(
        `    ${outcome}: ${page.host} ${JSON.stringify((await library.scans()).map(({ title, chapter }) => [title, chapter]))}`,
      );
    }
  }
  return { counts, wrongs, measured };
};

const LEARNED_OUTCOMES = [
  'asked exact (added as shown)',
  'asked wrong (corrected)',
  'asked non-chapter (dismissed)',
  'auto exact',
  'auto WRONG',
  'auto non-chapter',
  'missed',
  'silenced chapter (site ignored)',
  'ignored non-chapter',
] as const;

type LearnedOutcome = (typeof LEARNED_OUTCOMES)[number];

const actOn = async (
  library: ReturnType<typeof reader>,
  page: TrustPage,
  series: PendingSeriesSnapshot,
): Promise<LearnedOutcome> => {
  const ref = { title: ScanTitle.of(series.title), host: series.host };
  const verdict = verdictOf(page.expected, [series]);
  if (page.expected.kind === 'other') {
    await library.dismiss.execute(ref);
    return 'asked non-chapter (dismissed)';
  }
  if (verdict === 'exact') {
    await library.confirm.execute(ref, { kind: 'as-detected' });
    return 'asked exact (added as shown)';
  }
  await library.confirm.execute(ref, {
    kind: 'renamed',
    title: ScanTitle.of(page.expected.titles[0]),
  });
  return 'asked wrong (corrected)';
};

const withLearnedTrust = async (pages: readonly TrustPage[], mode: Mode) => {
  const counts = countsOf(LEARNED_OUTCOMES);
  const wrongs: string[] = [];
  const hosts = [...new Set(pages.map(({ host }) => host))];
  for (const host of hosts) {
    const library = reader();
    const hostPages = pages.filter((page) => page.host === host);
    for (const [index, page] of hostPages.entries()) {
      const scansBefore = await library.scans();
      const pendingBefore = await library.pending();
      const wasIgnored = (await library.ignoredHosts()).includes(host);
      if (!(await library.visit(page, mode, new Date(START + index * 60000)))) {
        continue;
      }
      const entered = changedSince(scansBefore, await library.scans());
      const waiting = changedSince(pendingBefore, await library.pending());
      let outcome: LearnedOutcome;
      if (entered.length > 0) {
        const verdict = verdictOf(page.expected, entered);
        outcome =
          verdict === 'exact'
            ? 'auto exact'
            : verdict === 'wrong'
              ? 'auto WRONG'
              : 'auto non-chapter';
        if (verdict !== 'exact') {
          wrongs.push(
            `    ${outcome}: ${host} ${JSON.stringify(entered.map(({ title, chapter }) => [title, chapter]))}`,
          );
        }
      } else if (waiting.length > 0) {
        outcome = await actOn(library, page, waiting[0]);
      } else if (page.expected.kind === 'other') {
        outcome = 'ignored non-chapter';
      } else {
        outcome = wasIgnored ? 'silenced chapter (site ignored)' : 'missed';
      }
      add(counts, outcome);
    }
  }
  return { counts, wrongs };
};

const line = (counts: ReadonlyMap<string, number>): string =>
  [...counts].map(([outcome, count]) => `${outcome} ${count}`).join(' · ');

const report = async (set: PageSet): Promise<void> => {
  const chapters = set.pages.filter(
    ({ expected }) => expected.kind === 'reading',
  );
  console.log(
    `\n## ${set.name}: ${set.pages.length} pages, ${chapters.length} chapters, ${new Set(set.pages.map(({ host }) => host)).size} sites`,
  );
  for (const mode of ['content', 'history'] as const) {
    const { counts, wrongs, measured } = await withEmptyLibrary(
      set.pages,
      mode,
    );
    console.log(`### ${mode}, empty library (${measured} pages)`);
    console.log(`  ${line(counts)}`);
    wrongs.forEach((wrong) => console.log(wrong));
    const learned = await withLearnedTrust(set.pages, mode);
    console.log(
      `### ${mode}, a reader who answers every question, site by site in capture order`,
    );
    console.log(`  ${line(learned.counts)}`);
    learned.wrongs.forEach((wrong) => console.log(wrong));
  }
};

const main = async (): Promise<void> => {
  console.log(
    'Entered: the reading went into the library without a question. Waiting: it became a new series to confirm.',
  );
  for (const set of [...repositorySets, ...sealedSets]) {
    await report(set);
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

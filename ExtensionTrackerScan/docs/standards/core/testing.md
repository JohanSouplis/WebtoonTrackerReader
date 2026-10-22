# Tests du core

Source canonique pour : les tests de use-case, le type de double par port, les tests de gateway, la
disposition des specs. Les tests Angular : [`../front/testing.md`](../front/testing.md).

## Principe

Chaque comportement se teste à la couche qui le porte, avec le double adapté à cette couche. Avant d'écrire
un test, nomme la ligne de production qui le fait passer du rouge au vert. Si un test existant la couvre
déjà, complète-le au lieu d'en écrire un second.

| Couche | Type de test | Double |
|---|---|---|
| Use-case | Jest pur, par `execute()`, traverse l'agrégat et les Value Objects | gateway in-memory selon la nature du port |
| Gateway Chrome | Jest contre un faux `chrome.storage.local` en mémoire | aucun sous le gateway |
| Gateway Discord | Jest, `fetch` remplacé par un enregistreur | aucun |
| Domaine (agrégat, Value Object, parser) | par le use-case qui l'utilise | aucun |

## Tests de use-case

- **Chaque règle métier a un test qui part de `execute()`**, avec le cas qui passe et le cas qui échoue.
- Le test construit le use-case avec `new` et ses gateways in-memory. Aucun `container.get`, aucun
  `TestBed`, aucun `jest.mock` de module.
- Il assert sur ce que l'appelant observe : la valeur retournée, l'état relu par `scanRepository.load()`,
  les appels reçus par un port de commande.
- Le **type de double suit la nature du port** :
  - port de **lecture** (`ScanRepository`, `BrowserHistoryPort`, `ClockPort`) : le gateway in-memory, on
    assert sur l'état obtenu ;
  - port de **commande** (`CrashReporterPort`, `WebsiteProposalPort`) : le gateway in-memory qui enregistre
    les appels, on assert sur la liste enregistrée. L'interaction est le contrat observable.
- Le gateway in-memory reste fidèle au contrat du gateway réel : unicité par titre, rejet en cas d'erreur.
- L'heure vient de `FixedClock`. Un test ne dépend jamais de l'heure réelle.
- Couvre les cas limites et les échecs métier, pas seulement le cas nominal.

```ts
// ❌ mock ad hoc, et un assert qui ne lit que le mock
class MockCrashReport implements CrashReport {
  execute = jest.fn((url: string, error?: string) => { console.log(`Message send mocked : ${url}`); });
}

// ✅ gateway in-memory, assert sur l'effet observable
it("should report the page when its title matches no pattern of a supported website", async () => {
  const crashReporter = new InMemoryCrashReporter();
  const recordVisitedPage = new RecordVisitedPageUseCase(
    new InMemoryScanRepository(),
    crashReporter,
    new FixedClock(),
  );
  const page = {
    pageTitle: "Unexpected title",
    url: "https://toonily.com/webtoon/x/chapter-1/",
  };

  await recordVisitedPage.execute(page);

  expect(crashReporter.reportedPages).toEqual([page]);
});
```

## Le catalogue des sites se teste par un tableau de cas

La spec de `RecordVisitedPageUseCase` porte un `it.each` : un titre de page réel, son URL, le titre et le
chapitre attendus. Chaque site du catalogue y a au moins une ligne. Ajouter un site ajoute une ligne. Les
lignes d'un site sorti du catalogue restent : elles passent alors par l'analyse générique et en protègent le
résultat.

## Les sites hors catalogue se mesurent sur un corpus

La spec de `RecordVisitedPageUseCase` porte un tableau de pages de sites hors catalogue lues, et un tableau de
pages à ignorer avec leur raison. Chaque règle de l'analyse générique y a au moins une ligne qui échoue sans
elle.

`npm run eval:parser` rejoue un corpus étiqueté plus large (`eval/parser/`) : les pages du catalogue sans le
catalogue, des chapitres et des pages ordinaires de sites hors catalogue. Il affiche, tranche par tranche, les
lectures exactes, fausses, manquées et les faux positifs. Lance-le avant et après toute modification de
l'analyse générique et cite les deux résultats dans la PR. Une page ajoutée au corpus après une modification
sert de contrôle : ne règle pas l'analyse sur elle dans la même PR.

Le même script rejoue aussi des pages de chapitre réelles, capturées avec Chromium
(`eval/parser/captures/*.json`) : titre stabilisé, URL finale, `og:title`, `h1`, fil d'Ariane, JSON-LD,
option de chapitre sélectionnée, et la série et le chapitre lus sur la page. Chaque page passe deux fois :
titre et URL seuls (l'import de l'historique), puis tous les signaux (le content script). Le titre se compare
par `SeriesKey.match()`, le chapitre par sa valeur. Une lecture fausse (mauvaise série ou mauvais chapitre) est
le pire résultat, avant la lecture manquée. Les pages de roman et les épisodes sans numéro doivent rester
ignorés.

## La couverture d'une série se teste sur des pages réelles

La spec de `BackfillCoversUseCase` rejoue `cover-pages.fixture.json` : des pages de chapitre réelles et la page de
leur série, avec les images candidates, leur taille mesurée et l'image attendue, étiquetée à la main sur une
planche contact. Une image fausse (une page du chapitre, un logo, une bannière) est le pire résultat, avant la
couverture manquée : la spec garde zéro image fausse. Une nouvelle règle de sélection s'y mesure.

## L'identité d'une série se mesure sur un corpus

`npm run eval:identity` rejoue un corpus étiqueté de paires de titres (`eval/identity/`) : un scan suivi, puis
une lecture sous un autre titre. Chaque paire cite sa source (MangaUpdates, AniList, MangaDex, titre de page
réel). Le corpus sépare les variantes d'écriture d'une même langue, les reformulations et les titres d'une autre
langue (qui demandent une source d'alias), les suites, spin-offs et remakes, et les homonymes. Il affiche, tranche
par tranche, les fusions, les fusions manquées et les **fausses fusions**. Une fausse fusion écrase le chapitre
d'une autre série : toute modification de l'identité d'une série garde zéro fausse fusion hors homonymes. Lance-le
avant et après et cite les deux résultats dans la PR.

## Ce qu'on ne teste pas seul

- L'agrégat, les Value Objects et `PageTitleParser` se testent par les use-cases qui les appellent. Une
  méthode qu'aucun use-case n'atteint n'a pas lieu d'exister.
- Exception : un Value Object construit à la frontière (par un point d'entrée ou un gateway) a une spec de
  construction. Elle teste la valeur limite acceptée et la première refusée.
- Les getters, les types, les mécaniques d'inversify.

## Tests de gateway

- Le gateway Chrome se teste contre un faux `chrome.storage.local` en mémoire, posé sur `globalThis.chrome`.
  On assert l'aller-retour (`save` puis `load`) et la relecture du format stocké par la version publiée.
- Le gateway Discord se teste en remplaçant `fetch` par un enregistreur : on assert l'URL et le corps envoyé,
  et la traduction d'une réponse en erreur.
- Aucun test n'appelle le vrai Discord ni un vrai site. ❌ `rest.recupererInformationsWebtoon('https://...')`.

## Disposition et nommage

- Fichier : `<fichier-testé>.spec.ts`, à côté du fichier testé.
- **Un use-case, une spec, un seul `describe` plat.** Pas de `describe` imbriqué.
- Tous les `it` d'abord, les fonctions de construction après eux. Une donnée partagée par plusieurs specs
  vit dans un `*.fixture.ts` à côté d'elles.
- Libellé : `should <comportement observable> when <condition>`, en anglais. Il nomme une règle métier,
  jamais une méthode ni une exception générique.

```ts
// ✅ it("should keep the latest chapter when an older reading of the same scan arrives")
// ❌ it("with a different chapter, the chapter is updated")
// ❌ it("test")
```

## Exécuter

```bash
cd ExtensionTrackerScan
npx jest
npx jest src/app/core/use-cases/record-visited-page.use-case.spec.ts
```

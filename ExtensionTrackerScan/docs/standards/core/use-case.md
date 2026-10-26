# Pattern use-case

Source canonique pour : la structure d'un use-case, ses ports, ses anti-patterns. Les couches :
[`architecture.md`](architecture.md). Les tests : [`testing.md`](testing.md).

## Principes

- **Un use-case est une fonctionnalité métier.** Il est le point d'entrée du modèle du domaine et orchestre
  l'agrégat pour atteindre un but.
- Nom : **verbe + nom**, suffixe `UseCase` : `RecordVisitedPageUseCase`, `RateScanUseCase`.
- Une seule méthode publique : `execute(...)`. Elle est `async` dès qu'un port l'est.
- Les ports arrivent par le constructeur, en `private readonly`. Jamais un gateway, jamais `container.get`.
- **Une écriture est toujours un use-case**, même d'apparence triviale : supprimer un scan, le mettre en
  favori, le noter, proposer un site. C'est le seul endroit où vivent les invariants.
- **Une lecture n'a pas de use-case.** L'appelant lit le port directement (`scanRepository.load()`). Un
  use-case qui ne fait que retourner l'appel d'un port est une méthode passe-plat : supprime-le.
- `execute()` retourne un résultat métier : le `snapshot()` de la bibliothèque après l'écriture, ou un
  résultat du domaine. Jamais un message d'affichage.

## Les ports

- Un port est une interface de `core/ports/`, en termes métier. Suffixe `Port`, ou `Repository` pour la
  persistance d'un agrégat : `ScanRepository`, `CrashReporterPort`, `ClockPort`.
- Ses méthodes sont des verbes du domaine : `reportUnparsedPage(page)`, pas `execute(url, title, error)`.
- **Toutes les interactions avec les ports restent visibles dans `execute()`.** Aucun helper privé n'appelle
  un port.
- **Un chargement, un enregistrement.** Un use-case charge la bibliothèque une fois et l'enregistre une
  fois, même s'il traite cent pages de l'historique.
- L'heure vient de `ClockPort`. Un use-case n'appelle jamais `new Date()` ni `Date.now()`.

```ts
// ✅ ports visibles, un chargement, un enregistrement, l'agrégat décide
export class ImportReadingHistoryUseCase {
  constructor(
    private readonly browserHistory: BrowserHistoryPort,
    private readonly scanRepository: ScanRepository,
    private readonly pageTitleParser: PageTitleParser,
  ) {}

  async execute(): Promise<ScanSnapshot[]> {
    const visitedPages = await this.browserHistory.findVisitsNotYetImported();
    const library = await this.scanRepository.load();
    library.recordReadings(this.pageTitleParser.parseReadings(visitedPages));
    await this.scanRepository.save(library);
    return library.snapshot();
  }
}
```

## Anti-patterns

- **Logique dans un point d'entrée.** `background.ts` qui boucle sur l'historique et fusionne les scans. Le
  point d'entrée appelle `execute()`, c'est tout.
- **Getter d'inspection.** `if (existingScan.whenWasItRead > newScan.whenWasItRead) return` dans le
  use-case. La règle « une lecture plus ancienne ne remplace pas la plus récente » appartient à
  `ScanLibrary.recordReading()`.
- **Mutation d'un objet reçu.** `newScan.title = newScan.title.replace(...)` modifie l'argument de
  l'appelant. Le domaine construit un `ScanTitle` normalisé.
- **Nettoyage d'entrée dans le use-case.** Message sans titre, `page.title` absent dans l'historique : la
  frontière les écarte. `execute()` reçoit des entrées propres.
- **Anti-corruption dans le use-case.** Relire une date `Date.toString()` stockée par l'ancienne version
  est le travail du gateway, qui retourne une bibliothèque propre.
- **Préoccupation d'affichage.** `execute()` ne retourne ni texte d'interface ni booléen « afficher le
  message ». La page décide de l'affichage.
- **Paramètre booléen qui change le comportement.** Deux comportements font deux méthodes, ou deux
  use-cases.
- **Erreur avalée.** `console.log(error); return []` dans le domaine. Une page non analysée est un résultat
  du domaine (`ParsedPage` de type `unparsed`), que le use-case transmet au `CrashReporterPort`.

# Nommage et langage ubiquitaire

Source canonique pour : la langue du code, le glossaire, les suffixes de fichiers, les noms bannis.

## Langue : le code est en anglais

Le produit, son interface et ses utilisateurs sont anglophones. Le code l'est aussi : types, méthodes,
fichiers, libellés de tests. Une seule langue évite les mélanges comme `recupererInformationsWebtoon` à côté
de `retrieveTitleAndChapter`. La prose des docs reste en français.

## Glossaire

Ces termes sont le langage ubiquitaire. Le code les reprend mot pour mot. **Un concept, un nom** : n'écris
pas un synonyme.

| Terme | Sens | À éviter |
|---|---|---|
| `Scan` | Une série (manga, manhwa, webtoon) que le lecteur suit | `webtoon`, `story`, `manga` dans un nom de type |
| `ScanLibrary` | Tous les scans suivis par le lecteur | `scansList`, `scanList`, `scansTab` |
| `ScanTitle` | Le titre d'un scan, normalisé | `titleWebpage` pour ce sens |
| `SeriesKey` | La forme normalisée d'un `ScanTitle` qui reconnaît la même série sous un titre un peu différent | `normalizedTitle`, `slug`, `fuzzyTitle` |
| `SeriesMatch` | Le verdict de deux `SeriesKey` : `same`, `different` ou `ambiguous` | `similarity`, `score` |
| `Chapter` | Le numéro du dernier chapitre lu, un nombre | un `chapter` en `string` |
| `Reading` | La lecture d'un chapitre d'un scan à une date | `newScan`, `scanVisited` |
| `readAt` | La date de la dernière lecture | `whenWasItRead`, `wasRead`, `dateReading` |
| `Favorite` | Un scan marqué par le lecteur | `fav`, `isFavorited` |
| `Rating` | La note de 1 à 10 donnée par le lecteur | `rate`, `score` |
| `VisitedPage` | Le titre et l'URL d'une page vue dans le navigateur | `message`, `page` sans type |
| `pageTitle` | Le contenu de `<title>` d'une page visitée | `titleWebpage`, `titleWepPage` |
| `PageSignals` | Une `VisitedPage` et ce que le content script lit en plus sur la page : `og:title`, `h1`, fil d'Ariane, JSON-LD, option sélectionnée | `pageData`, `metadata`, `message` |
| `WebsitePattern` | Le format de titre d'un site, qui permet d'en extraire scan et chapitre | `parser`, `websiteJson` |
| `SupportedWebsite` | Un site présent dans le catalogue | `availableWebsites` en copie |
| `UnsupportedWebsite` | Un site absent du catalogue, analysé par des indices génériques | `unknownSite`, `genericSite` |
| `ChapterMention` | Le numéro de chapitre que le titre d'une page annonce, avec le texte qui l'entoure | `marker`, `match` |
| `WebsiteProposal` | Un site que le lecteur propose d'ajouter | `notification` pour ce sens |

Un terme manquant s'ajoute ici d'abord, puis dans le code.

## Suffixes : le fichier annonce son rôle

Les noms de fichiers et de dossiers sont en `kebab-case`. Le suffixe rend le rôle lisible dans un onglet ou
un diff, sans le chemin.

| Couche | Suffixe | Exemple |
|---|---|---|
| `core/domain/` | aucun, le nom métier | `scan-library.ts`, `chapter.ts`, `page-title-parser.ts` |
| `core/use-cases/` | `.use-case.ts` | `record-visited-page.use-case.ts` |
| ports (core et Angular) | `.port.ts` | `scan-repository.port.ts`, `full-page-navigator.port.ts` |
| gateways (core et Angular) | `.gateway.ts`, préfixé par la technologie | `chrome-storage-scan-repository.gateway.ts`, `in-memory-scan-repository.gateway.ts` |
| racine de feature | `.providers.ts` | `scan-list.providers.ts` |
| Angular `service/` | `.vm.ts`, `.rules.ts` | `scan-row.vm.ts`, `scan-filters.rules.ts` |
| Angular `ui/` | `.page.ts`, `.template.ts`, `.component.ts`, `.store.ts`, `.types.ts` | `scan-list.page.ts`, `scan-list.store.ts`, `scan-rows.component.ts` |
| design-system | `.component.ts`, `.types.ts` | `search-field.component.ts` |
| tests | `.spec.ts`, `.fixture.ts` | `rate-scan.use-case.spec.ts`, `scans.fixture.ts` |

## Noms de types et de classes

| Élément | Convention | Exemple |
|---|---|---|
| Use-case | verbe + nom + `UseCase` | `ToggleFavoriteUseCase` |
| Méthode du domaine | verbe à l'impératif | `recordReading`, `toggleFavorite` |
| Agrégat, Value Object | nom métier, sans suffixe de stéréotype | `ScanLibrary`, `Rating` |
| Port | nom de rôle + `Port`, ou `Repository` pour un agrégat | `CrashReporterPort`, `ScanRepository` |
| Gateway | technologie + nom du port sans `Port` | `DiscordCrashReporter`, `InMemoryScanRepository` |
| Page, composant | nom + `Page` ou `Component` | `ScanListPage`, `SearchFieldComponent` |
| Sélecteur | `app-` pour `features/` et `shell/`, `ds-` pour `design-system/` | `app-scan-rows`, `ds-search-field` |
| Booléen | `is`, `has`, `can` + adjectif | `isFavorite`, `isTruncated` |

## Bannis

- `*.service.ts`, `*.interface.ts`, `*.testhelper.ts` : selon le rôle, c'est un `.use-case.ts`, un
  `.gateway.ts`, un `.port.ts` ou un `.fixture.ts`.
- Les suffixes `Interface`, `Handler`, `Manager`, `Helper`, `Service` dans un nom de type. ❌ `StorageInterface`,
  `NavigatorHandler`, `ChromeHandler`.
- Le mot « facade ».
- Les fichiers et dossiers en `snake_case` ou en `camelCase`. ❌ `add_website_pattern.component.ts`,
  `scanTab/`, `delete_scan.ts`.
- Un paramètre booléen qui change le comportement d'une fonction.

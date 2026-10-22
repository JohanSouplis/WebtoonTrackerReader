# Architecture du core

Source canonique pour : les couches du core, la règle de dépendance, les points d'entrée, les gateways, la
racine de composition. Le pattern use-case : [`use-case.md`](use-case.md). Le modèle : [`domain-model.md`](domain-model.md).

## Contexte

Le core (`src/app/core/`) est le métier de l'extension, en TypeScript sans framework, en architecture
hexagonale. Quatre points d'entrée le consomment : `background.ts`, `content-script.ts`, `offscreen.ts` et
l'application Angular. Dans cette extension, `background.ts` joue le rôle du back : il écrit la bibliothèque de scans à
chaque page lue et à chaque import de l'historique.

## Les couches

| Couche | Contenu | Interdits |
|---|---|---|
| `core/domain/` | Agrégat, Value Objects, services du domaine, catalogue des sites | tout import hors `core/domain/` |
| `core/use-cases/` | Un use-case par fonctionnalité métier | `chrome.*`, `fetch`, `console`, tout gateway |
| `core/ports/` | Interfaces en termes métier | type de transport (`Response`, `chrome.history.HistoryItem`) |
| `core/gateways/` | Implémentations des ports : Chrome, Discord, in-memory | toute décision métier |
| `core/container.ts` | Racine de composition du service worker | logique |

**Règle de dépendance** : `use-cases → domain` et `use-cases → ports`. `gateways → ports` et
`gateways → domain`. Le domaine ne dépend de rien. Un use-case ne connaît jamais un gateway.

Le core n'importe ni `@angular/*`, ni `rxjs`, ni `inversify`, ni `axios`, ni `cheerio`. Seuls
`core/gateways/` et `core/container.ts` font exception, chacun pour sa technologie. Un port qui renvoie de
l'asynchrone renvoie une `Promise`, jamais un `Observable`.

```ts
// ❌ le domaine importe un framework
import { inject } from 'inversify';
export class RetrieveTitleAndChapter {
  constructor(@inject('CrashReport') private crashReport: CrashReport) {}
}

// ✅ classe nue, le container la construit
export class RecordVisitedPageUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly crashReporter: CrashReporterPort,
    private readonly clock: ClockPort,
  ) {}
}
```

## Arborescence

```
src/
  background.ts            point d'entrée : écoute les événements Chrome, appelle les use-cases
  content-script.ts        point d'entrée : envoie les PageSignals de la page au service worker
  offscreen.ts             point d'entrée : récupère une page et rend ses PageSignals au service worker
  page-signals-reader.ts   lit les PageSignals d'un Document, pour le content script et le document offscreen
  page-signals-message.ts  frontière : réduit le message du content script en PageSignals
  cover-backfill-message.ts frontière : la demande de la popup « cherche les couvertures de ces scans »
  app/core/
    container.ts           racine de composition du service worker (seul import d'inversify)
    domain/                scan-library.ts · scan-title.ts · series-key.ts · chapter.ts · rating.ts
                           reading.ts · parsed-page.ts · page-title-parser.ts · website-patterns.ts
                           unsupported-website-page-parser.ts · page-lexicon.ts
                           cover.ts · cover-search.ts · series-page.ts · site.ts
    use-cases/             record-visited-page.use-case.ts · import-reading-history.use-case.ts
                           delete-scan.use-case.ts · toggle-favorite.use-case.ts · rate-scan.use-case.ts
                           propose-website.use-case.ts · record-cover.use-case.ts
                           backfill-covers.use-case.ts          (chacun avec son .spec.ts à côté)
    ports/                 scan-repository.port.ts · browser-history.port.ts · clock.port.ts
                           crash-reporter.port.ts · website-proposal.port.ts
                           cover-repository.port.ts · cover-image.port.ts · page-reader.port.ts
    gateways/              chrome-storage-scan-repository.gateway.ts · chrome-browser-history.gateway.ts
                           system-clock.gateway.ts · discord-crash-reporter.gateway.ts
                           discord-website-proposal.gateway.ts · chrome-storage-cover-repository.gateway.ts
                           chrome-cover-image.gateway.ts · chrome-offscreen-page-reader.gateway.ts
      in-memory/           in-memory-scan-repository.gateway.ts · in-memory-browser-history.gateway.ts
                           fixed-clock.gateway.ts · in-memory-crash-reporter.gateway.ts
                           in-memory-website-proposal.gateway.ts · dev-scans.ts
                           in-memory-cover-repository.gateway.ts · dev-covers.ts
                           in-memory-web.gateway.ts            (pages et images, pour les deux ports)
```

Un dossier n'existe que s'il a du contenu. Le sous-dossier `src/` actuel (`core/src/domain`) disparaît avec la
migration.

## Points d'entrée

Un point d'entrée est un adapter primaire, l'équivalent d'un controller. Il fait trois choses et rien
d'autre :

1. Il reçoit l'événement du navigateur (`chrome.runtime.onMessage`, le minuteur d'import, un clic).
2. Il valide la forme du message reçu : c'est une frontière, le message est `unknown`.
3. Il appelle le `execute()` d'un use-case.

```ts
// ❌ background.ts lit le stockage et applique la règle lui-même
chrome.storage.local.get({ scans: [] }, function (result) {
  var scansList: Scan[] = updateScansWithNewVisitedScan(result['scans'], { ... } as Scan);
  chrome.storage.local.set({ scans: scansList }, function () {});
});

// ✅ background.ts parse la frontière et délègue
chrome.runtime.onMessage.addListener((message: unknown) => {
  const visitedPage = parseVisitedPage(message);
  if (visitedPage) {
    void recordVisitedPage.execute(visitedPage);
  }
});
```

`content-script.ts` ne contient aucune règle. Il lit la page telle quelle (`document.title`, `location.href`,
`og:title`, `og:site_name`, `canonical`, le premier `h1`, le fil d'Ariane, les nœuds JSON-LD, les options
sélectionnées) et l'envoie. Il renvoie la page quand son titre change, car certains sites ne posent le titre du
chapitre qu'après le chargement. Enregistrer deux fois la même lecture ne change rien : le renvoi est sans risque.
`background.ts` réduit le message (`unknown`) en `PageSignals` dans `page-signals-message.ts`, y compris le
décodage des entités HTML que certains sites laissent dans leur JSON-LD (`I&#8217;ll`).

Le content script et `offscreen.ts` lisent une page par la même fonction, `readPageSignals(document, url)` de
`page-signals-reader.ts` : la page lue en direct et la page récupérée par le service worker donnent les mêmes
signaux. Le service worker n'a pas de DOM. Pour lire une page qu'il récupère (la page d'une série), il passe par
le document offscreen (`chrome.offscreen`, raison `DOM_PARSER`), via le gateway
`chrome-offscreen-page-reader.gateway.ts`.

Le message ne porte que les images et les liens que les règles de couverture peuvent retenir
(`withCoverCandidatesOnly`) : une page de webtoons.com liste plus de mille épisodes, et le message est renvoyé à
chaque changement de titre. Une image reste si son texte alternatif ne nomme aucun numéro, page ou chapitre absent
des titres de la page (`mayNameTheSeries`), un lien s'il reste sur le site et porte un texte (`isInsideSite`).
Les doublons partent, puis 10 images et 50 liens au plus restent, ceux du fil d'Ariane d'abord. Le corpus de
couvertures passe par la même réduction.

La popup ne télécharge aucune image. Elle demande au service worker de chercher les couvertures des lignes
affichées sans couverture (`cover-backfill-message.ts`), puis relit les couvertures. Le service worker est le seul
à chercher et enregistrer une couverture. La popup ne fait que supprimer celle du scan qu'elle supprime.

## Gateways

- Un gateway implémente un port et ne connaît que deux mondes : la technologie et le domaine.
- **L'anti-corruption est dans le gateway.** Le gateway Chrome relit le format déjà stocké chez les
  utilisateurs : clé `scans`, dates au format `Date.toString()`, `rating` absent. Il le traduit en objets
  du domaine. Le domaine ne se défend jamais contre une donnée sale.
- **Les couvertures vivent sous une clé par série**, `cover:<SeriesKey>`, hors de la clé `scans` : un
  enregistrement de la bibliothèque reste petit, et la popup ne lit que les couvertures des lignes affichées.
- **Le format stocké dans `chrome.storage.local` est un contrat public.** Les utilisateurs de la version
  publiée doivent relire leurs données après une mise à jour. Un changement de format ajoute la lecture de
  l'ancien format dans le gateway, il ne casse jamais les données existantes.
- Un gateway ne prend aucune décision métier : pas de `if` métier, pas de règle.
- Une erreur de transport (`chrome.runtime.lastError`, `!response.ok`) se traduit dans le gateway. Elle sort
  en rejet de la `Promise` ou en résultat du domaine, jamais en `Response` ou en objet Chrome.
- Chaque port a une variante in-memory dans `gateways/in-memory/`. Elle sert au mode développement
  (`ng serve`) et de double dans les specs : une seule implémentation, fidèle au contrat.

## Racine de composition

- `core/container.ts` construit les use-cases du service worker. C'est le seul fichier qui importe
  `inversify`, et seul `background.ts` l'importe.
- Les use-cases n'ont aucun décorateur. Le container les construit avec `toDynamicValue`.
- Côté Angular, le câblage passe par les fichiers providers : [`../front/state.md`](../front/state.md).

## Où placer une règle

> **Si l'import de l'historique produisait la même donnée qu'une page visitée, la règle devrait-elle encore
> s'appliquer ?**
> - **Oui** : c'est une règle métier, elle va dans le core (agrégat, Value Object ou use-case).
> - **Non, elle n'existe qu'à cause du transport** (forme du message, format stocké, payload Discord) : elle va
>   dans le point d'entrée ou le gateway.
> - **Non, elle n'existe qu'à cause d'un écran** (filtre, troncature, tri par défaut) : elle va dans
>   Angular, cf. [`../front/architecture.md`](../front/architecture.md).

## Dette identifiée

- `get_next_chapter_url.ts`, `rest_template.ts` et `call_to_website.interface.ts` n'ont aucun appelant.
  Supprime-les, ne les migre pas.
- `ChromeStorageService` et `DiscordNotification` vivent dans `src/app/gateway/` avec `@Injectable`, alors
  qu'ils implémentent du métier partagé. Ils deviennent des gateways du core.
- `background.ts` porte la logique d'import de l'historique (`getScansFromHistory`). Elle devient `ImportReadingHistoryUseCase`.

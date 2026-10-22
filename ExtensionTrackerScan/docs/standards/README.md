# `docs/standards/` : standards de développement de l'extension

Ces docs sont la **source de vérité** du code de `ExtensionTrackerScan/`. Elles s'adressent aux développeurs et
à tout assistant de code. [`/CLAUDE.md`](../../../CLAUDE.md) pointe ici et n'en recopie aucune règle.

## Ces docs font autorité, le code existant non

Le code actuel a été écrit avant ces standards. Un pattern fréquent dans le code n'est pas légitime pour
autant : ne prends jamais le code existant comme modèle.

- Si le code contredit une doc, **la doc gagne**. Implémente selon la doc et signale la divergence dans la PR.
- Si une règle te semble fausse, corrige-la ici d'abord. Ne la contourne pas en copiant du code non conforme.
- Exemple réel : `background.ts` lit `chrome.storage` et applique `updateScansWithNewVisitedScan` lui-même.
  [`core/use-case.md`](core/use-case.md) interdit toute logique dans un point d'entrée. Le code neuf passe par
  un use-case.

## Périmètre : le code neuf

Ces standards s'appliquent au code neuf. On ne migre pas l'existant sans demande explicite : pas de
« tant qu'on y est » dans une PR fonctionnelle. Aucune feature n'est encore conforme. Appuie-toi sur ces docs,
pas sur une feature voisine.

## Les trois contextes d'exécution

L'extension tourne dans trois contextes qui partagent un seul métier, le **core** (`src/app/core/`).

| Contexte | Point d'entrée | Rôle |
|---|---|---|
| Service worker | `src/background.ts` | Rôle « back » : reçoit les pages visitées, importe l'historique, appelle les use-cases |
| Page web lue | `src/content-script.ts` | Envoie les signaux de la page (titre, URL, `og:title`, `h1`, JSON-LD...) au service worker |
| Popup et page complète | `src/main.ts` (Angular 19) | Affiche la liste des scans, propose un site |

Le core se lit avec les docs `core/`. Angular se lit avec les docs `front/`.

## Les 10 non-négociables

Version condensée des règles les plus structurantes. Elle ne remplace pas la doc du sujet.

1. **Le métier vit dans le core, dans un use-case ou le modèle du domaine.** Jamais dans `background.ts`,
   `content-script.ts`, un composant ou un gateway. Un point d'entrée parse le message reçu et appelle
   `execute()`. → [`core/use-case.md`](core/use-case.md)
2. **Le core est sans framework.** `core/domain/`, `core/use-cases/` et `core/ports/` n'importent ni
   `@angular/*`, ni `rxjs`, ni `inversify`, ni `axios`, et n'appellent ni `chrome.*` ni `fetch`. Seuls
   `core/gateways/` et `core/container.ts` touchent l'extérieur. → [`core/architecture.md`](core/architecture.md)
3. **Toute I/O passe par un port en termes métier.** Les appels de ports restent visibles dans `execute()` :
   un use-case charge la bibliothèque une fois et l'enregistre une fois. Le gateway traduit, y compris les
   données déjà stockées chez les utilisateurs, et ne décide rien. → [`core/use-case.md`](core/use-case.md)
4. **Tell-Don't-Ask.** Un use-case dit à l'agrégat quoi faire (`library.recordReading(reading)`). Il ne lit
   jamais ses champs pour décider à sa place. Une commande du domaine retourne `void`, l'état se lit par
   `snapshot()`. → [`core/domain-model.md`](core/domain-model.md)
5. **Toute écriture est un use-case du core, une lecture non.** Une lecture appelle le port directement, sans
   méthode passe-plat. Le câblage port → gateway vit dans `<feature>.providers.ts` côté Angular et dans
   `core/container.ts` côté service worker. `environment.production` n'apparaît nulle part ailleurs.
   → [`front/state.md`](front/state.md)
6. **Atoms et molecules vivent dans `angular/design-system/`, sans code métier, chacun avec sa spec.** Un
   composant qui connaît le ViewModel est un organism. Seule la page est routée et injecte. Angular Material
   s'appelle directement, il ne se réenveloppe pas. → [`front/ui.md`](front/ui.md)
7. **L'état d'écran vit dans un signal store à côté de sa page.** Il est exposé en lecture seule et n'injecte
   rien. Ses commandes appliquent les règles pures de `service/`. Seule la page écrit dedans.
   → [`front/state.md`](front/state.md)
8. **Chaque règle métier a un test qui part de `execute()`.** Les ports de lecture sont doublés par le gateway
   in-memory, les ports de commande par un gateway qui enregistre les appels. Une spec par use-case, un seul
   `describe` plat. `TestBed` est interdit hors composants. → [`core/testing.md`](core/testing.md)
9. **Angular 19 moderne.** Standalone sans `NgModule`, signals, `input()`, `output()`, `viewChild()`,
   `@if` et `@for`, `inject()`, `OnPush`. Prettier formate selon le `.prettierrc` du dépôt.
   → [`code-style.md`](code-style.md)
10. **Aucun commentaire, aucun `any`, aucun cast pour faire taire le compilateur.** Le code est en anglais,
    avec le vocabulaire du glossaire : un concept, un nom. → [`naming.md`](naming.md),
    [`code-style.md`](code-style.md)

## Les standards

| Doc | Sujet |
|---|---|
| [`core/architecture.md`](core/architecture.md) | Couches du core, règle de dépendance, points d'entrée, gateways, racine de composition |
| [`core/use-case.md`](core/use-case.md) | Pattern use-case : `execute()`, ports, anti-patterns |
| [`core/domain-model.md`](core/domain-model.md) | Agrégat `ScanLibrary`, Value Objects, CQS, catalogue des sites |
| [`core/testing.md`](core/testing.md) | Tests de use-case, doubles par nature de port, tests de gateway |
| [`front/architecture.md`](front/architecture.md) | Couches Angular, arborescence des features, câblage, où placer une règle |
| [`front/ui.md`](front/ui.md) | Atomic design en 5 niveaux, design-system, Angular Material |
| [`front/state.md`](front/state.md) | Signal store d'écran, lectures et écritures, ports Angular, fichier providers |
| [`front/testing.md`](front/testing.md) | Specs de composants, store, règles d'écran |
| [`naming.md`](naming.md) | Suffixes de fichiers, glossaire, noms bannis |
| [`code-style.md`](code-style.md) | Angular 19, TypeScript, Prettier, commentaires |

## Une source, des pointeurs

```
docs/standards/*.md     source de vérité
        ▲
        │ référence, sans recopier
        │
/CLAUDE.md · instructions de tout autre assistant
```

Une règle vit dans un seul doc. Les autres docs pointent vers elle et ne la recopient pas.

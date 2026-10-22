# Architecture Angular

Source canonique pour : les couches Angular, la règle de dépendance, l'arborescence des features,
l'empaquetage des composants, les formulaires. L'état et le câblage : [`state.md`](state.md). Les niveaux de
composants : [`ui.md`](ui.md).

## Contexte

Angular 19 en composants standalone, avec Angular Material. Une seule application sert la popup de
l'extension (`index.html`) et sa page complète. Elle consomme le core (`src/app/core/`) : ses use-cases pour
écrire, ses ports pour lire, ses types pour afficher.

**Le front a son propre métier d'écran, il ne vole pas celui du core.** Filtrer les favoris, tronquer un
titre trop long ou trier par date de lecture sont des règles d'écran. Fusionner une lecture, valider une note
ou reconnaître un site appartiennent au core : le front en affiche le résultat.

## Les couches d'une feature

| Couche | Contenu | Interdits |
|---|---|---|
| `service/` | ViewModels (`*.vm.ts`), règles d'écran pures (`*.rules.ts`), ports propres à Angular (`*.port.ts`) | tout import Angular, `chrome.*`, tout gateway |
| `gateways/` | Gateways des ports propres à Angular, avec leur variante in-memory | toute décision |
| `ui/` | pages, templates, organisms, store d'écran (`*.store.ts`) | appel direct à un gateway, atom ou molecule (ils vivent dans `design-system/`) |

**Règle de dépendance** : `ui → service`, `ui → core`, `gateways → service`. `service/` ne dépend que du
core. `ui/` n'importe jamais `gateways/`, ni `core/gateways/`.

Un port propre à Angular n'existe que pour une action qui ne touche aucune donnée métier : ouvrir la page
complète dans un onglet. Toute écriture métier est un use-case du core
([`../core/use-case.md`](../core/use-case.md)).

## Arborescence

```
src/app/angular/
  app.config.ts · app.routes.ts
  injection-tokens.ts                les InjectionToken des ports (SCAN_REPOSITORY, FULL_PAGE_NAVIGATOR)
  shell/
    shell.providers.ts
    service/   full-page-navigator.port.ts
    gateways/  chrome-full-page-navigator.gateway.ts · in-memory-full-page-navigator.gateway.ts
    ui/pages/app-shell/              app-shell.page.ts · .html   (composant d'amorçage)
    ui/organisms/nav-bar/            nav-bar.component.ts · .html · .css   (barre de navigation)
  design-system/
    atoms/      star-toggle/ · truncated-text/
    molecules/  search-field/
  features/
    scan-list/                       onglet « Scan list », route ''
      scan-list.providers.ts
      service/  scan-row.vm.ts · scan-filters.rules.ts
      ui/
        pages/      scan-list/       scan-list.page.ts · .html · .css · scan-list.store.ts
        organisms/  scan-table/ · scan-filters/
    add-website-pattern/             onglet « Add Website », route 'add_website_pattern'
      add-website-pattern.providers.ts
      ui/
        pages/      add-website-pattern/
        organisms/  website-proposal-form/ · supported-websites-table/
  shared/ui/                         organisms et templates partagés par 2 features ou plus
```

- **Feature-first** : l'arbre annonce les onglets de l'extension, pas la technique.
- Les noms de dossiers sont imposés, mais un dossier n'est créé que s'il a du contenu.
  `add-website-pattern` n'a ni `service/` ni `gateways/` : il lit le catalogue du core et écrit par
  `ProposeWebsiteUseCase`.
- Le composant d'amorçage est traité comme une page : il injecte, il ne porte aucun markup métier.

## Un composant, un dossier

Tout composant vit dans un dossier à son nom, qui ne contient que lui et sa spec. Son markup, ses styles et
sa classe sont trois fichiers séparés : pas de `template:` ni de `styles:` en ligne. Les types du contrat d'un
composant (configuration d'input) vivent dans un `<composant>.types.ts` de son dossier.

```
❌ src/app/angular/scanTab/scan-tab.component.ts      dossier en camelCase, composant fourre-tout
✅ src/app/angular/features/scan-list/ui/pages/scan-list/scan-list.page.ts
```

## Formulaires

- La page possède le `FormGroup`. Un organism reçoit la valeur et émet la saisie, il ne crée pas de
  formulaire.
- Une règle de saisie qui vaut aussi hors de l'écran (une note de 1 à 10) vit dans un Value Object du core.
  Une règle propre à l'écran est une fonction pure de `service/*.rules.ts`.
- `service/` ignore `FormGroup` et `ValidatorFn`. La page fait le pont.

## Où placer une règle

La question du core décide d'abord : [`../core/architecture.md`](../core/architecture.md), « Où placer une
règle ». Si la règle est une règle d'écran, une seconde question tranche :

> **Le store ou un second composant a-t-il besoin de cette règle ?**
> - **Oui** : fonction pure dans `service/*.rules.ts`. Exemple : `filterScans(scans, filters)`.
> - **Non, elle n'existe qu'à cause de CE composant** (ouvert ou fermé, focus, tronqué) : dans le composant.

## Dette identifiée

- `src/app/angular/port/` mélange un port de données (`storage.interface.ts`, à remplacer par
  `ScanRepository` du core) et des ports d'interface.
- `src/app/gateway/` contient des gateways Angular (`@Injectable`) qui appellent le domaine. Ils
  deviennent des gateways du core ou de `shell/gateways/`.
- `AddWebsitePatternComponent` tient une copie de la liste des sites
  (cf. [`../core/domain-model.md`](../core/domain-model.md), « Le catalogue des sites »).

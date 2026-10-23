# UI et atomic design

Source canonique pour : les 5 niveaux de composants, leur critère de classement, leur emplacement, l'usage
d'Angular Material, les règles de composant.

## Les 5 niveaux

Le niveau ne se décide pas à la taille ni à la complexité visuelle. Il se décide sur des critères
structurels qu'un relecteur vérifie dans le fichier.

| Niveau | Critère décidable | Emplacement |
|---|---|---|
| **atom** | Feuille : aucun composant du projet dans son template. Aucune injection. Porte une logique propre (état, formatage, émission). | `angular/design-system/atoms/` |
| **molecule** | Assemble un petit groupe de contrôles qui vont ensemble (un libellé et son champ). **Zéro code métier** : aucun type du core, aucune règle, aucun ViewModel. Aucune injection. | `angular/design-system/molecules/` |
| **organism** | Compose molecules, atoms et Material. **Connaît le ViewModel.** **N'injecte rien** : tout entre par `input()`, tout sort par `output()`. | `features/<f>/ui/organisms/` |
| **template** | Définit la disposition d'un écran (zones, `ng-content`). Zéro donnée, zéro logique : se rend à vide sans erreur. | `features/<f>/ui/templates/` |
| **page** | **Seule routée**, seule à **injecter** store, use-case ou port. Aucun markup métier : elle branche le template et les organisms. | `features/<f>/ui/pages/` |

Trois questions suffisent à classer : *as-tu un composant enfant du projet ?* *importes-tu un type du core
ou un ViewModel ?* *injectes-tu quelque chose ?*

Exemples tirés de l'extension :

| Composant | Niveau | Raison |
|---|---|---|
| `bell-toggle` | atom | Un `<button>` `aria-pressed` avec une cloche (`notification_add`, pleine quand cochée), `input()` `checked`, `label` et `hint` (l'infobulle), `output()` `toggled`. Ne sait pas ce qu'est un favori. |
| `monogram` | atom | Tire d'un texte ses initiales et une teinte stable. Décoratif, `aria-hidden`. |
| `cover` | atom | La vignette d'une couverture à la taille du monogramme, qui apparaît en fondu. Décorative, `alt` vide : le titre est à côté. |
| `relative-date` | atom | Affiche « 3 mo ago » depuis une date et `now`, et pose `matTooltip` avec la date exacte. |
| `search-field` | molecule | Icône, `input` de recherche et bouton d'effacement assemblés. Champ contrôlé par `value`, émet le texte saisi. Sert aux deux onglets. |
| `scan-rows` | organism | Affiche un `ScanListView` : lignes paginées, lignes fantômes `aria-busy` pendant le chargement, échec du chargement avec « Retry », bibliothèque vide qui explique le suivi automatique et mène aux sites supportés, ou aucun résultat, avec le lien du nouveau chapitre d'un favori (« New · Ch. N », vers ce chapitre) ou l'indication, focalisable et expliquée dans son infobulle, d'un site impossible à vérifier ; le titre mène au dernier chapitre lu (« Continue reading Ch. N »), émet suppression, favori, note, effacement de la note, page. La note s'ouvre dans un menu (1 à 10 et « Clear rating ») : un sélecteur natif changerait la note aux flèches du clavier. Après une suppression, il pose le focus sur le titre voisin et ignore un second clic de suppression pendant 300 ms : la ligne suivante glisse sous le pointeur. |
| `new-chapter-settings` | organism | Un bouton dont le texte visible, qui est aussi son nom, dit la fréquence et l'état des alertes (« Checks every 6 hours · Alerts off »). Il ouvre un menu : fréquence (`1h`, `6h`, `24h`, `off`), alertes du bureau, et une note sur la pastille de l'icône. Émet le choix, la page l'applique et explique un refus de la permission. |
| `scan-filters` | organism | Champ de recherche et bascules « Following only », « Rated only ». Émet un `ScanFilters`. |
| `about-sections` | organism | Ce que l'extension suit et comment, la veille des chapitres, la confidentialité avec l'interrupteur des rapports, le contact et la version. Émet le choix des rapports. |
| `website-proposal-form` | organism | Le champ « Chapter page URL » et l'état de la demande (`ProposalStatus` : envoi, envoyé, déjà supporté, échec et « Retry ») dans une zone `role="status"`. La page lui demande le focus par `focus()` quand le lecteur vient de la liste. |
| `verified-websites` | organism | La liste filtrable des sites vérifiés. Une adresse collée se compare par son hôte ; sans résultat, il propose « Request this site ». |
| `scan-list` | page | Routée sur `''`, injecte le store et les use-cases. |

## Atoms et molecules sont le design-system, et rien d'autre

- Tous les atoms et toutes les molecules vivent dans `angular/design-system/`. Ils ne contiennent aucun code
  métier, et `design-system/` n'importe rien de `features/`, de `shell/`, ni du core.
- Un composant qui connaît un ViewModel, une règle ou un type du core n'est pas une molecule. C'est un
  organism, il vit dans `features/<f>/ui/organisms/`.
- **Tout atom et toute molecule a une spec de comportement** ([`testing.md`](testing.md)).
- Un organism ou un template utilisé par 2 features ou plus remonte dans `shared/ui/`, jamais dans
  `design-system/`.

## Angular Material s'appelle directement

Une page, un organism ou une molecule appelle directement `mat-table`, `mat-paginator`, `mat-select`,
`mat-checkbox`, `matTooltip`, comme une balise HTML. **Le design-system ne réenveloppe pas Material.**

Un composant du design-system ne se crée que s'il ajoute quelque chose : un assemblage réutilisé, une règle
d'accessibilité, une logique d'affichage. Un fichier qui ne fait que retransmettre les inputs d'un composant
Material est du bruit : supprime-le.

```ts
// ❌ atom qui ne fait que réexposer mat-checkbox
@Component({ selector: "ds-checkbox", imports: [MatCheckboxModule] }) // <mat-checkbox [checked]="checked()" />
// ✅ appel direct dans l'organism
imports: [MatCheckboxModule]; //                                         <mat-checkbox (change)="...">Favorites Only</mat-checkbox>
// ✅ molecule qui apporte l'assemblage libellé + champ + nettoyage de la saisie
imports: [SearchFieldComponent]; //                                      <ds-search-field label="Filter by title" (searched)="..." />
```

**Du HTML natif mis en forme n'est pas un composant.** Un titre, un paragraphe d'aide, un message de succès
s'écrivent en balises dans le composant qui les affiche.

- Un composant du design-system couvre le besoin courant, et rien de plus : aucun input ajouté « au cas où ».
- Un composant du design-system qui couvre presque le besoin s'étend, il ne se duplique pas.
- Le jugement « ce composant ajoute-t-il autre chose que l'enveloppe ? » se tient en revue.

## Couleurs et contraste

Les couleurs viennent des jetons `--app-*` de `src/styles.scss`. Tout texte atteint 4,5:1 sur son fond, toute
icône ou bordure qui porte un sens 3:1 (WCAG AA). `--app-faint` est le texte le plus pâle admis : il passe
4,5:1 sur `--app-bg`, `--app-surface` et `--app-surface-2`, pas sur `--app-surface-3`, où le texte prend
`--app-muted`. Le contour d'un champ de saisie est `--app-field-line`, jamais `--app-line`, qui reste
décoratif. Un monogramme garde un texte blanc lisible quelle que soit sa teinte, car sa couleur claire est
en `oklch` à luminosité fixe. Une cible cliquable fait au moins 24 × 24 px.

## Règles de composant

- **Le template ne contient pas de logique.** Pas d'appel de méthode dans une interpolation ni dans un
  binding. Ce qui se calcule est un `computed` ou un champ du ViewModel. Un pipe Angular (`date`) est admis.

```html
<!-- ❌ méthode appelée deux fois par cycle de détection -->
<a [matTooltip]="truncateTitle(scan.title).isTruncated ? scan.title : ''">
  {{ truncateTitle(scan.title).truncated }}
</a>
<!-- ✅ le CSS coupe le titre, l'infobulle est un champ du ViewModel, la date est formatée par un pipe -->
<a class="title" [matTooltip]="row.readingHint">{{ row.title }}</a>
{{ row.readAt | date: "dd/MM/yyyy" }}
```

- Un élément cliquable est un `<button>` ou un `<a href>`. ❌ `<img (click)="delete(scan)">`,
  ❌ `<div (click)="selectButton('home')">`.
- Un organism, une molecule et un atom n'accèdent ni au routeur, ni à `window`, ni à un use-case. Ils
  émettent un `output()`, la page décide. ❌ `window.open(url, '_blank')` dans le composant du tableau.
  ✅ `<a [href]="row.url" target="_blank">`, qui ne demande aucun code.
- Pas d'`input()` optionnel qui change le comportement d'un composant. Deux comportements font deux
  composants, ou un slot.

# Tests Angular

Source canonique pour : la pyramide des tests Angular, l'interdit de `TestBed` hors composants, les specs de
composants. Les tests du core : [`../core/testing.md`](../core/testing.md). Le nommage et la disposition des
specs y sont communs.

## Principe

Chaque comportement se teste à une seule couche, celle qui le porte. Une règle métier se teste dans la spec
de son use-case, jamais par un composant. Une spec de page traverse les vrais use-cases pour prouver le
câblage, pas pour réénumérer leurs cas limites.

## La pyramide

| Couche | Type de test | Double |
|---|---|---|
| `service/` (règles d'écran) | Jest pur, par la fonction exportée | aucun |
| store d'écran | Jest pur, `new ScanListStore()` | aucun |
| `gateways/` Angular | Jest, API Chrome remplacée par un enregistreur | aucun |
| design-system atoms | `@testing-library/angular`, **chaque atom** | aucun |
| design-system molecules | `@testing-library/angular`, **chaque molecule** | aucun |
| organisms | `@testing-library/angular`, **chaque organism** | aucun, enfants réels |
| pages | `@testing-library/angular` | gateways in-memory du core sous de vrais use-cases |

`@testing-library/angular`, `@testing-library/user-event` et `jest-preset-angular` ne sont pas encore
installés. La première spec de composant les ajoute.

## `TestBed` est interdit hors composants

`TestBed` est lent et pousse à tester les mécaniques d'Angular. Il est interdit dans les specs de
`service/`, de store et de gateway. Une spec de composant passe par `render()` de
`@testing-library/angular`, jamais par `TestBed.createComponent()` directement.

## Composants

- **Du point de vue de l'utilisateur** : on cherche par rôle, libellé ou texte, on agit avec `user-event`,
  on assert ce qui est affiché ou ce qui est émis.
- **Interdit** : `componentInstance`, appel direct d'une méthode du composant, lecture d'un `FormControl`,
  assertion sur une classe CSS ou un sélecteur de structure, `fireEvent`.
- **Atom** : la spec cible sa logique propre. `truncated-text` affiche le texte coupé et le texte entier dans
  l'infobulle au-delà de la longueur, le texte intact en deçà.
- **Molecule** : la spec décrit ce qu'elle affiche à partir de ses inputs et ce qu'elle émet quand
  l'utilisateur agit. Ses interactions se testent ici une fois, pas dans chaque organism.
- **Organism** : enfants réels, le ViewModel en input. On assert l'affichage et les `output()` émis.
- **Page** : la spec fournit les providers de la feature avec les gateways in-memory du core, puis vérifie un
  parcours. Exemple : cliquer sur l'étoile d'un scan le fait apparaître sous « Favorites Only ».

## Ne pas tester

Les mappers seuls, les getters, les ViewModels sans logique, les mécaniques d'Angular (`@if`, binding,
`FormControl`), le comportement interne de Material (pagination, tri d'en-tête).

## Nommage

Libellé : `should <effet à l'écran> when <action ou condition>`. Un test qui observe un `output()` nomme
l'effet attendu, jamais le mécanisme.

```ts
// ✅ it("should show only favorite scans when Favorites Only is checked")
// ❌ it("should emit filtersChanged")
// ❌ it("should call applyCheckboxFilter")
```

# Style de code

Source canonique pour : les idiomes Angular 19, le typage TypeScript, le formatage, les commentaires.

## Angular 19

- **Composants standalone**, sans `NgModule`. `standalone: true` est la valeur par défaut d'Angular 19 :
  ne l'écris pas.
- **Signals** pour l'état et les données dérivées : `signal`, `computed`, `input()`, `output()`,
  `viewChild()`. RxJS reste admis pour un flux d'événements Angular (`router.events`), converti par
  `toSignal`. Il ne porte jamais un état.
- **Control flow natif** : `@if`, `@for` avec `track`, `@switch`. Jamais `*ngIf`, `*ngFor`. Sans eux, un
  composant n'a pas besoin de `CommonModule`.
- **`inject()`**, jamais l'injection par constructeur ni `@Inject`.
- **`ChangeDetectionStrategy.OnPush`** sur tout composant neuf.
- Pas de `subscribe` sans fin de vie : `toSignal` ou `takeUntilDestroyed`.
- Pas de `setTimeout` pour attendre la vue : `viewChild()` et `computed` ou `effect` à la place.

```ts
// ❌
@ViewChild(MatPaginator) paginator!: MatPaginator;
constructor(@Inject(STORAGE_TOKEN) private storage: StorageInterface, private datePipe: DatePipe) {}
ngOnInit(): void { this.router.events.subscribe((event) => { ... }); }

// ✅
private readonly paginator = viewChild.required(MatPaginator);
private readonly store = inject(ScanListStore);
private readonly url = toSignal(this.router.events.pipe(filter((event) => event instanceof NavigationEnd)));
```

```html
<!-- ❌ -->
<mat-option *ngFor="let rate of ratingOptions" [value]="rate">{{ rate }}</mat-option>
<div *ngIf="successMessage" class="success-message">...</div>
<!-- ✅ -->
@for (rating of ratings; track rating) {
  <mat-option [value]="rating">{{ rating }}</mat-option>
}
@if (isProposalSent()) {
  <p class="success-message">The website has been proposed successfully</p>
}
```

## Typage

- `tsconfig.json` est en `strict`. Ne le relâche pas.
- **Aucun `any`**, specs comprises. ❌ `const webtoonParser: any`, `(item as any)[property]`,
  `error?: any`.
- **Aucun cast pour faire taire le compilateur**, aucun `!` non prouvé. ❌ `{ ... } as Scan`,
  `paginator!: MatPaginator`. Un objet qui satisfait un type s'annote (`const page: VisitedPage = { ... }`) ou
  `satisfies`.
- `unknown` ne se pose qu'à une frontière : message reçu par `chrome.runtime.onMessage`, donnée lue dans
  `chrome.storage`, `catch`. Une fonction de parse le réduit à un type du domaine. Une structure
  réutilisable prend un générique.
- Une propriété facultative s'écrit `field?: T`, jamais `field: T | undefined`.
- `readonly` sur tout champ qui n'est pas réassigné.

## Variables et fonctions

- `const` par défaut, `let` si la variable est réassignée, jamais `var`.
- Une fonction libre se déclare en `const` fléché, avant ses appelants. Le mot-clé `function` n'apparaît
  pas dans le code neuf, specs comprises.
- Pas de paramètre réassigné. ❌ `titleWebpage = this.removeBackSlashAndSpaceAtBeginning(titleWebpage)`.

```ts
// ❌ export function deleteScan(scansList: Scan[], scan: Scan): Scan[] { ... }
// ✅ export const toScanRow = (snapshot: ScanSnapshot): ScanRow => ({ ... });
```

## Logs et erreurs

- Pas de `console` dans `core/domain/`, `core/use-cases/` ni `service/`. Une erreur est un résultat du
  domaine ou une exception typée.
- Un gateway peut écrire `console.error` sur une erreur de transport qu'il avale volontairement.
- Une erreur du domaine est une classe qui étend `Error`, nommée par la règle violée : `ScanNotFound`,
  `InvalidRating`.

## Formatage

**Prettier tranche toute question de forme.** La configuration est le `.prettierrc` à la racine du dépôt
(`tabWidth: 2`), complétée par le `.editorconfig` du projet (`quote_type = single`, que Prettier 3 lit : donc
guillemets simples). Aucun débat de style
en revue.

```bash
npx prettier --write <fichiers modifiés>
npx prettier --check "ExtensionTrackerScan/src/**/*.{ts,html,css}"
```

- Formate tout fichier que tu crées ou modifies.
- Le premier passage de Prettier sur un fichier existant part dans un commit de formatage séparé, sans
  autre changement, pour garder le diff fonctionnel lisible.
- `prettier-ignore` est réservé à un alignement qui porte du sens : un tableau de cas `it.each`.

## Commentaires

**Aucun commentaire dans le code.** Un commentaire qui reformule le code est du bruit : préfère un nom
explicite ou une fonction extraite. Le *pourquoi* va dans le message de commit ou la PR.

```ts
// ❌
//Check that the url of website is at the beginning
private isNotARedirection(url: string, numberToAddInCase: number, website: any): boolean
// ✅
const startsWithHost = (url: string, host: string): boolean => ...
```

- Pas de code commenté : supprime-le, git le garde. ❌ le corps de `restTemplate.test.ts` en commentaires.
- Pas de commentaire de section dans un template. ❌ `<!-- Pagination -->`.
- Seule exception : une contrainte externe que le code ne peut pas montrer, comme un comportement imposé par
  l'API Chrome. Elle tient en une ligne et nomme la contrainte.

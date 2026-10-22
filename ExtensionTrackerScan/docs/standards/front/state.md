# État, lectures, écritures et câblage

Source canonique pour : le store d'écran, le rôle du use-case comme service de feature, les ports propres à
Angular, le fichier providers.

## Store d'écran

L'état d'un écran vit dans un **signal store** unique, `<page>.store.ts`, dans le dossier de la page qui le
possède.

- Il expose son état en **lecture seule** (`Signal`, `computed`), jamais un `WritableSignal`.
- Il **n'injecte rien** : ni use-case, ni port, ni service.
- **Ses commandes appliquent les règles pures de `service/`** à l'état qu'il détient. C'est lui qui tient les
  invariants de l'écran. Un store dont les commandes ne font que poser une valeur repousse la règle dans la
  page.
- Il ne fait aucune I/O et rien d'asynchrone.
- **La page est la seule à écrire dedans** : elle appelle le use-case, reçoit son résultat, l'applique.
- Il est fourni dans les `providers` de la page. `providedIn: 'root'` est réservé à un état partagé entre
  features, et il n'en existe aucun aujourd'hui.
- Une donnée dérivée est un `computed`, jamais un champ recalculé à la main.

```ts
// ❌ état éparpillé en champs mutables, filtre recalculé à la main
scans: Scan[] = [];
checkedFavorite: boolean = false;
private applyCheckboxFilter() { let scansListFiltered = this.scans; ... this.scansTab.data = scansListFiltered; }

// ✅ store : état privé, lecture seule, règle pure appliquée par un computed
export class ScanListStore {
  private readonly scans = signal<ScanRow[]>([]);
  private readonly filters = signal<ScanFilters>(NO_FILTERS);
  readonly visibleScans = computed(() => filterScans(this.scans(), this.filters()));

  showLibrary(snapshots: ScanSnapshot[]): void { this.scans.set(snapshots.map(toScanRow)); }
  applyFilters(filters: ScanFilters): void { this.filters.set(filters); }
}
```

## Écriture : le use-case du core est le service de feature

Le standard d'origine place un service de feature dans chaque feature. Ici, ce rôle est tenu par les
use-cases du core, partagés avec le service worker. **Une feature n'a pas de `*.service.ts`.**

- **Commande** (supprimer, mettre en favori, noter, proposer un site) : la page appelle le `execute()` d'un
  use-case. Elle n'appelle jamais `scanRepository.save()` elle-même.
- **Requête** (charger la bibliothèque, lister les sites vérifiés) : la page lit le port
  (`scanRepository.load()`) ou la liste du core (`VERIFIED_WEBSITES`) directement. Pas de méthode
  passe-plat.
- Le use-case retourne son résultat. La page le pose dans le store. Le use-case ne connaît ni store, ni
  composant, ni route.

```ts
// ❌ la page fait l'écriture et recalcule la liste elle-même
delete(scanToDelete: Scan) {
  this.storage.delete(scanToDelete);
  this.scans = this.scans.filter((scan) => scanToDelete.title !== scan.title);
}

// ✅ la page appelle le use-case et applique son résultat
async deleteScan(title: string): Promise<void> {
  this.store.showLibrary(await this.deleteScanUseCase.execute(title));
}
```

## Ports propres à Angular

- Un port propre à Angular est une interface de `service/*.port.ts`, sans import Angular. Aujourd'hui, deux
  en ont besoin : `FullPageNavigatorPort`, qui ouvre `news.html` dans un onglet, et `CoverBackfillPort`, qui
  demande au service worker de chercher les couvertures des lignes affichées sans couverture. Le use-case
  `BackfillCoversUseCase` tourne dans le service worker, seul à écrire les couvertures : la popup ne fait que
  le demander, puis relit les couvertures par `CoverRepository`.
- Son gateway Chrome et sa variante in-memory vivent dans `gateways/` de la même feature ou de `shell/`.
- Un port qui lit ou écrit des scans n'est jamais un port Angular : c'est `ScanRepository` du core.
- Un port s'injecte par une `InjectionToken`. Toutes les `InjectionToken` vivent dans
  `angular/injection-tokens.ts`, car ni le core ni `service/` n'importent Angular. Un use-case n'a pas de
  token : sa classe en tient lieu.

## Le fichier providers

Le câblage port → gateway et la construction des use-cases vivent dans `<feature>.providers.ts`, à la racine
de la feature, branché sur la **route**.

- C'est le seul fichier d'une feature qui importe un gateway.
- C'est le seul endroit où `environment.production` choisit entre gateway Chrome et gateway in-memory.
- Il construit chaque gateway et chaque use-case par `useFactory`. Les classes du core n'ont pas de
  `@Injectable`.

```ts
// ❌ choix de l'environnement dans les providers du composant
providers: [{ provide: STORAGE_TOKEN, useClass: environment.production ? ChromeStorageService : InMemoryStorageService }]

// ✅ features/scan-list/scan-list.providers.ts
export const SCAN_LIST_PROVIDERS: Provider[] = [
  {
    provide: SCAN_REPOSITORY,
    useFactory: () =>
      environment.production
        ? new ChromeStorageScanRepository()
        : new InMemoryScanRepository(DEV_SCANS),
  },
  {
    provide: DeleteScanUseCase,
    useFactory: () => new DeleteScanUseCase(inject(SCAN_REPOSITORY)),
  },
];

// ✅ app.routes.ts
{ path: "", component: ScanListPage, providers: SCAN_LIST_PROVIDERS }
```

Jamais dans les `providers` d'un composant : une page qui déclare son gateway importe `gateways/` et casse
la règle de dépendance.

## Le mot « service » et le mot « facade »

`*.service.ts` n'existe pas dans le code neuf : selon ce qu'il fait, c'est un use-case du core, un gateway
ou un store. ❌ `ChromeStorageService`, `DiscordNotification` dans `discord-notify.service.ts`. Le mot
« facade » est banni.

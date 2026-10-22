# Modèle du domaine

Source canonique pour : l'agrégat, les Value Objects, la séparation commande/requête, le catalogue des sites.
Le vocabulaire : [`../naming.md`](../naming.md).

## Les briques

Le domaine se modélise avec des briques DDD nommées. Le type fourre-tout (`Scan` avec ses champs `string`
modifiés de partout) est banni du code neuf : chaque objet est soit l'agrégat, soit un Value Object, soit
une projection de lecture.

| Brique | Objet | Contenu |
|---|---|---|
| Agrégat | `ScanLibrary` | Tous les scans suivis par le lecteur. Tient les invariants de la bibliothèque. |
| Value Object | `ScanTitle`, `SeriesKey`, `Chapter`, `Rating`, `Reading` | Immuable, égalité par valeur, valide dès la construction |
| Projection de lecture | `ScanSnapshot` | Donnée en lecture seule, sans identité ni mutateur. Lue par Angular et par le gateway. |
| Service du domaine | `PageTitleParser` | Transforme une page visitée en `ParsedPage`, à l'aide du catalogue |
| Service du domaine | `parseUnsupportedWebsitePage` | Reconnaît une lecture sur un site hors catalogue, à partir du seul titre et de l'URL |
| Catalogue | `WEBSITE_PATTERNS` | Les sites supportés et le format de titre de chacun |

Préfère un Value Object à un champ primitif. Une notion qui porte une règle (normalisation, intervalle,
comparaison) est un Value Object.

## L'agrégat `ScanLibrary`

`ScanLibrary` est l'unique agrégat. Ses invariants :

- une lecture enrichit le scan de la même série, reconnue par sa `SeriesKey` (voir plus bas) ; le scan garde
  son titre affiché, la lecture ne le renomme pas ;
- supprimer, noter ou mettre en favori vise le titre affiché, comparé par `ScanTitle.equals()` (casse
  ignorée) ;
- une lecture plus ancienne que la lecture enregistrée ne remplace pas celle-ci ;
- une note est un entier de 1 à 10 ;
- noter, mettre en favori ou supprimer un scan absent échoue par une erreur du domaine.

Le gateway reconstruit l'agrégat par `ScanLibrary.restore(snapshots)` et l'enregistre par `snapshot()`.

`restore()` fusionne les scans dont la `SeriesKey` est égale (`SeriesKey.equals()`, jamais `match()`) : une
bibliothèque enregistrée avant la règle d'identité peut contenir deux lignes pour une série. Le scan fusionné
garde la place du premier, la lecture la plus récente (titre compris), le favori si l'un l'était, et la note de
la lecture la plus récente, sinon celle de l'autre. Fusionner une bibliothèque déjà fusionnée ne change rien.

## L'identité d'une série

Un lecteur change de site, et un site change de domaine : la même série revient sous un titre un peu différent.
`SeriesKey` est la forme normalisée d'un `ScanTitle` qui reconnaît la même série. Une fausse fusion écrase le
chapitre d'une autre série, une fusion manquée laisse seulement un doublon : **dans le doute, ce sont deux
séries.**

- `SeriesKey.of()` retire la casse, les accents (Unicode NFKD), les apostrophes et la ponctuation, les articles
  `the`, `a`, `an`. `×` devient `x`, `&` devient `and`, les chiffres romains `II` à `IX` deviennent des chiffres.
- `SeriesKey.equals()` compare ces mots, dans l'ordre.
- `SeriesKey.match()` rend `same`, `different` ou `ambiguous`. `same` : clés égales, ou égales sans espaces
  (`Nano Machine`, `Nanomachine`), ou mêmes mots dans un autre ordre, sans `of` ni `s` final
  (`Return of the Mount Hua Sect`, `Mount Hua Sect's Return`). `ambiguous` : tous les mots de l'un figurent dans
  l'autre (`Solo Leveling`, `Solo Leveling: Ragnarok`). Le domaine traite `ambiguous` comme `different`.
- Un nombre n'est jamais ignoré : `The Breaker 2` et `The Breaker 3` restent deux séries. Un mot ajouté non plus :
  `(Remake)`, `(Novel)`, `0`, un sous-titre font une autre série.
- Pas de similarité approximative (distance d'édition) : elle confond des séries proches sans preuve qu'elle
  n'écrase rien. Un alias d'une autre langue (`Jeonjijeok Dokja Sijeom`) ou une reformulation
  (`Return of the Blossoming Blade`) demande une source d'alias, pas une règle sur le titre.
- Toute modification de cette règle se mesure avec `npm run eval:identity` ([`testing.md`](testing.md)).

## Tell-Don't-Ask

Un use-case dit à l'agrégat quoi faire. Il ne lit pas son état pour décider à sa place.

```ts
// ❌ le code appelant inspecte, décide et mute
let existingScan = scansList.find((scan) => scan['title'].toLowerCase() === newScan.title.toLowerCase());
if (new Date(existingScan.whenWasItRead) > new Date(newScan.whenWasItRead)) {
  return scansList;
}
existingScan['chapter'] = newScan.chapter;

// ✅ l'agrégat tient la règle
library.recordReading(reading);
```

## Séparation commande et requête

Chaque méthode du domaine est soit une commande, soit une requête, jamais les deux.

- **Commande** : change l'état, retourne `void`. `recordReading`, `remove`, `toggleFavorite`, `rate`.
- **Requête** : retourne une donnée, ne mute rien. `snapshot`, `equals`.

`updateScansWithNewVisitedScan` mute la liste reçue et la retourne : c'est les deux à la fois. Le code neuf ne
reproduit pas cette forme.

## Value Objects

- Un Value Object est une classe aux champs `readonly`, construite par une fabrique qui valide :
  `Rating.of(7)`, `Chapter.parse("12,5")`.
- Une valeur invalide ne construit pas d'objet. La fabrique `parse` lit un texte venu de l'extérieur et
  retourne `undefined` s'il est invalide. La fabrique `of` reçoit une valeur déjà typée et lève une erreur du
  domaine (`InvalidRating`) si elle est invalide.
- `Chapter` porte un nombre, pas une `string`. La normalisation de `"12,5"`, `"12-5"` et `"12_5"` vit
  dans `Chapter.parse()`, une seule fois.
- `Reading` porte une `Date`, jamais une date en texte. ❌ `whenWasItRead: string`.

## Résultats du domaine en union discriminée

Un résultat à plusieurs issues est une union discriminée, pas un tableau vide ni une exception avalée.

```ts
// ❌ tableau positionnel, issue « inconnue » confondue avec « pas un scan »
execute(titleWebpage: string, url: string): string[]

// ✅ chaque issue est nommée
type ParsedPage =
  | { kind: "reading"; reading: Reading }
  | { kind: "not-a-scan" }
  | { kind: "unparsed"; page: VisitedPage };
```

Un `switch` du use-case sur `ParsedPage.kind` est de l'orchestration, pas une inspection : le domaine a
déjà décidé.

## Le catalogue des sites

- `WEBSITE_PATTERNS` est la seule liste des sites supportés. La page « Add Website » affiche
  `SUPPORTED_WEBSITES`, dérivé du catalogue. Elle n'en tient pas une copie.
- Le catalogue est typé (`readonly WebsitePattern[]`), sans `any`. Les formats d'un site forment un tableau,
  pas un objet indexé par `'1'`, `'2'`, `'3'`.
- Le catalogue garde la priorité. Une page d'un site supporté qui ne suit aucun format est signalée, jamais
  confiée à l'analyse générique.
- Ajouter un site, c'est ajouter une entrée au catalogue et une ligne au tableau de cas de la spec
  ([`testing.md`](testing.md)).

```ts
// ❌ copie à la main, qui a déjà divergé : battwo.com et harimanga.me sont analysés mais absents de la page
availableWebsites: string[] = ['toonily.com', 'asuracomic.net', ...];

// ✅ une source, une dérivation
export const SUPPORTED_WEBSITES = WEBSITE_PATTERNS.map((pattern) => pattern.host);
```

## Les sites hors catalogue

Une page d'un `UnsupportedWebsite` devient une lecture seulement si tous les indices concordent. Une entrée
fausse dans la bibliothèque coûte plus cher qu'une lecture manquée : dans le doute, la page est ignorée, sans
signalement.

- Le titre de la page porte une `ChapterMention` (`Chapter 12`, `Chapitre 12,5`, `Ep. 12`, `第12話`), suivie
  d'un séparateur ou d'un qualificatif (`Online`, `VF`), jamais d'un mot de phrase (`Chapter 11 bankruptcy`).
- L'URL confirme le même numéro (`/chapter-12`, `/c12`, `?ep=12`, `/12/`). Un identifiant
  (`/chapter/3186773`) ne confirme rien.
- La page parle de lecture (`manga`, `manhwa`, `webtoon`, `scan`...) et d'aucun autre média (`anime`,
  `novel`, `wiki`, `podcast`...). Les deux lexiques sont des tableaux du domaine.
- Un mot de lecture compte s'il est un mot entier du titre ou de l'URL, pluriel compris, ou s'il figure dans
  le nom d'hôte (`asuratoon`, `reaperscans`) : `scandal` ne parle pas de scan. Un mot d'un autre média compte
  partout, même au milieu d'un mot (`kimcartoon`) : dans le doute, la page est ignorée.
- Aucun segment du chemin de l'URL ne désigne autre chose qu'une lecture (`/course/`). Ces segments forment
  un troisième tableau, distinct des lexiques : ils se comparent segment par segment, pas mot par mot.
- Le titre du scan précède la mention. S'il la suit (`Chapter 12 - Titre | Site`), l'URL doit le contenir.

Le contenu de la page (`og:title`, JSON-LD) n'entre pas en jeu : l'import de l'historique ne connaît que le
titre et l'URL, et les deux chemins appliquent la même règle.

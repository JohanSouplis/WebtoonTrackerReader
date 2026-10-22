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
| Service du domaine | `parseUnsupportedWebsitePage` | Reconnaît une lecture sur un site hors catalogue quand les signaux de la page s'accordent |
| Catalogue | `WEBSITE_PATTERNS` | Les sites supportés et le format de titre de chacun |
| Liste générée | `VERIFIED_WEBSITES` | Les sites vérifiés sur une vraie page de chapitre, avec la date de vérification |

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
- un scan garde l'adresse de la page de sa série (`seriesUrl`) que la lecture la plus récente a lue ; une
  lecture sans cette adresse (l'import de l'historique) garde l'adresse connue si elle vient du même site,
  l'oublie sinon ;
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

## La page d'une série

`seriesPageUrlOf(page, title)` (`series-page.ts`) trouve sur une page de chapitre le lien vers la page de sa série,
dans l'ordre : un élément du fil d'Ariane JSON-LD (`ListItem`), un lien du fil d'Ariane, un lien de la page. Le
texte du lien doit désigner la même série (`SeriesKey.match()` rend `same`), et le lien reste sur le même site,
sans être la page elle-même ni l'accueil. Sinon la page n'a pas de lien de série : on ne devine jamais
l'adresse depuis le chemin de l'URL.

## La couverture d'une série

Une couverture remplace le monogramme à gauche du titre. Une image fausse (une page du chapitre, un logo, une
bannière) coûte plus cher que pas d'image : **dans le doute, le monogramme reste.**

- `Cover` (`cover.ts`) est l'état connu de la couverture d'une série : `found` (une `Thumbnail` WebP en data URL,
  sa source `page` ou `series-page`, sa date) ou `missing` (la date de l'essai). Une série sans état n'a jamais
  été cherchée.
- Une série se cherche si elle n'a pas d'état, ou si son dernier essai manqué date de 7 jours ou plus
  (`isCoverDue`). Une couverture trouvée ne se cherche plus.
- `CoverSearch` (`cover-search.ts`) est la machine à états d'une recherche. Elle dit l'étape suivante
  (télécharger une image, lire une page, terminé) et le use-case exécute l'étape par un port. Les règles
  vivent dans la machine, les ports restent visibles dans `execute()`.
- **Les candidates d'une page**, dans l'ordre : `og:image`, `twitter:image`, `link[rel=image_src]`, l'image
  JSON-LD d'un nœud `ComicSeries`, `ComicStory` ou `Book`, puis une `<img>` dont le texte alternatif désigne la
  série. Sur une page de chapitre, ce texte est exactement le titre (`SeriesKey.equals()`) : les pages du
  chapitre ont un texte comme `Titre Chapter 248 Page 1`. Sur la page de la série, le texte peut contenir le
  titre, sans numéro ni mot de page ou de chapitre autour.
- **Une image est acceptée** si elle est en portrait (largeur sur hauteur entre 0,5 et 0,9) et large d'au moins
  100 px. La première acceptée gagne.
- Si aucune candidate de la page lue n'est acceptée, la recherche lit une fois la page de la série et applique
  les mêmes règles. Une image déjà essayée ne se télécharge pas deux fois.
- L'image se télécharge avec la page où elle a été trouvée en `Referer`, sauf vers un hôte qui sert un leurre à
  un `Referer` étranger (`uploads.mangadex.org` hors de `mangadex.org`) : aucun `Referer` alors.
- `BackfillCoversUseCase` cherche au plus 10 séries par ouverture de la popup, parmi les lignes affichées sans
  couverture, une requête à la fois par site. Il part de la page de la série si le scan la connaît, sinon de la
  dernière page lue.
- Supprimer un scan supprime la couverture de sa série (`DeleteScanUseCase`). Aucun autre scan ne la partage : la
  bibliothèque ne garde qu'un scan par `SeriesKey`, `restore()` et `recordReading()` fusionnent les autres.

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

- `WEBSITE_PATTERNS` est la seule liste des sites supportés. Un domaine mort y reste tant que l'analyse
  générique ne lit pas ses pages : l'import de l'historique en rencontre encore.
- La page « Add Website » affiche `VERIFIED_WEBSITES`, généré par `npm run sites:verified` dans
  `verified-websites.json`. Un site y figure si le content script lit exactement une de ses pages de chapitre
  capturées (`eval/parser/captures/*.json`) sans en lire aucune de travers, ou si c'est un site du catalogue
  dont aucune capture ne le dit mort ou redirigé. Chaque site porte la date de sa capture. La liste ne
  s'écrit pas à la main : après de nouvelles captures, relance le script et commite le fichier.
  `npm run eval:parser` signale un fichier en retard.
- Le catalogue est typé (`readonly WebsitePattern[]`), sans `any`. Les formats d'un site forment un tableau,
  pas un objet indexé par `'1'`, `'2'`, `'3'`.
- Le catalogue garde la priorité. Une page d'un site supporté qui ne suit aucun format est signalée, jamais
  confiée à l'analyse générique.
- Ajouter un site, c'est ajouter une entrée au catalogue et une ligne au tableau de cas de la spec
  ([`testing.md`](testing.md)).
- Un site n'entre ou ne reste au catalogue que si ses formats battent l'analyse générique sur
  `npm run eval:parser` (section « catalog against the generic parser »). Un site que l'analyse générique lit
  aussi bien quitte le catalogue : il ne reçoit plus de format à maintenir quand il change de titre ou de
  domaine. Un domaine mort ou repris par un autre site quitte le catalogue dès que l'analyse générique couvre
  ses pages.

```ts
// ❌ copie à la main, qui a déjà divergé : battwo.com et harimanga.me sont analysés mais absents de la page
availableWebsites: string[] = ['toonily.com', 'asuracomic.net', ...];

// ❌ le catalogue entier : il affiche des domaines morts et tait les sites lus par l'analyse générique
export const SUPPORTED_WEBSITES = WEBSITE_PATTERNS.map((pattern) => pattern.host);

// ✅ la liste que l'eval a vérifiée, régénérée par un script
export const VERIFIED_WEBSITES: readonly VerifiedWebsite[] = verifiedWebsites;
```

## Les sites hors catalogue

Une page d'un `UnsupportedWebsite` devient une lecture seulement si deux signaux indépendants de la page
s'accordent sur le chapitre, et si le titre du scan est confirmé. Une entrée fausse dans la bibliothèque coûte
plus cher qu'une lecture manquée : dans le doute, la page est ignorée, sans signalement.

- **La page parle de lecture.** Un mot de lecture (`manga`, `manhwa`, `webtoon`, `scan`, `komik`...) est un mot
  entier du titre, de l'URL ou d'un signal de la page, pluriel compris, ou il figure dans le nom d'hôte
  (`asuratoon`, `reaperscans`) : `scandal` ne parle pas de scan. Une marque d'une écriture sans espaces
  (`漫画`, `만화`, `манга`, `مانجا`) compte partout, comme un type JSON-LD de bande dessinée (`ComicSeries`).
- **La page ne parle d'aucun autre média.** Un mot d'un autre média (`anime`, `novel`, `wiki`, `podcast`...)
  compte partout dans le titre ou l'URL, même au milieu d'un mot (`kimcartoon`), et la page est ignorée. Aucun
  segment du chemin ne désigne autre chose qu'une lecture (`/course/`) : ces segments se comparent segment par
  segment.
- **Le chapitre est celui que la page affiche.** Il vient d'une `ChapterMention` du titre de l'onglet, de
  `og:title`, du `h1`, du fil d'Ariane ou d'une option sélectionnée : `Chapter 12`, `Capítulo 12`,
  `Глава 12`, `Bölüm 12`, `الفصل 12`, `第12話`, `12화`. Après un mot de chapitre vient un séparateur, un
  qualificatif (`VF`, `Online`, `Next`) ou un mot de liaison (`de`, `манги`), jamais un mot de phrase
  (`Chapter 11 bankruptcy`). Le numéro de l'URL n'est jamais lu comme chapitre : c'est souvent un index
  (`episode_no=653` pour l'épisode 235) ou un identifiant collé (`chapter-58.826511`).
- **Un second signal confirme le même numéro.** L'URL (`/chapter-12`, `/c12`, `?ep=12`, `/12/`) confirme un
  numéro affiché. Pour un texte d'en-tête (titre de l'onglet, `og:title` s'il diffère du titre, `h1`), un autre
  élément de la page confirme aussi : `h1`, fil d'Ariane, JSON-LD, option sélectionnée. Un numéro affiché par le
  seul fil d'Ariane ou la seule option doit être confirmé par l'URL. Si l'onglet annonce un autre chapitre que
  la page, le chapitre confirmé gagne.
- **Le titre est confirmé.** Dans l'ordre : le nom de série JSON-LD (`ComicSeries`, `Book`...) présent dans le
  texte qui affiche le chapitre ; sinon le texte qui entoure la mention (avant elle, ou après elle derrière `|`
  ou un mot de liaison), sans le nom du site ni le bruit (`Read`, `Lire`, `Vol. 3`, `Scan VF`), s'il figure
  dans un autre signal (URL, `h1`, fil d'Ariane, JSON-LD) ; sinon le titre de l'onglet, confirmé de même, quand
  le chapitre est affiché ailleurs. À défaut, un texte d'en-tête d'un seul tenant qui précède la mention
  (`Titre Chapter 12 - Site`) est le titre.

L'import de l'historique ne connaît que le titre et l'URL : la même règle s'applique, avec l'URL pour seul second
signal. Le content script envoie en plus les `PageSignals`, qui confirment les pages à l'URL opaque
(`/chapter/8160d350-...`). Les mots, marques, qualificatifs, mots de liaison et bruits sont des tableaux du
domaine (`page-lexicon.ts`) : un nouveau cas s'y ajoute comme une entrée, pas comme une branche. Toute
modification se mesure avec `npm run eval:parser`.

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
- une note est un entier de 1 à 10, que le lecteur peut effacer (`clearRating`, `ClearRatingUseCase`) ;
- un scan garde l'adresse de la page de sa série (`seriesUrl`) que la lecture la plus récente a lue ; une
  lecture sans cette adresse (l'import de l'historique) garde l'adresse connue si elle vient du même site,
  l'oublie sinon ;
- noter, mettre en favori ou supprimer un scan absent échoue par une erreur du domaine ;
- un scan supprimé peut revenir (`reinstate`) : il reprend sa lecture, son favori et sa note, et se fusionne
  comme au chargement si la même série a été relue entre-temps.

`DeleteScanUseCase` rend la bibliothèque et le scan retiré (`RemovedScan` : le scan, sa couverture et son
`ChapterWatch` s'ils existent). `RestoreScanUseCase` le remet en place, couverture et veille comprises : c'est
l'annulation d'une suppression. La couverture remise ne remplace pas une couverture trouvée entre-temps
(`settleCover`).

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
- Une couverture trouvée reste. Deux recherches de la même série peuvent tourner ensemble (la page lue et la
  popup) : celle qui se termine sans image ne remplace pas la couverture que l'autre a trouvée (`settleCover`).
  `CoverRepository.update()` applique ce choix à l'état enregistré, et le gateway Chrome passe les mises à jour une
  à une, pour qu'aucune ne parte d'un état déjà dépassé.
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

## Les nouveaux chapitres d'un favori

L'extension vérifie, dans le navigateur du lecteur et sans serveur, si un chapitre plus récent que le dernier lu
est paru pour chaque favori. Une fausse alerte coûte plus cher qu'une alerte manquée : **un chapitre n'est
« nouveau » que si la page lue montre un numéro strictement supérieur au dernier chapitre lu, sur le même site.**
Les numéros ne se comparent qu'entre pages d'un même site : un autre site numérote autrement.

- `ChapterWatch` (`chapter-watch.ts`) est l'état connu de la veille d'un favori, sur le site de sa dernière
  lecture : `up-to-date` (le plus haut chapitre vu, la date), `new` (le chapitre, son adresse, la date de
  la découverte), `unsupported` (la raison, la date) ou `failing` (depuis quand, le nombre d'essais, le prochain
  essai, le dernier état connu). Une série sans état n'a jamais été vérifiée. Un état d'un autre site que la
  dernière lecture ne compte pas. Toute stratégie qui trouve un chapitre trouve aussi son adresse : la ligne et
  la notification ouvrent ce chapitre, jamais le chapitre déjà lu. Un état `new` stocké sans adresse est oublié, et
  la série est vérifiée à nouveau.
- Le statut affiché (`watchStatusOf`) vaut `new` si le scan est un favori et si le chapitre trouvé dépasse le
  chapitre lu. Lire ce chapitre efface donc l'alerte sans rien écrire. Un scan qui n'est plus favori n'est plus
  vérifié ni signalé.
- `ChapterCheck` (`chapter-check.ts`) est la machine à états d'une vérification. Elle dit l'adresse à lire, le
  use-case la lit par un port, jusqu'à une issue : `answered` (le plus haut chapitre et la stratégie), `unsupported`,
  `blocked` ou `unreachable`. Les pages se lisent par expressions régulières : le service worker n'a pas de DOM.
- **Les stratégies**, dans l'ordre du registre `STRATEGIES` ; la première qui répond gagne :
  1. `feed` : le flux RSS de la série. WEBTOON publie `/rss?title_no=<n>`, WordPress (Themesia, MangaReader)
     `/category/<slug de la page de la série>/feed/`. Un élément ne compte que si son lien désigne la série
     (`title_no`, slug). Le flux d'une série Madara (`/manga/<slug>/feed/`) ne liste aucun chapitre.
  2. `series-page` : la page de la série (`seriesUrl`). Ses liens de chapitre de la même série, sous l'adresse de
     la page ou portant son slug, donnent le plus haut chapitre. La liste compte si elle a au moins 3 chapitres et
     atteint le chapitre lu ; sinon la dernière page d'une liste paginée se lit une fois. Une liste qui donne le
     même numéro à deux adresses (une nouvelle numérotation par volume) ne compte pas.
  3. `next-chapter-url` : l'adresse du chapitre lu, avec le numéro suivant. Un site qui affiche n'importe quel
     numéro (`mangakatana`, `demonicscans`...) mentirait : avant de croire une réponse positive, l'extension lit une
     fois le chapitre lu plus 4000 (`far-chapter`). Avant de croire une réponse négative, elle vérifie une fois que
     la page du chapitre lu affiche son numéro (`current-chapter`) : un site qui remplit ses pages en JavaScript ne
     l'affiche pas.
  Le lien « suivant » d'une page de chapitre ne sert pas : rempli en JavaScript ou périmé, il se trompe.
- **Ce qu'on apprend d'un site** (`HostProfile`, une entrée par site) : les leçons des stratégies (`feed`
  présent ou absent, liste de chapitres présente ou non, numéro lointain refusé ou renvoyé, chapitre lu affiché ou
  non), chacune avec sa date, valables 7 jours. Une leçon « ça marche » encore valable ne cède pas à un échec
  isolé. Le site garde aussi sa pause en cours.
- Une décimale compte (`16.2` puis `17`). Le numéro est celui que la page affiche, jamais un index d'URL
  (`episode_no` de WEBTOON).
- Hors périmètre : les sites qui ne s'affichent qu'en JavaScript (MangaDex, Weeb Central, Kakao...), les défis
  JavaScript de Cloudflare, les API tierces. L'API de MangaDex demande de passer par un proxy aux applications qui
  l'appellent depuis un navigateur : sans serveur, l'extension ne l'appelle pas. MangaUpdates et Comick suivent
  d'autres numérotations que le site du lecteur.

**La cadence** (`planChapterChecks`) :

- Une alarme réveille le service worker toutes les 30 minutes. Un favori est dû quand sa dernière vérification
  date de l'intervalle choisi (`1h`, `6h` par défaut, `24h`, dans `WatchSettings`) ; un favori `unsupported` se
  revérifie après 7 jours ; un favori `failing` réessaie après 15 minutes, puis le double, jusqu'à l'intervalle.
- Le lecteur peut arrêter la veille (`off`) : aucun favori n'est alors vérifié, et la pastille garde les
  chapitres déjà trouvés.
- Une passe vérifie 50 favoris au plus, les plus en retard d'abord. Les sites se vérifient en parallèle, mais
  une seule requête à la fois par site, à 3 secondes d'écart au moins, plus 0 à 2 secondes au hasard.
- Un site qui répond 403, 429, 503 ou une page de vérification anti-robot arrête sa file et se met en pause une
  heure, puis le double à chaque refus, jusqu'à 24 heures.
- Chaque vérification enregistre son état dès sa fin : une passe interrompue (le service worker s'arrête)
  reprend à la passe suivante, sans refaire les favoris déjà vérifiés. Relancer une passe ne refait rien qui ne
  soit dû.

**Les alertes** :

- La pastille de l'icône compte les favoris au statut `new`, avec ou sans notifications.
- Une notification n'annonce qu'un chapitre découvert par cette passe, jamais un chapitre déjà annoncé. Une
  passe qui trouve plusieurs chapitres les groupe dans une seule notification. Un clic ouvre le chapitre s'il est
  seul, sinon la bibliothèque.
- Les notifications sont une permission optionnelle, demandée quand le lecteur les active. Sans elle, la ligne
  du scan et la pastille montrent toujours les nouveaux chapitres.
- Supprimer un scan supprime son `ChapterWatch` (`DeleteScanUseCase`).
- Toute modification d'une stratégie se mesure avec `npm run eval:new-chapters` ([`testing.md`](testing.md)).

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

- **Commande** : change l'état, retourne `void`. `recordReading`, `remove`, `toggleFavorite`, `rate`,
  `clearRating`.
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
- L'écran « Request a site » affiche `VERIFIED_WEBSITES`, généré par `npm run sites:verified` dans
  `verified-websites.json`. Un site y figure si le content script lit exactement une de ses pages de chapitre
  capturées (`eval/parser/captures/*.json`) sans en lire aucune de travers, ou si c'est un site du catalogue
  dont aucune capture ne le dit mort ou redirigé. Chaque site porte la date de sa capture. La liste ne
  s'écrit pas à la main : après de nouvelles captures, relance le script et commite le fichier.
  `npm run eval:parser` signale un fichier en retard.
- Une demande d'ajout (`ProposeWebsiteUseCase`) porte l'adresse d'une page de chapitre. Si son site est déjà
  vérifié (`isVerifiedWebsite`), rien n'est envoyé et le use-case rend `already-supported` ; sinon il attend
  l'envoi et rend `sent`. Un envoi qui échoue rejette : le lecteur doit pouvoir réessayer.
- Le catalogue est typé (`readonly WebsitePattern[]`), sans `any`. Les formats d'un site forment un tableau,
  pas un objet indexé par `'1'`, `'2'`, `'3'`.
- Le catalogue garde la priorité. Une page d'un site supporté qui ne suit aucun format est signalée, jamais
  confiée à l'analyse générique. Le signalement envoie l'adresse et le titre de la page au développeur : il
  n'a lieu que si le lecteur garde les rapports (`ReportSettings`, activés par défaut, désactivables dans
  l'écran About).
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
  Pour le content script, le menu du site compte aussi : un mot de lecture dans le texte de ses liens
  (`Tous les mangas`), si aucun de ces liens ne nomme un autre média (`Novels`).
- **La page ne parle d'aucun autre média.** Un mot d'un autre média (`anime`, `novel`, `wiki`, `podcast`...)
  compte partout dans le titre ou l'URL, même au milieu d'un mot (`kimcartoon`), et la page est ignorée. Aucun
  segment du chemin ne désigne autre chose qu'une lecture (`/course/`) : ces segments se comparent segment par
  segment.
- **Le chapitre est celui que la page affiche.** Il vient d'une `ChapterMention` du titre de l'onglet, de
  `og:title`, du `h1`, du fil d'Ariane ou d'une option sélectionnée : `Chapter 12`, `Capítulo 12`,
  `Глава 12`, `Bölüm 12`, `الفصل 12`, `第12話`, `12화`. Après un mot de chapitre vient un séparateur, un
  qualificatif (`VF`, `Online`, `Next`) ou un mot de liaison (`de`, `манги`), jamais un mot de phrase
  (`Chapter 11 bankruptcy`). Un numéro seul dans un texte d'en-tête (`Scan One Piece 1196`,
  `Sonic The Hedgehog #88`) est le chapitre si l'URL porte le même numéro, si le texte n'a aucun mot de chapitre
  et si aucun mot ne le rattache à autre chose (`Page 2`, `Vol. 3`, `Saison 1`, `часть 2`) ; une option
  sélectionnée réduite à un numéro est une page de liste, pas un chapitre. Le numéro de l'URL n'est jamais lu
  comme chapitre : c'est souvent un index (`episode_no=653` pour l'épisode 235) ou un identifiant collé
  (`chapter-58.826511`).
- **Un second signal confirme le même numéro.** L'URL (`/chapter-12`, `/c12`, `?ep=12`, `/12/`) confirme un
  numéro affiché. Pour un texte d'en-tête (titre de l'onglet, `og:title` s'il diffère du titre, `h1`), un autre
  élément de la page confirme aussi : `h1`, titres de section (`h1` à `h3`), fil d'Ariane, JSON-LD, option
  sélectionnée. Un numéro affiché par le seul fil d'Ariane ou la seule option doit être confirmé par l'URL. Si
  l'onglet annonce un autre chapitre que la page, le chapitre confirmé gagne.
- **Le titre est confirmé.** Le premier candidat qui tient, dans l'ordre :
  1. le nom de série JSON-LD (`ComicSeries`, `Book`...) présent dans le texte qui affiche le chapitre ;
  2. le texte qui entoure la mention (avant elle, ou après elle derrière `|`, un mot de liaison ou le crochet qui
     la ferme : `[第287話] ワンパンマン - ＯＮＥ/村田雄介`), sans le nom du site ni le bruit (`Read`, `Lire`,
     `Vol. 3`, `Scan VF`), s'il figure dans un autre signal (URL, `h1`, titres de section, fil d'Ariane, JSON-LD) ;
  3. le titre de l'onglet, quand le chapitre est affiché ailleurs, confirmé par un texte qui dit plus que lui : un
     `og:title` ou un `h1` qui le recopie mot pour mot nomme la page, souvent le chapitre lui-même
     (`ملابس السباحة. | Team-X`) ;
  4. un seul des segments qui précèdent la mention ou qui suivent son propre segment
     (`Чёрный Клевер - Black Clover - Black Clover онлайн. Глава 393`, `第1話 / 押しかけギャルの中村さん - おりはらさちこ`), s'il figure dans un texte de la page (`h1`, titres de section, fil d'Ariane, JSON-LD,
     `og:title`) : l'URL ne confirme pas un segment, son slug ne garde souvent qu'une partie du titre
     (`cinderella-gray` pour `Uma Musume - Cinderella Gray`) ;
  5. un titre de section ou le texte d'un lien du site qui reprend exactement un segment du chemin de l'URL, hors
     du premier, sans les numéros, les identifiants (`r2311170`) ni les mots de chapitre qui l'entourent
     (`O Caçador de Destinos Rank F` pour `/comics/o-cacador-de-destinos-rank-f/capitulo/95`, `NANBA MG5` pour
     `/read/nanba-mg5/fr/16/136`) ;
  6. à défaut, un texte d'en-tête d'un seul tenant qui précède la mention (`Titre Chapter 12 - Site`).
- **Le nom du site n'est pas le titre.** Le nom du site, c'est son nom de domaine sans sous-domaine ni extension
  (`natsu` pour `natsu.one`, `zazaza` pour `a.zazaza.me`), son `og:site_name`, le début de celui-ci avant un slogan
  (`マグコミ｜マッグガーデン発のWEBマンガサイト`) ou le nom d'un nœud JSON-LD `WebSite`. Seul devant la mention, il
  reste le titre d'un site nommé d'après sa série (`One Piece - Manga Kapitel 1196` sur `onepiece.tube`).

L'import de l'historique ne connaît que le titre et l'URL : la même règle s'applique, avec l'URL pour seul second
signal. Le content script envoie en plus les `PageSignals`, qui confirment les pages à l'URL opaque
(`/chapter/8160d350-...`). Les mots, marques, qualificatifs, mots de liaison et bruits sont des tableaux du
domaine (`page-lexicon.ts`) : un nouveau cas s'y ajoute comme une entrée, pas comme une branche. Toute
modification se mesure avec `npm run eval:parser`.

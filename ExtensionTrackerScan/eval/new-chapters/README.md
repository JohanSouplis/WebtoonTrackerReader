# `eval/new-chapters/`

`npm run eval:new-chapters` rejoue `responses.json` à travers `ChapterCheck`, la vraie machine du core, sans réseau.

## Le corpus

- **`series pages`** : 113 séries réelles, une par site, capturées le 2026-10-23 (`/tmp/newch-sites`). Le chapitre
  lu est celui de la page de chapitre capturée. L'adresse de la page de la série est celle que l'extension retient
  sur cette page (`seriesPageUrlOf`) : 56 séries en ont une. Les réponses enregistrées : la page de la série (et la
  dernière page d'une liste paginée), le chapitre suivant, le chapitre lu plus 4000, le chapitre lu. Le flux n'a pas
  été capturé avec elles : ce corpus part d'un site sans flux connu.
- **`feeds`** : 76 séries des mêmes sites et 6 séries WEBTOON, capturées le même jour, le flux et la page de la
  série à la même minute (`/tmp/newch-feeds`). Chaque série donne deux cas : chapitre lu = le dernier chapitre
  moins un (un nouveau chapitre existe), puis le dernier chapitre (rien de nouveau).

## La vérité

Chaque cas dit si un chapitre plus récent que le chapitre lu existe, et d'où vient cette vérité (`truthFrom`) :

- `series` : la page de la série lue par l'analyse de l'enquête (BeautifulSoup). C'est la même famille de règle que
  la stratégie `series-page` : sur ces cas, la stratégie se mesure contre une seconde implémentation, pas contre
  une source indépendante.
- `n+1-real` : la page du chapitre suivant existe et affiche son numéro, sur un site qui refuse un numéro lointain.
- `manual` : vérifié à la main.
- `ch<=1-inferred` : chapitre lu 0 ou 1 sur une série qui continue ; vérité supposée, la plus faible.
- `feeds` : la page de la série capturée avec le flux, lue par l'analyse de l'enquête. Pour la stratégie `feed`,
  c'est une source indépendante.

Un cas `uncaptured` demande une adresse qu'aucune capture n'a enregistrée : il n'est pas noté.

## Réduire et reconstruire

`responses.json` ne garde de chaque page que ce que les règles lisent : le titre, `og:title`, le `h1`, les liens du
même site qui nomment un chapitre ou une page, les éléments d'un flux. `write-responses.ts` rejoue chaque cas sur la
page brute puis sur la page réduite, et échoue si un seul verdict change.

```bash
npm run eval:new-chapters:responses   # relit /tmp/newch-sites et /tmp/newch-feeds
npm run eval:new-chapters
```

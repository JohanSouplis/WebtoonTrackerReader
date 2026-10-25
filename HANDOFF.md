# Handoff

État au 25/10/2026, `main` à jour avec la branche `claude/pstack-install-refactor-hr78ih`.

## Ce qui est livré sur `main`

- **Méthode.** pstack (portage Claude Code `@jiroamato/pstack` 0.19.0) dans `.claude/`, standards de code dans `ExtensionTrackerScan/docs/standards/` (font autorité sur le code).
- **Architecture.** Core sans framework (use-cases, ports, gateways), front Angular en atomic design, UI « Night Reader ».
- **Reconnaissance des pages.** Catalogue + parseur générique fondé sur l'accord entre signaux de page (titre, og, h1, fil d'Ariane, JSON-LD, texte, images).
- **Identité de série.** `SeriesKey`, alias, fusion au chargement, « Renommer » et « Fusionner avec… » dans la bibliothèque.
- **Confirmation des nouvelles séries.** Sur un site non fiable, une nouvelle série attend la confirmation du lecteur. Un site devient fiable après 3 séries ajoutées sans correction ; 2 refus d'affilée l'ignorent.
- **Nouveaux chapitres.** Vérification des favoris (« Follow ») dans le navigateur, sans serveur : flux RSS, page de la série, URL N+1 calibrée. Badge, notifications optionnelles.
- **Couvertures** en miniatures locales, **demande de note** de l'extension, **diagnostics anonymes** vers Discord (résumé quotidien, erreurs dédoublonnées), **écran About**.

## Chiffres mesurés

| Mesure | Résultat |
|---|---|
| Parseur, sites déjà vus (`eval:parser`, train) | 294/316 pages faisables exactes, 0 de travers |
| Parseur, sites jamais vus (lot scellé n°3, tour 4) | 59,7 % exactes, environ 20 % des pages reconnues mal titrées |
| Ajouts automatiques de travers avec la confirmation (`eval:trust`, lot n°3) | 0 |
| Nouveaux chapitres (`eval:new-chapters`) | 98,2 % de réponses justes, 0 fausse alerte |
| Identité de série (`eval:identity`) | précision 98,1 %, rappel 48,2 % |

Conclusion de la boucle « viser 100 % » : des règles écrites à la main plafonnent sur des sites inconnus. La précision dans la bibliothèque vient de la confirmation, pas du parseur. Journal : `.scratch/run-100.tsv` (non versionné).

## Actions pour le propriétaire, avant la prochaine publication

1. **Régénérer les deux webhooks Discord.** Leurs jetons sont publics dans l'historique du dépôt et dans les versions publiées. Mettre les nouvelles adresses dans `ExtensionTrackerScan/src/app/core/gateways/discord-webhooks.ts`.
2. **Politique de confidentialité sur la fiche Chrome Web Store.** L'extension lit l'historique et envoie des diagnostics ; la fiche déclare aujourd'hui ne rien collecter.
3. Décisions déjà prises : nom du manifeste inchangé, diagnostics activés par défaut, badge conservé quand les vérifications sont sur Off, IA de Chrome non intégrée.

## Pistes suivantes

- **Nettoyage déterministe des titres** : suffixes de langue (« Solo Leveling DE »), « Online Free », « (MANGA) - RAW », « Next Chap N », « Arc Elbaf | One Piece ». Le tour 5 du parseur (branche locale `hillclimb-round5`, 63cfb73, non poussée) en contient une partie mais a deux régressions en historique : chapitre lu « 2020 » au lieu de 20 depuis l'URL, et numéro pris dans un fragment d'URL (`#/chapter-26`). Juger tout nouveau tour sur un lot scellé neuf.
- **Gemini Nano écarté** : sur 302 cartes à confirmer, trois modèles ouverts de taille comparable abîment plus de titres qu'ils n'en corrigent (au mieux 25 corrigés contre 28 abîmés).
- **Limite connue** : si le parseur prend le chapitre d'une autre série pour une série déjà suivie, la ligne avance quand même (cas vitruyen1 du lot n°2).
- Petits suivis : le filtre par titre ne cherche pas dans les alias ; la tuile d'initiales affiche « L( » pour un titre avec parenthèse.

## Données qui ne survivront pas au conteneur

Les lots scellés n°1 et n°2 sont versionnés (`eval/parser/captures/sealed-1.json`, `sealed-2.json`). Le lot n°3 (`/tmp/sealed3/`), les scripts de capture et de jugement (`/tmp/sealed*/tools/`, `/tmp/judge*/`) et la page de test Gemini Nano (`/tmp/chrome-ai/nano-eval.html`) n'existent que dans le conteneur actuel. Les branches locales `hillclimb-round3`, `hillclimb-round5` et `chrome-ai-titles` ne sont pas poussées.

## Contrôles

Depuis `ExtensionTrackerScan/` : `npx jest --maxWorkers=2`, `npm run verify:build`, `npm run verify:ui`, `npm run eval:parser`, `npm run eval:identity`, `npm run eval:new-chapters`, `npm run eval:trust -- <lots scellés>`. Dernier état vert : 764 tests Jest, 45 scénarios UI.

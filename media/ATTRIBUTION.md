# Démonstrations d’exercices

Les deux images de position utilisées par la bibliothèque proviennent du dépôt [free-exercise-db](https://github.com/yuhonas/free-exercise-db), distribué sous licence Unlicense au moment de l’intégration. Les chemins sont résolus localement sous `media/<nom>/0.jpg` et `media/<nom>/1.jpg` lorsqu’ils sont disponibles.

29 exercices disposent de photos de posture embarquées. La boucle alterne deux photos de départ et d’arrivée ; ce n’est pas une vidéo continue. La photo de fléchisseur de hanche debout précédemment référencée a été écartée, car la consigne décrit une variante à genou.

## Vidéos en boucle

11 démonstrations filmées par **Goulart**, distribuées par [wger](https://wger.de), sont embarquées sous **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**. Elles restent sous cette licence. Le fichier [video-credits.json](video-credits.json) associe chaque exercice à sa source originale et à son auteur.

Adaptations : suppression du son, réduction à 640 pixels de largeur, transcodage H.264, extraction d’une image d’affiche. Aucun mouvement généré ou interpolé. La répétition en boucle est assurée par le lecteur, avec commandes de pause. La préférence de réduction des animations désactive la lecture automatique.

Les métadonnées de licence ont été vérifiées via [l’API wger](https://wger.de/api/v2/license/) le 12 septembre 2026. Les scripts `scripts/fetch-media.cjs` et `scripts/extend-media.cjs` documentent les associations et reproduisent le téléchargement et le transcodage (Node et FFmpeg requis).

Ajouts du 13 septembre 2026, contrôlés image par image : tractions (vidéo wger 71) et extension triceps au-dessus de la tête, haltère tenu à deux mains (vidéo wger 57) ; photos de départ et d’arrivée pour le squat haltères, le squat barre, la marche du fermier, l’extension triceps, les dips sur banc et la corde à sauter.

Si un média manque ou échoue, les photos exactes du même mouvement prennent le relais, sinon les repères textuels restent accessibles. Aucune variante différente n’est montrée à la place. Les GIF et vidéos personnelles restent des URL HTTPS ; les médias distants ne sont pas garantis hors connexion.

## Polices

- **Barlow Condensed** (Jeremy Tribby) — [SIL Open Font License 1.1](https://openfontlicense.org), fichiers hébergés dans `media/fonts/`.
- **Cabinet Grotesk** (Indian Type Foundry, distribuée par [Fontshare](https://www.fontshare.com/fonts/cabinet-grotesk)) — ITF Free Font License, fichiers hébergés dans `media/fonts/`.

## Photo d’ambiance

`training-floor.jpg` provient d’Unsplash (licence Unsplash, attribution non obligatoire). L’auteur et l’adresse d’origine n’ont pas été conservés lors du téléchargement : à compléter avant publication.

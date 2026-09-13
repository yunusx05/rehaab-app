# Démonstrations d’exercices

Les deux images de position utilisées par la bibliothèque proviennent du dépôt [free-exercise-db](https://github.com/yuhonas/free-exercise-db), distribué sous licence Unlicense au moment de l’intégration. Les chemins sont résolus localement sous `media/<nom>/0.jpg` et `media/<nom>/1.jpg` lorsqu’ils sont disponibles.

23 exercices disposent de photos de posture embarquées. La boucle alterne deux photos de départ et d’arrivée ; ce n’est pas une vidéo continue. La photo de fléchisseur de hanche debout précédemment référencée a été écartée, car la consigne décrit une variante à genou.

## Vidéos en boucle

9 démonstrations filmées par **Goulart**, distribuées par [wger](https://wger.de), sont embarquées sous **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**. Elles restent sous cette licence. Le fichier [video-credits.json](video-credits.json) associe chaque exercice à sa source originale et à son auteur.

Adaptations : suppression du son, réduction à 640 pixels de largeur, transcodage H.264, extraction d’une image d’affiche. Aucun mouvement généré ou interpolé. La répétition en boucle est assurée par le lecteur, avec commandes de pause. La préférence de réduction des animations désactive la lecture automatique.

Les métadonnées de licence ont été vérifiées via [l’API wger](https://wger.de/api/v2/license/) le 12 septembre 2026. Le script `scripts/fetch-media.cjs` documente les associations et reproduit le téléchargement et le transcodage (Node et FFmpeg requis).

Si un média manque ou échoue, les repères textuels restent accessibles. Les GIF et vidéos personnelles restent des URL HTTPS ; les médias distants ne sont pas garantis hors connexion.

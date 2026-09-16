# Démonstrations d’exercices

Les deux images de position utilisées par la bibliothèque proviennent du dépôt [free-exercise-db](https://github.com/yuhonas/free-exercise-db), distribué sous licence Unlicense au moment de l’intégration. Les chemins sont résolus localement sous `media/<nom>/0.jpg` et `media/<nom>/1.jpg` lorsqu’ils sont disponibles.

Le 16 septembre 2026, 61 exercices supplémentaires ont été illustrés depuis cette même banque, avant toute génération par IA : chercher une photo réelle du bon mouvement passe désormais avant de générer une image. Les correspondances sont relues à la main dans `scripts/free-media-map.json` et reproduites par `scripts/fetch-free-media.cjs` ; `scripts/match-free-media.cjs` propose les pistes, il ne décide pas. Une entrée n’est retenue que si la banque montre exactement le même mouvement et le même matériel. Les 70 exercices écartés sont listés avec leur motif dans le même fichier, sous `_rejected` : ce sont eux, et eux seuls, qui relèvent d’une génération IA. Motifs récurrents : variante différente (prise, appui, charge), mouvement inverse, ou absence pure et simple de l’exercice dans la banque.

35 exercices disposent de photos de posture embarquées. La boucle alterne deux photos de départ et d’arrivée ; ce n’est pas une vidéo continue. La photo de fléchisseur de hanche debout précédemment référencée a été écartée, car la consigne décrit une variante à genou.

## Images uniques wger

Quatre exercices absents de free-exercise-db sont illustrés par une image wger sous **CC BY-SA 4.0**, relue une par une le 16 septembre 2026 : touches d’épaule en planche, montées de genoux, jumping jacks et hip thrust à l’haltère. Ces images ne montrent qu’une seule vue : elles s’affichent en illustration statique, pas en boucle deux positions. Leur crédit est porté par chaque entrée d’`exercise-media.js`.

Douze candidates wger ont été examinées, huit écartées : quatre montrent une femme, une est une capture d’écran de vidéo avec la barre de lecture visible, une un montage de quatre panneaux mêlant deux mouvements, deux une variante différente (kettlebell au lieu du poids du corps, machine assise au lieu de debout à l’élastique). Les motifs sont dans `scripts/free-media-map.json`, sous `_rejected_wger`. Le fond wger contient des visuels féminins : chaque image doit être ouverte avant d’être retenue, le nom de l’exercice ne suffit pas.

## Vidéos en boucle

12 démonstrations filmées par **Goulart**, distribuées par [wger](https://wger.de), sont embarquées sous **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**. Elles restent sous cette licence. Le fichier [video-credits.json](video-credits.json) associe chaque exercice à sa source originale et à son auteur.

Adaptations : suppression du son, réduction à 640 pixels de largeur, transcodage H.264, extraction d’une image d’affiche. Aucun mouvement généré ou interpolé. La répétition en boucle est assurée par le lecteur, avec commandes de pause. La préférence de réduction des animations désactive la lecture automatique.

Les métadonnées de licence ont été vérifiées via [l’API wger](https://wger.de/api/v2/license/) le 12 septembre 2026. Les scripts `scripts/fetch-media.cjs` et `scripts/extend-media.cjs` documentent les associations et reproduisent le téléchargement et le transcodage (Node et FFmpeg requis).

Ajouts du 13 septembre 2026, contrôlés image par image : tractions (vidéo wger 71) et extension triceps au-dessus de la tête, haltère tenu à deux mains (vidéo wger 57) ; soulevé de terre roumain aux haltères, vu de profil (vidéo wger 3) ; photos de départ et d’arrivée pour le squat haltères, le squat barre, la marche du fermier, l’extension triceps, les dips sur banc et la corde à sauter. Puis, avec le même contrôle : fente arrière aux haltères, vélo (facile et intervalles), rameur, étirement des fléchisseurs de hanche à genou et étirement arrière de cuisse allongé. Paires écartées car la variante diffère : pompes inclinées sur box, gainage latéral jambes tendues, Pallof press à la poulie, marche avec élastiques vers l’avant, sauts par-dessus des plots, étirement du mollet au mur.

Si un média manque ou échoue, les photos exactes du même mouvement prennent le relais, sinon les repères textuels restent accessibles. Aucune variante différente n’est montrée à la place.

## Illustrations des vignettes

Les images de `media/cards/` et les paires de `media/generated/<exercice>/` sont générées par IA le 13 septembre 2026 : les paires, leurs vignettes et les vignettes seules de `rdl`, `db-lunge`, `bike-interval` et `hip-flexor` avec Google Gemini (session d’édition d’image), les vignettes basket encore sans paire (`form-shoot`, `layup`, `pivot`, `reaction`, `pass`) avec fal.ai (modèle `google/nano-banana-2-lite`). Les invites complètes sont dans `media/cards/prompts.json`. Pour les mouvements sans vidéo ni photos réelles, la seconde position est une retouche de la première (même personne, même décor, même angle) et la démonstration alterne les deux, signalée « Illustration IA · 2 positions ». Chaque paire est relue image par image : celles qui changent d'angle ou de personne, ou qui montrent une posture incorrecte, sont écartées. Le 15 septembre 2026, les vignettes et paires des exercices basket retirés du catalogue ont été supprimées, notamment la vignette « Passes à deux » représentant une femme. Les mentions basket ci-dessus documentent leur provenance historique, non leur présence actuelle. Les médias masculins de `defense` sont conservés pour le programme d’origine. Le 15 septembre 2026, deux nouvelles paires masculines ont été ajoutées avec fal.ai (modèle `google/nano-banana-2-lite`) : bird dog et élévations frontales. La position de départ est générée, la position d’arrivée est une retouche de la première via l’endpoint d’édition, avec la même personne et le même décor. Une paire de pompes sur genoux générée ce jour-là a été écartée : les genoux ne reposaient pas sur le tapis.

Le 16 septembre 2026, huit paires masculines ont été produites avec Gemini (`gemini-3-pro-image-preview`, session d’édition d’image) : pompes sur genoux, pompes pieds surélevés, pompes prise large, pompes lentes, pompes scapulaires, pompes en V, pompes avec élastique et développé poitrine à l’élastique. La première position est générée, la seconde est une retouche de la première, avec la même personne, le même décor et le même cadrage. Chaque paire est relue et l’écart réel entre les deux poses est mesuré : les paires quasi identiques ou montrant une variante incorrecte sont écartées — pompes mains surélevées (images composées de deux panneaux), pompes prise serrée (prise large au lieu de serrée) et développé poitrine à la poulie (poulies asymétriques, câble passant devant le cou).

Les invites sont dans `media/cards/prompts.json`.

## Carte des muscles

`media/body/front.webp` et `media/body/back.webp` sont des rendus générés par IA le 13 septembre 2026 avec Google Gemini (session d’édition d’image : la vue de dos est une retouche de la vue de face, même silhouette et même éclairage). Mannequin anatomique masculin sans visage, fond retiré puis recadré sur le repère 240 × 350 de la carte ; les zones cliquables sont tracées à la main par-dessus.

## Polices

- **Barlow Condensed** (Jeremy Tribby) — [SIL Open Font License 1.1](https://openfontlicense.org), fichiers hébergés dans `media/fonts/`.
- **Cabinet Grotesk** (Indian Type Foundry, distribuée par [Fontshare](https://www.fontshare.com/fonts/cabinet-grotesk)) — ITF Free Font License, fichiers hébergés dans `media/fonts/`.

## Photo d’ambiance

`training-floor.jpg` provient d’Unsplash (licence Unsplash, attribution non obligatoire). L’auteur et l’adresse d’origine n’ont pas été conservés lors du téléchargement : à compléter avant publication.

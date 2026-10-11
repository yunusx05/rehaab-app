# Modèle 3D des scènes QI

`player.glb` est construit à partir de deux packs gratuits de Quaternius, sous licence CC0 1.0 (domaine public) :

- Universal Base Characters (Standard) : personnage `Superhero_Male_FullBody` et coupe `Hair_Buzzed` — https://quaternius.com/packs/universalbasecharacters.html
- Universal Animation Library (Standard) : animations `Idle_Loop`, `Jog_Fwd_Loop`, `Sprint_Loop`, `Walk_Loop`, `Crouch_Idle_Loop`, `Crouch_Fwd_Loop`, `Jump_Start`, `Jump_Loop`, `Jump_Land`, `Push_Loop` — https://quaternius.com/packs/universalanimationlibrary.html

Téléchargés le 11/10/2026 depuis itch.io. Modifications : cheveux rebranchés sur le squelette du personnage, pistes des doigts, d'échelle et de translation (hors bassin) retirées, textures réduites à 512 px en WebP (sans cartes normales ni rugosité), compression meshopt. Maillot et short sont générés dans l'app à partir du corps. Script de construction : `scripts/build-player-glb.mjs` (dépendances `@gltf-transform/*`, `sharp`, `meshoptimizer` à installer à part).

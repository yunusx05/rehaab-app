# Journal — reeducation-app

Entrées empilées de la plus récente à la plus ancienne.

## 2026-11-13 — Lot 38 « terrain partout » : la règle terrain → intérieur appliquée à toute séance (v94)

**Constat** : mélange revenu après le bilan du coach (son soin s'ajoute en tête et en fin, sans tenir compte du lieu) ; risque identique sur tous les chemins qui créent une séance.

**Fait** (branche `feature/lot38-coach-terrain`) :
- Point unique : `update` (personal-app) regroupe toute séance enregistrée non commencée (`BP.groupByPlace`) ; le coach regroupe aussi son résultat. Une séance commencée n'est jamais réordonnée.
- Transportable = poids du corps, élastique, miniband, disques glissants, ballon, corde, plots. Si tout le reste est transportable → « Tout sur le terrain » (Copenhagen sur banc → adduction couchée sur le côté) : jours C sans aucun aller-retour.
- Vivacité prévue le même jour qu'une séance du parcours : fusionnée dans le bloc terrain (2 exercices au plus, sans doublon avec le bloc explosivité, juste après le dernier exercice explosif), cochée « faite » par le planning (`withVivacite`), mention « incluse dans ta séance » sur l'accueil.
- Bloc dribble calé sur la durée max du dossier (10-20 min) ; avec la vivacité, il rend la place si la séance dépasse.
- Vérifié avec le dossier réel (accueil → préparer → bilan coach avec gêne hanche) : un seul passage terrain → intérieur. Tests : 3 nouveaux ; test cardio-ui mis à jour (nom du réglage, oublié au lot 37) ; suite 235 OK, 2 KO connus.

## 2026-11-13 — Lot 37 « dossier réel » : corrections tirées de l'export de l'utilisateur (v93)

**Constat** (export `../donées/rehaab-2026-11-13.json`, lu en local uniquement, jamais commité) : parcours à l'étape 2 (Force), gênes à 1/10, semaine type lun/mer/ven Muscu, mar/sam Skills, jeu Shooting, dim Repos, club mar et jeu, durée max 60 min. Les impacts étaient autorisés : le « cardio sans impact » venait du planning — le cardio n'allait que sur les jours Muscu (jambes lourdes) ou tombait sur les jours de club (pas d'impacts en plus) → vélo en doublon du club. Le mélange intérieur/extérieur restant venait du bloc skills (dribble, besoin « ballon » seulement) placé en fin de séance.

**Fait** : le cardio va aussi les jours « Skills » et « Shooting » ; chaque entraînement de club compte comme un cardio (voulu − entraînements, au moins 1) → sa semaine : navettes/sable le samedi, plus de vélo sur les jours de club ; réglage renommé « Cardio / semaine, club compris ». Bloc skills rangé « Sur le terrain » (avec soin, sprints) → un seul aller-retour. Message raccourci. Tests : cardio mis à jour + 1 nouveau ; suite 231 OK, 2 KO connus.

## 2026-11-13 — Lot 36 « Terrain d'abord » : une seule sortie par séance (v92)

**Demande** : séances qui mélangent intérieur et extérieur (soin à la maison, sprints dehors, puis retour maison) : trop compliqué ; regrouper tout l'extérieur.

**Fait** (branche `feature/lot36-interieur-exterieur`) : `BP.groupByPlace` — exercices « terrain » (besoin court/outdoor/sand/hoop) regroupés en un seul bloc en tête ; soin, bloc kiné et bloc explosivité transportables (poids du corps, élastique) suivent ce bloc dans leur ordre (genou et cheville préparés avant les sprints) ; le reste à l'intérieur. Appliqué à `sessionPlan`, `quickPlan` (Vivacité entière sur le terrain) et aux séances lancées depuis le planning (`ptCalendarPlan`, y compris remise en route). Aperçu : repères « Sur le terrain » / « À l'intérieur ». Résultat mesuré : au plus 1 passage terrain → intérieur dans toutes les séances des étapes 1 à 5. Tests : 2 nouveaux dans `joueur-actif.spec.cjs` ; suite 231 OK, 2 KO connus.

**Limite** : les séances muscu du programme à part (`personal-programs.js`) et les séances générées hors parcours ne sont pas regroupées (pas signalé par l'utilisateur).

## 2026-11-13 — Lot 35 « Planning épuré » : calendrier et plan de saison (v91)

**Fait** (branche `feature/lot35-planning-epure`) : calendrier — en-tête raccourci, jours passés sans séance regroupés en une ligne, « Je ne peux pas aujourd'hui » une seule fois pour la journée, un seul « Lancer » en vert (le premier), « Choisir le jour » en petit lien sur la même ligne que la séance. Plan de saison — « Pourquoi ce plan » replié, le doublon « Pourquoi un départ prudent » retiré de la phase, seules la phase en cours et la suivante gardent leur description (« Voir le détail de toutes les phases »). Suite : 229 OK, 2 KO connus. L'utilisateur ne veut pas épurer les autres écrans (pas ouverts tous les jours).

## 2026-11-13 — Lot 34 « Aujourd'hui épuré » (v90)

**Fait** (branche `feature/lot34-aujourdhui-epure`) : gêne ≤ 2/10 → rappel discret « Gêne légère · zones » au lieu du bandeau « séance adaptée » ; « Ma progression » sans mesure = une ligne vers le bilan (plus de toile vide), la rangée de raccourcis remonte au-dessus de la barre du bas ; badge de la séance du parcours à 45 min (un vieux check-in à 30 min ne la raccourcit plus à l'affichage, `season-plan.js`) ; cardio replié en version douce affiché « Cardio sans impact · vélo ou marche vive » (avant : « corde à sauter · sans impact », trompeur). Suite : 229 OK, 2 KO connus.

## 2026-11-13 — Lot 33 « Plan épuré » : la séance d'abord (v89)

**Demande** : écrans trop chargés ; on les reprend un par un (impeccable distill + principes minimalist-ui, palette et polices actuelles gardées). Captures de tous les écrans : `../../captures-ecrans/` (script `tests/zz-shots-all.spec.cjs`, non suivi).

**Fait** (branche `feature/lot33-plan-epure`, cache `v89-plan-epure`) : écran Plan réordonné — « Cette semaine » juste sous le titre (avancée en une ligne), seule la séance conseillée est dépliée avec le gros bouton, les autres en une ligne avec flèche ; puis critères de l'étape suivante + bilan ; puis « Tes outils » (9 tuiles compactes, texte sur une ligne) ; « Gérer le parcours » replié en bas (revenir, recommencer, changer d'étape, arrêter). Aucune fonction retirée. Suite : 229 OK, 2 KO déjà connus (date du jour).

**Suite** : écran Aujourd'hui (vérifier l'étiquette « corde à sauter · sans impact » avec une gêne à 1/10).

## 2026-11-13 — Lot 32 « joueur actif » : gêne ≠ blessure, explosivité dès l'étape 1, séances de 45 min, 3 cardios (v88)

**Demande** : programme trop protecteur et trop long (« un programme de grand blessé »), pas de sauts ni de sprints alors qu'il ne fait que ça au club ; gêne à 1/10 qui disparaît échauffé ; limites : cardio, force, vitesse, explosivité, gainage ; ventre. Il démarre à l'étape 3.

**Mesuré avant** : séances du parcours 50-59 min (hors échauffement et skills) ; avec une gêne au genou, l'étape 3 perdait TOUS ses sauts et sprints (séance devenue soin) ; un entraînement de club la veille retirait aussi les impacts.

**Fait** (branche `feature/lot32-joueur-actif`, cache `v88-joueur-actif`)
- Gêne = douleur ≤ 2/10 (`personal-engine.js` `safety` → `gene:true`) : `PlayerProfile.tolerates` garde tout. Lendemain « pire » dans les 2 derniers jours → la gêne redevient une douleur (impacts retirés). ≥ 3/10 : règles d'avant.
- Dans le parcours, un entraînement de club (veille, jour, lendemain) ne retire plus les sauts ; seul un match compte.
- Bloc explosivité (`BP.primers`) en tête des jours qui n'en avaient pas : étape 1 à 70 % (pogo, départs 10 m), puis sauts horizontaux/verticaux + départs. Règle étape 1 réécrite.
- Durée : 45 min par défaut (échauffement + finisher abdos compris, `BP.DEFAULT_MINUTES`), séries 4-5 → 3 avant de retirer un exercice. Soin limité à 2 mouvements quand tout est gêne, bloc kiné à 2 (+ alignement genou). Finisher abdos gardé les jours de soin court. Planning : séance du parcours comptée 45 min.
- Cardio : 3e séance « Navettes basket » (`court`, K4, terrain couvert), 3/semaine par défaut ; l'ancien « 2 » jamais choisi passe à 3, un 0/1/2 choisi à la main (`chosen:true`) reste. Navettes permises le même jour que la vivacité (48 h gardées entre deux jours à impacts). Gêne ≤ 2 ne rend plus le cardio « sans impact ».
- Parcours : « Aller directement à une autre étape » (`BP.jumpTo`, tests et historique gardés). Texte d'intro : étape 3 conseillée à qui joue déjà en club.
- Tests : nouveau `tests/joueur-actif.spec.cjs` (6) ; mis à jour : athletic-assessment, basket-return, cardio, cardio-ui. Suite : 229 OK, 2 KO déjà KO avant (`poids-tir:55`, `accueil:50` en 375×667 — vérifié sur la version d'avant).

**À savoir**
- Pas testé sur iPhone. Ses données sont sur son téléphone : il doit lui-même passer à l'étape 3 (Plan → Gérer le parcours) et noter ses gênes à 1/10.
- Hanche : il pense que la gêne est au moyen fessier (raideur qui bouge, soulagée par l'étirement). Conseils donnés, pas de changement d'app.

## 2026-11-11 (soir) — Démos vidéo des exercices qui n'en avaient pas (v87, branche `feature/demos-manquantes`)

**Fait**
- 98 nouvelles démos (extraits YouTube muets de 6 s) : abdos, sable, cardio, corde, planche d'équilibre, pistolet de massage, drills basket (tir, dribble, coordination, défense, intensité match), muscu classique.
- Gemini en quota (3.6/3.5) puis saturé (3.8) : choix faits à la main sur planche (2 candidates × 12 images), puis contrôle de chaque extrait découpé. Hommes uniquement : toute vidéo avec une femme, même au fond, écartée.
- Refusés après contrôle de l'extrait : vélo, balancier de jambe, pieds qui changent, curl barre, papillon lesté, split/push step (`refused` dans `yt-picks.json`).
- Tests : suite complète OK sauf `poids-tir.spec.cjs:55` (déjà KO, dépend de la date).

**Deuxième passe (même soir)** : 34 démos de plus (5 trouvées par Gemini, le reste à la main). Bug corrigé : 13 démos validées gardaient une ancienne marque « refused » d’une vidéo écartée lors d’une session précédente (elles n’apparaissaient pas). Total réel : 125 démos visibles ajoutées ce soir (90 exercices + 35 drills).

**Reste sans vidéo (24)** : vélo, développé militaire barre, soulevé sumo, extension de hanche élastique, marche gilet lesté, éversion de cheville, marche arrière, lay-ups tout terrain, étirement fessier allongé, électrostimulation bas du dos, hop step en rythme, hop step + poussée, planche inversée, planche rotations de hanches, ours / fentes / bonds latéraux dans le sable ; drills : main faible en déplacement, ligne, huit autour de deux plots, passe-attaque, arrêts, closeout et contestation, pieds qui changent. Raison principale : seules des femmes, des groupes non vérifiables ou une personne minuscule à l’écran dans les vidéos trouvées.

- Outils : `manual-scout.cjs` / `decide.cjs` / `stack.sh` dans le `scripts/manual/`.

## 2026-11-11 (suite) — Jour « Shooting » au planning + pluie limitée à la course dehors (v86, en ligne)

**Fait**
- Branche `feature/jour-shooting` fusionnée dans main et poussée ; v86 vérifiée en ligne.
- Jour « Shooting » dans le type de jour du planning (`SeasonPlan.MODES.shooting`) : ce jour-là, seule la séance de tir ; autant de séances de tir que de jours « Shooting » dans la semaine (sinon 1 placée seule). Permis même un jour de club. Accueil : « Lancer ma séance de tir ».
- Pluie : le terrain de basket est couvert. Seuls la course dehors (`outdoor`) et le sable (`sand`) sortent. Le fractionné passe en navettes sur le terrain (`court-shuttle`, nouvel exercice), ou course sur place sans « Terrain / espace ». Skills, panier, corde et séance de tir inchangés.
- Tests : 2 ajoutés (jour Shooting), test pluie réécrit. Suite complète : tout passe sauf `poids-tir.spec.cjs:55` (déjà KO, dépend de la date).

**À savoir**
- Sable supposé dehors (bloqué sous la pluie) : à retirer de `OUTDOOR` dans `personal-engine.js` si le terrain de beach-volley est couvert.
- Pas testé sur iPhone ; pas de démo vidéo pour les navettes.

## 2026-11-11 — Lot 31 « retours terrain » : boutons visibles, pluie, sable, abdos, skills / tir, recommencer, Fondations

**Fait**
- Branche `feature/lot31-retours`, cache `v84-retours-terrain`, nouveau `basket-core.js` (chargé dans index.html, précaché dans sw.js).
- Boutons visibles : en séance, le « ⋯ » devient « Arrêter » (rouge) ; menu « Terminer ici et enregistrer » (citron) / « Annuler la séance ». « Ajuster la série » et « Une douleur ? » en pastilles. Accueil : « Un imprévu aujourd’hui ? » en vrai bouton. Calendrier : « Je ne peux pas aujourd’hui » / « Choisir le jour » en pastilles. Styles dans home.css.
- Pluie : raison « Il pleut » en tête de l’imprévu → `calendar.rain` (`SeasonPlan.setRain` / `rainOn`). Moteur : `allowed()` retire outdoor / hoop / sand et les exercices d’impact sur « court ». Course → course sur place (`run-in-place`), corde à l’abri, skills sur place sans panier, séance de tir jamais un jour de pluie. Bandeau sur l’accueil avec « Il ne pleut plus ».
- Sable : matériel `sand`, 9 exercices `sand-*`, cardio `sand` (K3) en circuit par niveau ; remplace la course fractionnée quand le sable est dans le matériel ; pas de sauts à l’étape 1.
- Abdos : 12 exercices (crunch, crunch élastique, bûcheron, V-up, bascule creuse…). `BasketCore.workout` (circuit 12 ou 20 min, niveau 1 à 3 selon le nombre de séances abdos) : tuile « Abdos » sur l’accueil, « Abdos & gainage » dans le Plan. Finisher abdos (~6 min) en fin de séance du parcours (≥ 45 min) et de la muscu (≥ 40 min, pas en petite forme), jamais un jour de soin ni si la séance a déjà 2 exercices abdos.
- Skills : chaque séance commence par du dribble ; avec panier, au moins un lay-up et un tir. Blocs skills après une séance : dribble d’abord. Séance de tir 1×/semaine dès qu’un programme skills est actif, avec « Dribble d’abord » (3 exercices) avant le premier tir.
- Recommencer au jour 1 (`SeasonPlan.restart`) : dans le parcours et dans Moi. Parcours étape 1 (tests gardés), muscu semaine 1, planning sans déplacements ; profil, bilan, questionnaires, matériel et historique gardés.
- Remise en route fusionnée dans Fondations : plus de phase `reset` ; ses raisons s’affichent sur Fondations (« Pourquoi un départ prudent »). Cardio en allure facile à l’étape 1.
- Tests : nouveau `tests/retours-terrain.spec.cjs` (6). Mis à jour : accueil, interface, basket-removal, basket-return, cardio, equilibre, season-plan, skills. Suite complète : tout passe sauf `poids-tir.spec.cjs:55` (déjà KO avant, dépend de la date) ; `season-plan.spec.cjs:155` repasse.

**À savoir**
- Pas testé sur iPhone. Pas de démo vidéo pour les exercices sable et les nouveaux abdos (icône + consignes).
- Pluie : « Terrain / espace » reste permis, sauf sprints et coupes (sol mouillé).

## 2026-11-02 — Lot 29 : les exercices chargés de la vidéo hanches

**Fait**
- Demande : « je ne vois pas tous les exos de la fille, comme la marche du canard lestée ou les exos avec la kettlebell ». Vidéo revue (cleopatra.niaa, 11 exercices) : 7 étaient repris au lot 26 ; manquaient la marche du canard lestée (sac sur les épaules), le papillon avec une kettlebell sur chaque genou, le pigeon sur box et la figure 4 debout à la kettlebell, la fente genou au sol avec bascule de hanche.
- Branche `feature/hanches-kettlebell`, cache `v82-hanches-kb`. 5 exercices (catalogue 444 → 449) : `duck-walk`, `duck-walk-kb`, `butterfly-kb`, `box-pigeon-kb`, `box-figure-four-kb`. Fente genou au sol = `hip-flexor` existant.
- Bloc `hips` : Explorer + `hip-flexor` et `butterfly` ; Contrôler + `duck-walk` ; Charger = canard lesté, figure 4 et pigeon à la kettlebell, papillon lesté, cossack kettlebell, saut des genoux, Copenhague (repli sans charge si pas de kettlebell ou de banc). `duck-walk` ajouté au début des séances (`hipPrep`).
- Démos (homme, vérifiées sur planche) : marche du canard, canard lesté (goblet), pigeon chargé sur banc. Sans démo : papillon lesté, figure 4 chargée (aucune vidéo correcte trouvée).
- Tests : nouveau `tests/hanches-kettlebell.spec.cjs` (2) ; `basket-removal` compte 449. Suite complète : tout passe sauf `poids-tir.spec.cjs:55` et `season-plan.spec.cjs:155` (ce dernier échoue aussi sur la version d'avant le lot : dépend de la date du jour, à corriger).

**Prochaine action**
- Mise en ligne : `npx vercel --prod` lancé par lui dans le sous-dossier `reeducation-app`.

## 2026-11-02 — Démos des lots 26-28 (fin) : 10 extraits de plus

**Fait**
- Branche `feature/demos-26-28-b`, cache `v81-demos`. Gemini n'a validé qu'une démo (saut à genoux vers squat) avant le quota (429, toujours épuisé à 9 h 50). Les 9 autres sont choisies à la main : 2 candidates par exercice, planche de 12 images horodatées (script de repérage dans le scratchpad), puis planche finale des extraits vérifiée à l'œil. Notées `"manual": true` dans `scripts/yt-picks.json`.
- Nouvelles démos : saut à genoux vers squat, grenouille en bascule, ischios allongé (PAILs/RAILs), descente de box et réception, squat skater, Copenhague long, fente latérale landmine, planche genou tenu à l'élastique, montées de genou assis sur banc, inclinaison latérale à la poulie bras tendus.
- Tests ciblés OK (23 : version, lecteur de séance, médias, lots 26 et 27).

**Refusés (restent avec icône + consignes)**
- Femme dans la vidéo : demi-grand écart, figure 4 debout, mollet sur coussin, équilibre pied penché, mollet lourd tenu, planche inversée.
- Mauvais mouvement ou silhouette trop petite : accroupi-genoux-debout, soulevé + arcs, split step + push step, arrêt-relance sur un pied, coupe en ciseau, hop step en rythme (résultats de danse).

**Prochaine action**
- Mise en ligne : `npx vercel --prod` lancé par lui dans le sous-dossier `reeducation-app`.

## 2026-11-02 — Démos des lots 26-28 (suite)

**Fait**
- Branche `feature/demos-26-28`, cache `v80-demos`. 5 démos YouTube ajoutées (Gemini revenu, puis vérifiées à l'œil, hommes uniquement) : abduction couché jambe tendue, pigeon sur banc, fente avec élastique au genou, fente bulgare tenue, canapé genou décollé. 18 nouvelles recherches dans `scripts/yt-queries.json`.
- Tests ciblés OK (lecteur de séance, version, lots 26 et 27).

**Bloqué**
- Quota Gemini de nouveau épuisé (429) après ces 5. Restent sans démo : demi-grand écart, figure 4 debout, accroupi-genoux-debout, saut des genoux, mollet sur coussin, équilibre pied penché, mollet lourd tenu, grenouille, ischios « stretching gas », soulevé + arcs, squat skater, descente de box 3 directions, push step, arrêt-relance, coupe en ciseau, hop step, Copenhague long, fente latérale landmine, planche genou tenu, montées de genou assis, planche inversée, inclinaison poulie, pont du pied + soulevé.

**Prochaine action**
- Relancer `node scripts/fetch-yt-demos.cjs <dossier> <ids…>` un autre jour (quota), vérifier chaque extrait à l'œil, puis `node scripts/install-yt-demos.cjs`. Attendre son « push ».

## 2026-11-01 — Lot 28 : skills Danny Cooper, consignes Daryl McCoy, circuit à l'appel

**Fait**
- Branche `feature/skills-cooper-mccoy`, cache `v79-skills`. Drills 120 → 130 (`basket-skills.js`).
- 8 drills Danny Cooper, tirés de 4 séances (transcriptions lues) : entre les jambes avec transfert de poids sur place, haut-bas, crossover + arrêt net sur la jambe intérieure (« Luka », pied qui pivote au sol au lieu de sautiller), float pieds ancrés + un dribble et tir, float + décalage + deux dribbles et tir en fade, sonder puis couper le dribble (arrêt un-deux, « Brunson »), arrêt un-deux et trois step-through, pieds qui changent puis une des trois options. Chacun crédité « Vu chez Danny Cooper » avec la minute (`scripts/drill-sources-manual.json` → `drill-sources.js`).
- Daryl McCoy : pas de drill copié (ce sont des corrections en 1 contre 1). Ses consignes ajoutées aux drills existants : changer de rythme quand le défenseur se relâche, « float » seulement avec l'avantage, le jab ouvre les hanches, in-and-out pour faire ouvrir la hanche, spin quand il colle, premier dribble devant soi, en défense se caler sur la hanche intérieure.
- Circuit à l'appel (`mv-call-circuit`) : pendant le chrono, la voix du coach annonce un move au hasard toutes les 2 à 4 secondes (crossover, in-and-out, entre les jambes, reset, attaque, recule, hesi, dans le dos). Lecteur de séance : champ `calls` transmis au chrono de travail (`live-session.jsx`), calendrier fixe par chrono, rien dans les 2 dernières secondes. Respecte le bouton « couper la voix ».
- Coordination (reliquat du lot 27) : `co-hop-step`, hop step en dribblant.
- « Vu chez GBG Hoops » ajouté sur les 8 exercices GBG du lot 27 qui ont une minute précise.
- Tests : nouveau `tests/skills-cooper.spec.cjs` (3, dont la voix réellement captée pendant le circuit). Suite complète : 212 OK, 9 ignorés, 1 KO (`poids-tir.spec.cjs:55`, déjà KO avant).

**À savoir**
- Pas de nouvelles démos vidéo pour ces drills : d'après les transcriptions (« Jess », « elle »), plusieurs séances de Danny Cooper font travailler des joueuses ; images non vérifiées, donc rien n'est découpé (règle hommes uniquement). Le lien « Vu chez » pointe vers la vidéo, il n'est pas lu dans l'app.
- Non fait : environ 20 shorts Daryl de plus (verdict déjà clair : consignes, pas drills) ; séance « Stop on a dime » (27 min, transcription échouée) et séance main faible (non lue, les 8 drills suffisaient pour ce lot).

## 2026-11-01 — Lot 27 : renfo basket GBG Hoops (tout le corps)

**Fait**
- Branche `feature/renfo-gbg`, cache `v78-renfo-gbg`. Sources : vidéos GBG Hoops (échauffement pieds nus, saison, après-match, mobilité, haut du corps), consignes MyObjectiv.
- 27 exercices (catalogue 417 → 444) : bascule sur les orteils, genou au-delà des orteils, mini-rebonds genou verrouillé, fente pied arrière surélevé tenue, mollet lourd tenu, fente bulgare tenue, canapé genou décollé, grenouille, ischios « stretching gas », soulevé une jambe + arcs, squat skater genou devant, descente de box en 3 directions, split step + push step, arrêt-relance sur un pied, coupe en ciseau, hop step (seul et avec haltères), Copenhague levier long, fente latérale landmine, planche genou tenu, montées de genou assis, planche inversée, inclinaison latérale lente, et 4 exercices haut du corps GBG (rowing en position de pompe, développé un bras, poussée de hanches à genoux + développé, rowing alterné penché sur une jambe).
- Remplacés (même id) : `hip-flexor` en version active, `pigeon` avec cercles, `iso-split` à la façon GBG (genou arrière à 5 cm, fesse serrée).
- Fusionnés au lieu de doublons : « box-ankle-pogo » = `credit-card-hop` ; « wall-split-iso », « split-iso-calf » et « kneel-hover-iso » = `iso-split` amélioré + `heavy-calf-iso`. « push-step-low » = consigne de `split-push-step`. Non faits : « walkout-sl-rdl » (mouvement pas assez clair dans la vidéo).
- Routines : nouvel échauffement « Pieds nus · chevilles et genoux » (10 min) ; avant-match avec 2 isométriques de 35 s (affiché 20 min au lieu de 18, durée réelle) ; nouveau retour au calme « Après match · isométriques » (12 min). Réservoirs enrichis (hop step, push step, genou au-delà des orteils, canapé décollé, grenouille, mini-rebonds). Rappel « les étirements tenus seuls ne préviennent pas les blessures » ; avant jambes : poussée isométrique de 10 s avant la première série lourde.
- Parcours : descente de box en 3 directions avant la réception simple (étape 2 ; l’étape 1 garde sa règle « pas d’autre saut que réception et rebonds »), arrêt-relance sur un pied (étape 3, aussi pour les arrières), push step (étape 4), Copenhague long (étapes 3-4), sprint en côte en option (étape 4). Haut du corps : versions GBG en étape 4 (pré-saison) et 5 (saison), parce qu'elles ajoutent du gainage anti-rotation ou une jambe au même effort ; les étapes 2-3 gardent le lourd classique.
- Bilan : mini-rebonds en tête de « chevilles réactives » (étape 2), squat skater et coupe en ciseau dans « freinage », mollet lourd tenu en tête des tendons du jour C, fente isométrique dans les tendons du genou à partir de l'étape 3.
- Format « 1 × 20 » dans la séance libre : une série de 20 répétitions par exercice de force, avec le conseil de prendre plus lourd si les 20 passent. Pas de hausse automatique de charge (règle de l'app). Pas mis par défaut en remise en route : ça aurait changé les doses du parcours validées.
- Démos (hommes, vérifiées à l'œil, Gemini indisponible en 503) : 8 extraits GBG (4 de l'échauffement pieds nus, 4 du haut du corps). Les autres nouveaux : icône + consignes.
- Suite complète : 209 OK, 9 ignorés, 1 KO (`poids-tir.spec.cjs:55`, déjà KO avant).
- Tests : nouveau `tests/renfo-gbg.spec.cjs` (5) ; catalogue 444 dans `basket-removal` ; `basket-return` accepte l’arrêt-relance sur un pied pour un arrière. « Après match · isométriques » garde 3 étirements tenus (règle des retours au calme).

## 2026-11-01 — Lot 26 : hanches, pieds et genou droit qui part vers l'extérieur

**Fait**
- Branche `feature/hanches-pieds`, cache `v77-hanches-pieds`. Sources : vidéo hanches (cleopatra.niaa), kiné MyObjectiv (« Pied plat ? »), GBG Hoops (fente avec élastique au genou, mollet sur coussin).
- 14 exercices (catalogue 403 → 417) : squat profond avec transfert, cercles de hanche à quatre pattes, demi-grand écart, pigeon sur banc, figure 4 debout, accroupi-genoux-debout, saut des genoux, pont du pied, soulevé une jambe en pont du pied, soulevé une jambe kettlebell, fente élastique qui tire le genou dehors, abduction couché jambe tendue, mollet une jambe sur coussin, équilibre pied penché.
- Améliorés (même id) : `airplane` devient l'avion de hanche en rotation (5 à 8 rép.), `single-calf` (gros orteil et 2e orteil), `hip-abduction` (pointe jamais vers l'extérieur), `hip-circles` (pied au-dessus d'un banc en option). La consigne « pointe neutre » prévue sur le gainage latéral et la coquille n'a pas été ajoutée : ces exercices n'ont pas de jambe qui s'écarte pointe libre.
- Quick rehab : protocoles `hips` (Explorer, Contrôler, Charger) et `foot-knee` (Réveiller, Renforcer, Rebondir), avec noms de niveaux propres (`levelNames`, `RW.levelName`). Deux tuiles en tête de Quick rehab, lancées au niveau atteint (20 min). Ajoutés aux choix « Où exactement ? », à la liste blanche du coach et à `REHAB-SOURCES.md`.
- Début de séance : réservoirs `hipPrep` et `footPrep`. Jambes = 1 hanche + 1 pied (à la place d'une mobilité et de l'activation générique) ; haut du corps = 1, en alternance. L'échauffement n'ajoute plus un mouvement déjà présent dans la séance. Activation : pont du pied, mollet sur coussin, cercles à quatre pattes, abduction couché.
- Programme général : question du bilan `kneeTrack` (« un genou part-il sur le côté ? »). Réponse côté + sens → 1 exercice d'alignement en tête (bloc kiné, +1 mouvement, 4 au plus), qui change chaque jour, avec « commence par la jambe droite, une série de plus ». Parcours, remise en route, séance du joueur et séance kiné. Quick rehab propose alors directement `foot-knee`. Hanches raides déclarées → décollés 90/90 et cercles avant l'étirement tenu.
- Démos (hommes uniquement, vérifiées à l'œil) : pont du pied et soulevé une jambe kettlebell = extraits de la vidéo du kiné (`media/videos/ig/`) ; cercles à quatre pattes et squat profond avec transfert = YouTube. Les 10 autres : icône + consignes (quota Gemini épuisé, 429).
- Hors sujet mais bloquant : un plan commencé un dimanche empilait corde + course le même jour (3 séances à l'accueil, l'écran défilait). Règle ajoutée dans `season-plan.js` : un seul cardio par jour. Test `cardio.spec.cjs` ajouté (vérifié en échec sur l'ancien code) ; `cardio-ui.spec.cjs` rendu indépendant du jour de la semaine.
- Tests : nouveau `tests/hanches-pieds.spec.cjs` (6) ; `accueil.spec.cjs` lit l'ordre de l'activation dans sa définition ; catalogue 417 dans `basket-removal`. Suite complète : 204 OK, 9 ignorés, 1 KO (`poids-tir.spec.cjs:55`, déjà KO avant). Captures 390 px vérifiées (Quick rehab, séance du parcours jour A avec genou droit).

**À savoir**
- La vidéo du kiné vise le pied plat (genou qui rentre). Pour son genou droit qui sort, la consigne est inversée : ne pas rouler sur le bord extérieur, renforcer en plus le bord du pied, l'intérieur des cuisses et le côté de la hanche. L'app ne pose pas de diagnostic.
- Il doit répondre à la nouvelle question dans son bilan (Moi → bilan physique) pour que l'alignement apparaisse dans son programme.

## 2026-10-31 — Lot 25 : l'accueil suit le calendrier (muscu au planning ≠ skills à l'accueil)

**Fait**
- Branche `fix/planning-accord` (non commitée), cache `v76-accord-planning`.
- Cause : la carte « Aujourd'hui » (`todayPlan` + `training-load.js`) et le calendrier (`season-plan.js`) décidaient chacun de leur côté. Le planning disait « Muscu complémentaire », l'accueil « Séance skills basket ».
- Maintenant, quand le calendrier prévoit aujourd'hui une séance principale (parcours, remise en route, muscu, skills) et que l'accueil est en mode séance (train/light), titre, durée et bouton suivent le calendrier (`calPrimary`, insight-components.jsx). Sécurité, match, douleur, repos : inchangés. Cardio, vivacité, tir : restent secondaires.
- Effet de bord assumé : à l'étape 1, le calendrier prévoit la « Remise en route » (sans saut, rien n'est validé dans le parcours) ; l'accueil lance donc cette séance et non plus celle du parcours.
- Tests : `accord-planning.spec.cjs` (2, vérifiés échouant sur l'ancien code) ; basket-return:213 mis à jour. Suite complète : tout passe sauf `poids-tir.spec.cjs:55` (déjà KO avant).

**Prochaine action**
- Attendre son « push ».

## 2026-10-31 — Lot 24 « programme du jour + toile » : l'accueil montre la séance du jour et la progression

**Fait**
- Branche `feature/programme-du-jour` (non commitée), cache `v75-programme-jour`.
- Le lien « Commencer le parcours Retour au jeu » est remplacé par le programme du jour : une ligne par séance prévue (nom + durée), lue dans `SeasonPlan.weekSchedule` (insight-components.jsx). Le lien cardio devient « Lancer le cardio ».
- Sous « Ma séance » : bloc toile « Ma progression » (`PTRadarBlock`, player-components.jsx) = mini toile + 7 qualités avec leur niveau (3 repères) et flèches de tendance ; sur petit écran, un résumé (« 2 points forts · 1 à travailler »). Un appui ouvre la carte joueur.
- Tuiles « Lire le jeu » et « Ma carte » retirées : il reste 4 tuiles sur une ligne (Activation, Warm-up, Étirements, Quick rehab). La tuile Quick rehab garde « Ta douleur : … » même sur petit écran.
- Tests : accueil.spec.cjs et interface.spec.cjs mis à jour. Suite complète : tout passe sauf `poids-tir.spec.cjs:55` (déjà KO avant). Vérifié sans défilement en 390 × 844 et 375 × 667 avec un jour à deux séances.

**Prochaine action**
- Attendre son « push » (commit, fusion dans `main`, push), puis `npx vercel --prod` lancé par lui (la v74 n'est pas encore en ligne : "Not authorized" côté outil).

## 2026-10-31 — Lot 23 « accueil compact » : tout tient dans l’écran, activation du bas du corps, variantes de corde

**Fait**
- Branche `feature/accueil-compact`, commit `c9d31a6`, fusionnée dans `main` (`8ca1582`) et poussée le 31/10, cache `v74-accueil`, nouveau `home.css` (chargé après `motion.css`, précaché dans `sw.js`).
- Accueil : la grande carte photo de la séance du jour est retirée. « Ma semaine » devient le bloc central (`.week-hub`) : les 7 jours en haut (un appui ouvre le calendrier), la séance du jour juste dessous en version courte (« Pourquoi ? » replié).
- Six tuiles (`PTHomeBlocks`, `rehab-components.jsx`) : Activation (lance directement), Warm-up, Étirements & récup, Quick rehab (ouvrent la route `routines/<warmup|recup|rehab>`), Lire le jeu, Ma carte (mini toile → route `card`). Les rangées horizontales Warm up / Étirements / Quick rehab ne sont plus sur l’accueil.
- `ptPlayerRows` (player-components) : calcul des 7 axes partagé entre la carte joueur et la mini toile.
- Protocole `activation` dans `RW.warmups` (14 min) : montée en température → 2 mobilités → pied/cheville → hanche → gainage latéral/adducteurs → équilibre une jambe → isométrie → petits rebonds. Majorité unilatérale, change chaque jour.
- Corde à sauter : déjà dans le matériel. Ajout de `rope-run`, `rope-lateral`, `rope-fb` (catalogue 400 → 403), dans les réservoirs d’échauffement `raise` et `feet` ; démo = positions de la corde classique (`Rope_Jumping`), pas de vidéo propre.
- Tests : `tests/accueil.spec.cjs` (4) ; mis à jour : interface, rehab-warmup, basket-removal. Suite complète : tout passe sauf `poids-tir.spec.cjs:55` (déjà KO avant).

**À savoir**
- Vérifié sans défilement en 390 × 844 et 375 × 667 (aperçu Chrome), pas sur iPhone. Les cartes qui apparaissent ponctuellement (bilan de la semaine, séance validée, douleur) peuvent encore pousser l’écran à défiler ces jours-là.

**Prochaine action**
- Mise en ligne : `npx vercel --prod` lancé par lui dans le sous-dossier `reeducation-app`, puis test sur iPhone.

## 2026-10-29 — Lot 22 « cardio régulier » : corde et course fractionnée au planning

**Fait**
- Branche `feature/cardio-regulier` (non commitée), cache `v73-cardio`. Nouveau `basket-cardio.js` : deux séances par semaine (corde à sauter, course fractionnée), placées par `season-plan.js`, lancées depuis le planning et depuis l'accueil.
- Niveau 1 à 4, qui monte après deux séances sans douleur (par sorte de séance) ; redescend d'un niveau après plus de 3 semaines sans séance.
- Sans impact (vélo par intervalles, sinon marche vive) : remise en route, douleur hanche/genou/cheville, corde absente du matériel, ou semaine sans jour compatible (club, match, jambes lourdes).
- Règles : jamais deux jours de suite à impacts (vivacité comprise), jamais avec des jambes lourdes le même jour, ni un jour de club, ni au lendemain d'un match.
- Le joueur garde la main : « Choisir le jour » (alerte puis placement forcé), « Laisser l'app choisir », réglage 0/1/2 séances dans « Ma semaine type ». `personal-engine.js` : `check.impactCleared` laisse le cardio décider des impacts (sinon la pause de plus de 10 jours bloquait corde et course).
- Tests : `tests/cardio.spec.cjs` (13) et `tests/cardio-ui.spec.cjs` (2) OK. Suite complète : 189 OK, 9 ignorés, 1 KO (`poids-tir.spec.cjs:55`, déjà KO avant le lot : vérifié avec l'ancien `season-plan.js`).

**À savoir**
- Dans une semaine pleine (3 muscu + vivacité + club + match), le cardio passe en version sans impact : c'est voulu, signalé « sans impact » dans le planning.
- Pas testé sur iPhone. Pas de démo vidéo pour corde/course (l'aperçu montre déjà une vidéo de corde du catalogue).

**Prochaine action**
- Attendre son « push » : commit, fusion dans `main`, push ; mise en ligne par `npx vercel --prod` lancé par lui dans le sous-dossier `reeducation-app`.

## 2026-10-23 — Lot 20 « design + motion » : mouvement ajouté, refonte visuelle jugée trop timide

**Fait**
- Branche `feature/design-motion` (3 commits, dernier `1949fb9`), cache `v69-design-motion` (`index.html` + `sw.js`, `motion.css` ajouté au précache).
- `motion.css` (chargé en dernier) : transitions d'écran View Transitions dans le sens de la navigation (`data-nav` sur `<html>`), pastille citron `.nav-pill` qui glisse dans `.bottom-nav` (variable `--tab`), pression scale .97/.985, barres et anneaux qui se remplissent, toast animé. Easing à rebond retiré (hook impeccable), remplacé par `--ease-glide`.
- `personal-app.jsx` : `ptTabs`, `ptTabOf()`, navigation par `document.startViewTransition` + `ReactDOM.flushSync`. `calendar-components.jsx` : date sous chaque jour de `PTWeekStrip`. `pathway-components.jsx` : `.dose-details` replie les séances sauf la conseillée. Règles ajoutées à `DESIGN.md` (section Mouvement).
- Vérifié en local (Chrome, 390 px) : la pastille glisse, la barre garde `transform:none`. Tests : 176 OK, 3 ignorés, 1 KO, `poids-tir.spec.cjs:55` (date figée 2026-10-12, `season-plan.js` non touché ; ce test échouait déjà avant le lot). Pas testé sur iPhone.
- Skill `design-scout` corrigé : seuil bloquant de 6 références vues en clair, ligne « App mobile — écrans du produit » → Refero iOS (`refero.design/apps/search?query=...`, vérifié net et gratuit), captures retenues gardées dans `bibliotheque/captures/`, ancien brief Rehaab marqué « insuffisant ».

**Impasses**
- Mobbin MCP : « paid plan required ». screensdesign : écrans internes floutés (« Unlock Pro »). Le repérage n'a donc reposé que sur une seule référence (Ladder, floutée).

**Bloqué**
- L'utilisateur trouve que c'est « la même app qu'avant » : le visuel statique n'a presque pas bougé. Il attend une vraie refonte visuelle fondée sur des références réelles.

**Prochaine action**
- Relancer `/design-scout` sur Rehaab (accueil, lecteur de séance, profil, progression) via Refero iOS, montrer au moins 6 captures à l'utilisateur et faire valider la direction avant de coder. Ne fusionner `feature/design-motion` dans `main` que s'il dit « push ».

- Choix de Yunus (31/10) : quand le parcours est la séance du jour, l'accueil lance celle du parcours, pas la « Remise en route » du calendrier.

## Lot 30 — Planche d'équilibre (02/11/2026)
- Matériel : « Planche d'équilibre » (planche ronde qui bascule), avec son icône.
- 6 exercices : équilibre deux pieds, bascules contrôlées, squat, équilibre une jambe, une jambe avec ballon, montée stabilisée.
- Quick rehab : la planche passe en premier si on l'a (entorse de cheville niveaux 1-2, genou dans l'axe niveau 1, genou qui rentre niveau 2) ; sans planche, rien ne change.
- Échauffement des pieds : 2 exercices de planche ajoutés à la rotation.
- Pas encore de vidéo de démo pour ces 6 exercices (icône + consignes).

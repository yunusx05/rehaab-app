# Journal — reeducation-app

Entrées empilées de la plus récente à la plus ancienne.

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

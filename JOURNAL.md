# Journal — reeducation-app

Entrées empilées de la plus récente à la plus ancienne.

## 2026-10-31 — Lot 23 « accueil compact » : tout tient dans l’écran, activation du bas du corps, variantes de corde

**Fait**
- Branche `feature/accueil-compact` (non commitée), cache `v74-accueil`, nouveau `home.css` (chargé après `motion.css`, précaché dans `sw.js`).
- Accueil : la grande carte photo de la séance du jour est retirée. « Ma semaine » devient le bloc central (`.week-hub`) : les 7 jours en haut (un appui ouvre le calendrier), la séance du jour juste dessous en version courte (« Pourquoi ? » replié).
- Six tuiles (`PTHomeBlocks`, `rehab-components.jsx`) : Activation (lance directement), Warm-up, Étirements & récup, Quick rehab (ouvrent la route `routines/<warmup|recup|rehab>`), Lire le jeu, Ma carte (mini toile → route `card`). Les rangées horizontales Warm up / Étirements / Quick rehab ne sont plus sur l’accueil.
- `ptPlayerRows` (player-components) : calcul des 7 axes partagé entre la carte joueur et la mini toile.
- Protocole `activation` dans `RW.warmups` (14 min) : montée en température → 2 mobilités → pied/cheville → hanche → gainage latéral/adducteurs → équilibre une jambe → isométrie → petits rebonds. Majorité unilatérale, change chaque jour.
- Corde à sauter : déjà dans le matériel. Ajout de `rope-run`, `rope-lateral`, `rope-fb` (catalogue 400 → 403), dans les réservoirs d’échauffement `raise` et `feet` ; démo = positions de la corde classique (`Rope_Jumping`), pas de vidéo propre.
- Tests : `tests/accueil.spec.cjs` (4) ; mis à jour : interface, rehab-warmup, basket-removal. Suite complète : tout passe sauf `poids-tir.spec.cjs:55` (déjà KO avant).

**À savoir**
- Vérifié sans défilement en 390 × 844 et 375 × 667 (aperçu Chrome), pas sur iPhone. Les cartes qui apparaissent ponctuellement (bilan de la semaine, séance validée, douleur) peuvent encore pousser l’écran à défiler ces jours-là.

**Prochaine action**
- Attendre son « push » : commit, fusion dans `main`, push ; mise en ligne par `npx vercel --prod` dans le sous-dossier.

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

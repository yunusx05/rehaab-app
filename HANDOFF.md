# HANDOFF — Rehaab

Document de reprise. État arrêté au 15/09/2026. Branche de travail : `codex/fixes-latest` (ne jamais committer sur `main`).

## 1. État actuel : les deux lots sont livrés

**Lot 1 — Correctif mobile.** Livré, commit `a9d7d47`, poussé.

**Lot 2 — Contenu et programmes.** Livré, commit `4258f38`, poussé (`a9d7d47..4258f38`).

Demande d'origine (verbatim) :

> « je voudrais que tu me rajoutes exercices de musculation, stabilité etc en plus de ce qui existe avec le materiel a disposition essaye de varier un maximum pour avoir une bonne base de donné d'exo de tout type pas besoin de mettre les illustrations pour l'instant et rajoute des programmes car on a que des seance mais pas possible de faire un programme le seul qu'on a c'est pour le basket qui est a part il faudrait creer plusieur programme sur plusieurs semaine avec suivit en choisissant sont object exemple shrred ou bulk ou fit ou crossfit shape ou hybride etc etc du coup on dit combien de temps de dispo le poids actuel sa serait bien aussi en fonction du poids de l'age que on indique combien de kalorie on doit manger et perdre pour atteindre l'objectif etc je te laisse completer et voir ce qui se fait deja dans les autres app »

## 2. Ce qui a été livré au lot 2

### Catalogue d'exercices — `personal-engine.js`

70 → **211 exercices**, tous sur le matériel déjà déclaré dans `equipment`, aucun nouveau média.

| Pattern | Nombre | Pattern | Nombre |
| --- | --- | --- | --- |
| push | 27 | core | 28 |
| pull | 24 | cardio | 20 |
| squat | 27 | mobility | 20 |
| hinge | 23 | jump | 7 |
| arms | 18 | basket (handle/shoot/finish/footwork/react) | 11 |
| calf | 6 | | |

Les ~70 identifiants d'origine sont conservés. Les nouveaux couvrent poussée/tirage horizontal et vertical, quadriceps, chaîne postérieure, bras, mollets, gainage anti-extension / anti-rotation / latéral, stabilité unilatérale, équilibre, mobilité, conditionnement bas et haut impact.

### `personal-programs.js` — module pur UMD

8 familles : **Shred, Bulk, Fit, Force, Conditionnement fonctionnel, Hybride, Stabilité, Mobilité**. 4/8/12 semaines, 2 à 5 séances par semaine, 15 à 60 min.

- Un créneau (`slot`) décrit une intention (`role` + `pattern`), pas un exercice : le mouvement est résolu contre le catalogue au lancement, via `PT.allowed`.
- **Mouvements repères (`anchor`) stables** sur toute la durée du programme, pour que les charges restent comparables. **Accessoires en rotation** par semaine (fenêtre de 3 candidats, index `(semaine-1+slotIndex)`).
- 4 phases : Adaptation (≤ 1/3), Développement (≤ 2/3), Consolidation, et **Allègement toutes les 4 semaines** (`week % 4 === 0`).
- Budget temps : la séance perd d'abord des séries, puis du repos (plancher 45 s), puis un accessoire, jamais en dessous de 2 mouvements.
- `compatibility()` affiche la couverture (créneaux servis / total) **avant** création, avec ses réserves.
- API : `createProgram`, `sessionPlan`, `weekPreview`, `progressOf`, `markCompleted`, `pause`, `resume`, `archive`, `validateProgram`.

### `personal-nutrition.js` — module pur UMD

- Mifflin–St Jeor avec **paramètre physiologique explicite** (`bodyTypes`), jamais inféré d'un prénom.
- Dépense au repos, dépense quotidienne (facteur d'activité), **dépense sportive comptée séparément** (5 METs nets, la part de repos étant déjà dans le quotidien) : pas de double comptage — vérifié par test.
- Objectifs : perdre / maintenir / prendre / recomposition. Plancher : la cible ne descend jamais sous 80 % de la dépense au repos.
- Incertitude affichée (± 12 %), hypothèses listées, horizon donné en **fourchette de semaines**, jamais en date.
- Garde-fous bloquants : mineur, grossesse ou allaitement déclaré, suivi médical ou TCA déclaré, IMC < 18,5 avec objectif de perte.

### Persistance — rétrocompatible

`initialState()` et `validateState()` gagnent `program`, `programArchive`, `nutrition`, `trash`. Une sauvegarde antérieure sans ces clés reste valide (test dédié). `programWeek` (1–12), les anciens historiques et `exportBundle`/`importBundle` sont préservés. Un programme corrompu est **rejeté**, pas accepté en silence.

### UI — `program-components.jsx`

Chargé dans `index.html` **après** `sport-components.jsx` et **avant** `personal-app.jsx`.

| Route | Composant | Rôle |
| --- | --- | --- |
| `program` | `PTProgramHome` | Hub : avancement, semaines, lancement, pause/reprise/archivage |
| `program-new` | `PTProgramCatalog` | Configurateur + compatibilité + aperçu semaine 1 |
| `program-legacy` | `PTProgram` (d'origine) | **Programme basket conservé verbatim**, sous « Mon programme basket. » |
| `nutrition` | `PTNutrition` | Repères caloriques, réutilise `PTWeightPlot` et `measurements` |

Le raccourci d'accueil (`ptProgramShortcut`) affiche « famille · semaine n/N », « en pause », ou l'invitation à créer.

### Progression branchée sur la séance réelle

`live-session.jsx:89` : une séance portant `programInstanceId` avance `program.completed` via `PP.markCompleted`. **Une séance libre ne touche jamais au programme**, et changer de semaine ne valide rien.

## 3. Vérifications réellement exécutées

- `npx playwright test --reporter=json` → **53 passed, 0 failed** (live-session 18, mobile 5, programmes 30).
- Absence de débordement horizontal vérifiée à **320 / 390 / 430 / 1280 px** sur les 3 nouveaux écrans.
- Revue visuelle des captures de `program`, `program-new` et `nutrition`.
- `git diff --cached --check` propre ; les 4 captures de `ui inspiration-fonction/` n'ont jamais été indexées ; aucun fichier temporaire laissé.

Un push Git n'est pas un déploiement vérifié : rien n'a été déployé.

## 4. Ce qui reste ouvert

1. **Aucun benchmark externe n'a été vérifié.** Fitbod, Hevy, Strong, Freeletics, et les références publiques Mifflin–St Jeor / NIDDK n'ont pas été consultés. Les choix de dosage viennent de conventions d'entraînement courantes, pas d'une source vérifiée en session. **Ne pas affirmer le contraire.**
2. **Les nouveaux exercices n'ont pas d'illustration** — conforme à la demande. Si des médias sont ajoutés plus tard, restaurer un test « médias » plus strict.
3. `PTProgress.muscleKeys` ne liste toujours que 7 patterns (`push, pull, squat, hinge, core, calf, arms`). Un exercice `mobility`, `cardio` ou `jump` n'apparaît pas dans « Répartition des mouvements ».
4. Le test de parcours « lancer et enregistrer une séance » vérifie le lancement, la persistance du brouillon et le rechargement, **mais ne va pas jusqu'à la saisie complète d'une série** — la validation de fin de séance reste couverte par `live-session.spec.cjs`.

## 5. Pièges à connaître

**`<summary>` n'expose pas le rôle `button`.** `getByRole('button',{name:'…'})` ne trouve pas un `<summary>` : utiliser `page.locator('summary',{hasText:'…'})`. Deux tests ont échoué sur ce point.

**Le premier rendu compile tout le JSX via Babel dans le navigateur.** Le helper `seed` des tests programmes attend `.personal-app` avec un `timeout: 20000` : sans cela, un test isolé passe mais échoue dans la suite complète.

**`sw.js` liste explicitement chaque fichier.** `CACHE` est passé à `rehaab-v14-programs` et `PRECACHE` inclut `personal-programs.js`, `personal-nutrition.js` et `program-components.jsx`. Tout nouveau fichier chargé doit y être ajouté, sinon le test hors connexion casse.

**`sport.css` est minifié par sections : lignes très longues.** Éditer par script Python en heredoc, avec `assert count(old)==1` avant remplacement et écriture UTF-8 **sans conversion de fins de ligne**. Ne pas reformater le fichier.

**Sortie Playwright illisible.** `--reporter=line` renvoie parfois une liste de « matches » au lieu du rapport. Utiliser `--reporter=json > fichier.json` puis parcourir le JSON.

**Le centre de la bounding box d'une zone musculaire tombe sur une autre zone.** Réutiliser le helper `tapMuscle`, ne jamais cliquer au centre.

**Hauteur du titre du sélecteur de muscles** : `line-height:1.05;height:2.2em` **plus** `display:flex;align-items:center`. Toute retouche doit être revérifiée aux 5 largeurs.

**Un test vérifie que le programme basket n'est pas touché** : `expect(data.programWeek).toBe(1)` dans `live-session.spec.cjs`. Ne pas faire écrire `programWeek` par un chemin de séance libre.

**Heredoc Bash de plus de ~80 lignes** échoue (`unexpected EOF`). Passer par l'outil Write pour les documents longs.

**Fichiers personnels à ne jamais indexer ni supprimer** : les 4 captures non suivies de `ui inspiration-fonction/`.

**Mémoire projet** : pour Rehaab, les visuels générés ne montrent que des hommes, jamais de femmes. Sans objet dans ce lot puisqu'aucun média n'a été produit.

## Lot 3 — Profil joueur, parcours « Retour au jeu », QI basket (25/09/2026, branche `feature/profil-joueur-qi`, non commité)

Demande : app centrée sur la préparation physique basket et le QI basket, sans technique terrain. Garder l’existant, garder les programmes séparés (liberté de ne pas les suivre), développer le programme basket en étapes pour une reprise après deux ans sans jouer.

| Fichier | Rôle |
| --- | --- |
| `player-profile.js` | Poste, profil de jeu, priorités athlétiques, tolérance aux douleurs (genou, cheville), `dailyBody`, thèmes QI par poste. |
| `basket-pathway.js` | Parcours en 5 étapes (Fondations → Force → Puissance → Vitesse → Retour au jeu), bâti sur les 3 blocs d’origine. Passage par critères (volume de séances + tests + absence de douleur), paliers de jeu à l’étape 5, séances courtes (`quick`). |
| `basket-qi.js` | 33 lectures dessinées, 9 placements, 10 fins de match (règles FIBA), 33 cartes en répétition espacée, guide pick & roll, grille d’analyse de match, question de repos. |
| `player-components.jsx`, `pathway-components.jsx`, `qi-components.jsx`, `basket.css` | Écrans. Routes : `player`, `pathway`, `pathway-test/<id>`, `qi`, `qi-run/<mode>`, `qi-cards`, `qi-pnr`, `qi-review`. |

- **Moteur** : avec un profil joueur, `allowed()` garde les mouvements qu’une zone douloureuse tolère au lieu de l’exclure en bloc. Sans profil, règle d’origine inchangée. `check.guided` (étape du parcours) laisse le parcours doser impacts et reprise ; le même contrôle s’applique pendant la séance.
- 12 exercices ajoutés (catalogue : 212). Programme basket d’origine et `fromProgram` inchangés (test de non-régression sur 144 configurations).
- Navigation : Aujourd’hui · Corps · QI · Progression · Profil. La bibliothèque est dans Corps.
- `sw.js` : cache `rehaab-v20-joueur-qi`, nouveaux fichiers ajoutés au précache.
- Vérifié : 68 tests Playwright passés (dont `tests/basket-return.spec.cjs`), aucun débordement à 320 et 390 px sur les nouveaux écrans, aucune erreur console.
- Non vérifié : aucune source externe consultée pour les repères de test (conventions d’entraînement courantes, affichées comme telles dans l’app). Rien n’a été déployé.

### Suite du lot 3 (25/09/2026)

- **QI animé** : `court` = position de départ, `anim` = images jouées avant la décision (les choix apparaissent à l'arrêt sur image), `solution` = bonne lecture rejouable après la réponse. Images définies dans l'objet `motion` de `basket-qi.js` ; transitions CSS sur `transform` (px = unités du terrain). Mouvement réduit : position finale directe.
- **QI défensif** : 5 thèmes ajoutés (porteur, pick & roll, sans ballon, repli, poste). Lectures du jour : une en attaque, une en défense, plus un placement ou une fin de match. Totaux : 46 lectures (29 animées), 12 placements, 12 fins de match, 38 cartes.
- **Modes** : « Lire en défense », « Décision rapide » (5 s, dépassement compté comme une erreur).
- **Profil joueur** : 3 profils de jeu au maximum.
- **Annulation visible** : bouton « Annuler » en haut de la séance en direct, « Annuler la séance en cours » sur l'accueil et l'aperçu, « Arrêter le parcours » (archivé dans `pathwayArchive`, reprenable), « Arrêter ce programme ». Le bloc d'accueil « Mon programme / Juste 8 minutes » est supprimé.
- « Une autre proposition » n'apparaît plus pour une séance du parcours ou une séance courte (elle la remplaçait par une séance libre).
- `sw.js` : cache `rehaab-v24-qi-anime`. **Changer la version à chaque modification de fichier précaché**, sinon l'ancienne interface reste servie.
- Vérifié : 71 tests Playwright passés.
- Tri par tolérance étendu à la **hanche / aine** (rotation, grande flexion, écart et impacts écartés ; fessiers, gainage, isométrie gardés), avec l'exercice « Serrage des adducteurs » (catalogue : 213). Les autres zones (épaule, dos, cou…) gardent l'exclusion d'origine. `sw.js` : `rehaab-v25-hanche`. 72 tests passés.

## Lot 4 — Bilan athlétique (01/10/2026)

Demande : questions sur l'état physique (explosivité, gainage, mobilité, sauts…), programme adapté aux faiblesses, partie kiné, retour en forme (premier pas du slasher, etc.).

| Fichier | Rôle |
| --- | --- |
| `athletic-profile.js` | 10 questions, 9 tests propres + 10 tests du parcours réutilisés, niveaux par qualité, asymétries, priorités (besoin × poste/profil), étape conseillée (plafond 3, 2 après plus d'un an sans jouer), créneau « point faible » par étape, bloc kiné, recopie des mesures dans le parcours. |
| `assessment-components.jsx` | Route `bilan` : ressenti → tests facultatifs → résultat et « Appliquer à mon parcours ». |

- Catalogue : 213 → **234 exercices** (premier pas, détente, réactivité, freinage, tendons, pied, mobilité).
- Illustrations (1er octobre) : 20 des 21 nouveaux exercices ont 2 positions générées (Nano Banana 2 Lite puis édition, `scripts/generate-media-lot4.cjs`, ~2,6 $ sur fal), affichées en boucle comme les autres (`media/generated/<id>`, carte = position d'arrivée, précachées, cache `rehaab-v27-illus`). Chaque paire a été contrôlée à l'œil ; 8 ont été régénérées. `foot-doming` reste sans image : le creux de la voûte ne se voit pas d'une image à l'autre. Test : `athletic-assessment.spec.cjs` vérifie fichiers et précache.
- Parcours : avec un bilan, un **bloc kiné** ouvre chaque séance (douleur, puis mobilité qui manque, puis tendons de la séance ; au moins un mouvement gardé en 30 min) et un **créneau point faible** suit les mouvements clés, sans doubler un créneau du jour. **Sans bilan, les séances sont identiques à avant** (1 890 configurations comparées) ; seul le rôle « renfort » s'appelle maintenant « kiné ».
- Séances courtes : « Premier pas » (sans départ chronométré avant l'étape 3) et « Mon bloc kiné ».
- `sw.js` : `rehaab-v26-bilan`. Vérifié : 77 tests Playwright passés, sans débordement à 320 et 390 px.
- Sources consultées : revue des tests en basket (PMC8008295), JSCR 2018 « Power testing in basketball », NBA Combine (PMC6820507). Aucune norme fiable pour un joueur de club : sauts et sprints servent de référence personnelle ; plank 60 s et pompes 20 sont des repères d'entraînement courants, affichés comme tels.
- Piège : le test `QI … décision rapide chronométrée` peut dépasser 30 s sous charge dans la suite complète ; il passe seul.

## Lot 5 — Quick Rehab et Warm Up (01/10/2026, reprise en cours)

Le dépôt contient un lot non commité pour ajouter des protocoles Quick Rehab et des échauffements basket. Les fichiers principaux sont `rehab-warmup.js` (protocoles, filtrage, progression et calcul du crédit), `rehab-components.jsx` (questionnaire et écrans) et `REHAB-SOURCES.md` (références déclarées). L’entrée et le précache hors ligne sont raccordés dans `index.html` et `sw.js` (`rehaab-v30-rehab-cta`).

- Questionnaire pour les zones répertoriées, repérage de signes d’alerte, séances filtrées par douleurs et matériel ; un relevé de douleur après une séance de rehab règle le niveau proposé la fois suivante.
- Cinq échauffements basket. Les appuis et sauts sont conservés pour l’échauffement, mais retirés si le filtre de douleur les interdit.
- Les séances Quick Rehab et Warm Up peuvent être prises en compte dans la durée d’une séance sportive du même jour. L’ajustement conserve les mouvements épinglés et garde un plancher de 10 minutes.
- Le bouton du questionnaire reste dans le flux de la page afin de ne pas masquer les références en bas de l’écran.
- Le catalogue passe à 262 exercices ; deux équipements sont ajoutés : gilet lesté et disques glissants. Le gilet n’est pas proposé pour les sauts.
- **Images lot 5 :** 45 paires complètes ont été installées dans `media/generated/`, déclarées dans `exercise-media.js` et ajoutées au précache. Les planches locales ont été relues. Le journal externe indique 4,55 $ suivis ; les appels suivants ont échoué en `403 TOP_UP`. Il reste 63 exercices sans illustration. Le budget maximum configuré dans le script est 22 € ; aucune autre génération payante n’a été lancée pendant la reprise.
- `tests/rehab-warmup.spec.cjs` couvre les règles du moteur et les parcours principaux. Des captures d’écran locales existent dans `test-results/`; elles ne constituent pas à elles seules une validation complète de la suite.
- **À faire avant livraison :** exécuter la suite Playwright complète, corriger les échecs éventuels et vérifier les nouveaux écrans à petite largeur et hors ligne. Aucun test complet n’a été lancé pendant la reprise présente. Rien n’a été déployé.
- État Git de la reprise : changements locaux sur `main`, non commités. Les quatre captures personnelles de `ui inspiration-fonction/` restent hors indexation.

## Lot 5 (01/10/2026) : Quick Rehab, Warm Up, matériel, images
- Nouveaux : `rehab-warmup.js` (protocoles, questionnaire, crédit de temps), `rehab-components.jsx` (rails, écran `#rehab`, bandeau de déduction), `REHAB-SOURCES.md`.
- Matériel : `vest` (gilet lesté) et `sliders` (disques slide). 28 exercices ajoutés (catalogue : 262).
- Déduction du temps : proposée dans l'aperçu (« Retirer X min ? »), jamais automatique. Un warm-up remplace l'échauffement intégré.
- Images : `scripts/generate-media-lot5.cjs` (génère), `scripts/media-contact-sheet.cjs` (relecture), `scripts/install-generated-media.cjs` (installe). 39 paires installées, 6 écartées car quasi identiques.
- Reste : 63 exercices sans image. Le compte fal est verrouillé (`TOP_UP`) : après recharge, relancer `node scripts/generate-media-lot5.cjs` (reprend où il s'est arrêté), puis la planche, puis l'installation. Plafond du registre : 22 € (`limit_eur`).
- Cache du service worker : `rehaab-v29-rehab`.

## Lot 6 (01/10/2026) : illustrer les 63 exercices restants
- 63 exercices générés (126 images), relus par planche de contact. **55 installés**, catalogue illustré : 254 / 262.
- 8 écartés faute d'un mouvement visible entre les deux positions, après une seconde tentative avec des poses renforcées : `band-er`, `vest-march`, `defensive-slide`, `skip-a`, `backpedal`, `hip-90-90`, `adductor-squeeze`, `wrist-iso`. Le modèle `/edit` recopie la pose de départ quand le geste est petit (isométrie, course) ; relancer tel quel ne suffira pas, il faut d'autres angles ou une autre source.
- Poses renforcées dans `scripts/exercise-poses.json` et `scripts/generate-media-lot5.cjs`. `quad-rotation` a été reformulé : « kneeling on all fours » déclenchait le filtre de contenu de fal.
- Relecture : `node scripts/media-contact-sheet.cjs <sortie.jpg> <id...>`. Le tri par SSIM entre les deux positions repère les paires quasi identiques (> 0,96 = suspect).
- Coût : 6,67 $ sur ce lot, 10,47 $ cumulés au registre (plafond 22 €).
- Cache du service worker : `rehaab-v31-media`.
- Tests : suite Playwright complète au vert (89). Le test « séance : action fixe… » échouait avant ce lot par manque de temps, pas par un bug : `test.setTimeout(90000)` et un délai de 20 s sur « Reprendre la séance ».

## Lot 7 (01/10/2026) : retrouver le matériel et le catalogue
- Signalé : « je ne vois plus la liste des exos dispo et le matériel ». Les deux existaient mais étaient devenus inatteignables.
- `pathway-components.jsx` : « Tous les exercices » n'était rendu que dans le bloc « Gérer le parcours », donc invisible tant qu'aucun parcours n'était démarré. Ajouté à l'écran d'intro, avec « Mon matériel ».
- `personal-app.jsx` : la section « Mon matériel & mes vrais paliers de charge » du Profil était un `<details>` replié ; ouverte par défaut. Les 21 équipements s'y affichent, gilet lesté et disques slide compris.
- Rappel : dans la préparation de séance, `PTEquipment` n'affiche que le matériel possédé ; le reste est derrière « Autre matériel disponible aujourd'hui ». Le gilet et les disques n'apparaissent donc en séance qu'une fois cochés dans le Profil.
- Tests : suite complète au vert (89).

## Lot 8 (01/10/2026) : visuels manquants et poids du service worker
- **Quick Rehab** : les 7 zones ont une icône de silhouette avec un point sur la zone (`ptZone` dans `personal-app.jsx`), à la place du ballon de basket pour le poignet et de l'haltère pour l'épaule. Cinq vignettes pointaient vers des exercices restés sans image (`adductor-squeeze`, `band-er`, `defensive-slide`, `skip-a`) : repointées vers des exercices illustrés.
- **Accueil QI** : un pictogramme de demi-terrain par thème (`PTQiGlyph`, 19 situations), attaque en cercles, défense en croix, déplacement en flèche accent.
- **Parcours** : une photo par étape dans `media/pathway/`, générée par `scripts/generate-pathway-media.cjs`.
- **Service worker** : `PRECACHE` ne contenait plus que des images (613 entrées, 31 Mo, toutes demandées en parallèle à l'installation). Séparé en `PRECACHE` (socle + polices + vidéos, 142 fichiers, 18,3 Mo, attendu) et `PRECACHE_MEDIA` (471 illustrations, 13 Mo, rempli par lots de 12 après l'activation, jamais attendu). `scripts/install-generated-media.cjs` écrit désormais dans `PRECACHE_MEDIA`.
- Ce préchargement massif rendait l'app lente à prendre la main et faisait échouer des tests longs par dépassement de délai. Cause corrigée plutôt que délais rallongés.
- Cache : `rehaab-v32-visuels`. Tests : 89 au vert, deux passes consécutives.

## Lot 9 (07/10/2026) : refonte « simple et guidée » — branche `feature/refonte-simple`
Demande : app trop chargée, téléphone ≠ ordi, chrono de repos introuvable, chrono général incompris, mode vocal à retirer, consignes trop complexes, mauvaises vidéos, bips de chrono, coach IA qui ajuste les séances.

- **Téléphone ≠ ordi** : le déploiement Vercel était à jour (fichiers identiques). Cause côté téléphone : app installée qui garde un ancien service worker, ou autre adresse. `index.html` vérifie une mise à jour à chaque retour au premier plan et recharge une fois (jamais pendant `#session`). Profil affiche `REHAAB_VERSION` et le cache actif ; `tests/version.spec.cjs` impose `REHAAB_VERSION` = nom du cache de `sw.js`.
- **Allègement** : supprimés programmes muscu (`personal-programs.js`, `program-components.jsx`), nutrition, progression, bibliothèque. Navigation : Aujourd'hui · Parcours · Coach · QI · Profil. L'accueil n'a plus que : douleurs actives, séance en cours, carte coach, « Ta séance du jour » (lance directement la séance du parcours), QI du jour, échauffement, soins. Les anciennes sauvegardes restent valides (`program`, `nutrition` ignorés).
- **Séance** (`live-session.jsx`, styles en fin de `basket.css`) : plus de chrono général à l'écran (seulement au bilan). En haut : « Exercice n sur N · Série a sur b » et une barre par exercice découpée en séries. Repos = écran dédié bleu (`.rest-screen`) avec −15 s / +15 s et l'exercice suivant ; jamais 0 hors EMOM. Série en répétitions : l'objectif en grand (`.live-target`) au lieu d'un chrono qui monte. Un saut de série relance le chrono d'un exercice minuté.
- **Bips** : `ptCue(type)` dans `personal-app.jsx` (start 880 Hz, tick 660 Hz à 3-2-1, end 990 puis 1320 Hz, left/right). Mode vocal supprimé (`ptSay`, `rh_voice`).
- **Consignes** : 78 exercices réécrits ; règle testée : 3 étapes max, 12 mots max par étape.
- **Coach IA** : `coach-components.jsx` + `api/coach.js` (fonction Vercel, Gemini). Variables Vercel : `GEMINI_API_KEY` (pas de code d'accès, choix de l'utilisateur), `GEMINI_MODEL` facultatif (défaut `gemini-3.6-flash`). Journal `coachLog` (60 entrées) dans l'état. Garde-fous côté client (`ptCoachGuard`) et bornes côté serveur. Hors connexion : `ptCoachLocal`.
- **Vidéos** : `scripts/fetch-yt-demos.cjs` cherche sur YouTube (`scripts/yt-queries.json`), fait vérifier chaque candidate par Gemini (bon exercice, démonstrateur masculin, instant de démonstration) puis coupe 6 s muettes dans `media/videos/yt/`. Choix notés dans `scripts/yt-picks.json` (`manual: true` pour forcer une vidéo et un instant, `refused: true` pour retirer une démo). `scripts/yt-contact-sheet.cjs` fait la planche de relecture ; `scripts/install-yt-demos.cjs` branche les démos dans `exercise-media.js` et `PRECACHE_MEDIA`.

## Lot 10 (07/10/2026) : soin intégré, « Mon jeu », muscu basket, charge commune — branche `feature/soin-muscu-basket`
Demande : l'app évitait seulement les zones douloureuses au lieu de les soigner ; écran d'erreur après le test du coach ; liste des exercices disparue ; questionnaire basket « comme pour la muscu » qui règle le programme de musculation ; tout complémentaire, sans surcharge ; exercices inspirés de gbghoops.com.

- **Crash du coach** : non reproduit (local, en ligne avec le vrai Gemini, 8 profils, réponse, refaire le bilan, rehab, mobilité). L'utilisateur testait dans un aperçu téléphone sur ordinateur : le 2e écran « Ce contenu est bloqué » vient de `X-Frame-Options: DENY` / `frame-ancestors 'none'` quand « Recharger » rechargeait la page dans l'iframe. `PTErrorBoundary` affiche désormais le message, l'écrit dans `localStorage['rh_last_error']` (message, pile, route, version) et revient à l'accueil **sans recharger**. Les entrées `coachLog` d'anciennes versions sont complétées (`ptCoachEntry`). **Si l'écran revient : lire `rh_last_error`.**
- **Bibliothèque** : `library-components.jsx` (route `library`), reprise de `PTLibrary` supprimé au lot 9, filtre « Soin d'une zone ». Entrées dans Parcours (intro et en cours) et Profil.
- **Soin intégré** (`RW.careBlock`, `RW.withCare` dans `rehab-warmup.js`) : pour chaque douleur active < 7/10 sans signe inhabituel, le protocole de la zone (endroit précisé dans le signalement > dernier protocole fait > déclencheurs ; genou sans précision = `knee-pfp`) au niveau atteint. Calmer (1-2 mouvements du niveau 1) en tête, renforcer (1-2) en fin, `pathwayRole:'soin'`, `key:true`. Branché dans `BP.sessionPlan`, `JP.dailyBody`, `PP.sessionPlan` et `ptCoachApply`. Le travail secondaire sort quand le temps manque, jamais le soin. La douleur après la séance (facultative) fait progresser le protocole via `RW.record`. Le signalement de douleur a « Où précisément ? ».
- **Coach** : décision « soin » avec douleur < 4/10 = séance allégée + soin intégré ; ≥ 4 = protocole seul. Prompt serveur : préparateur basket par poste, semaine commune, choix `target` (pathway / muscu / none) et `rehabProtocol` (liste fermée, filtrée côté serveur). Contexte : `court`, `week`, `muscu`, `care`.
- **« Mon jeu »** (`basket-profile.js`, `court-components.jsx`, route `basket-profile`, état `basketProfile`) : faiblesses/forces (3 max), ressentis après match, période, jours de club, jour de match, objectif muscu. Pèse dans `JP.priorities` (via `player.court`), donne une « Priorité terrain » au parcours quand le bilan n'en propose pas, et choisit l'accent de la muscu basket.
- **Charge commune** (`training-load.js`) : match aujourd'hui = échauffement ; lendemain de match ou objectif hebdo atteint = récupération ; veille de match, jambes chargées la veille ou club le jour même = jambes protégées (muscu sans squat/charnière/sauts, parcours sans impacts) ; parcours déjà fait = complément muscu ≤ 30 min. Conventions courantes, affichées comme telles, **aucune source vérifiée en session**.
- **Muscu** : `personal-programs.js` et `program-components.jsx` restaurés depuis `385d5df^` (sans nutrition ni ancien programme basket), routes `program`, `program-new`, `program-checkin`. Nouvelle famille **« Basket · force complémentaire »** (haut du corps, chaîne postérieure, gainage, contact, unilatéral). `todayPlan` choisit parcours ou muscu ; une douleur n'envoie plus vers un soin séparé quand un programme existe.
- **Exercices** (lot C) : +19 (catalogue 281) : `atg-split-squat`, `loaded-pigeon`, `cossack-kb`, `hip-90-90-liftoff`, `shin-box`, `band-inversion`, `band-eversion`, `sl-balance-perturb`, `star-hop-stick`, `patrick-step-up`, `bent-knee-calf`, `lateral-step-down`, `srdl-row`, `side-lying-adduction`, `reverse-walk`, `heel-walk`, `rdl-hold`, `loaded-calf-stretch`, `lateral-line-hops`. Fiches écrites pour l'app (inspiration GBG Hoops, pas de reprise de contenu). Placés dans les protocoles cheville, genou, aine, Achille, tibia, ischios.
- **Démos** : 17 trouvées par Gemini sur 19, relues sur planche : 16 installées. Sans démo : `band-eversion`, `srdl-row` (rien de validé), `reverse-walk` (refusée à la relecture : plusieurs personnes, mouvement peu lisible).
- Cache `rehaab-v44-gbg`. Tests : `care-block.spec.cjs`, `programs.spec.cjs` (restauré, sans nutrition), coach et bibliothèque ajoutés. Suite complète : 103 tests, au vert sauf des dépassements de délai isolés (tests longs qui passent seuls en ~5 s).
- Rien n'a été déployé ni poussé.

## Lot 11 (08/10/2026) : skills basket — branche `feature/soin-muscu-basket`
Demande : programme de skills basket (dribble façon Kyrie, explosivité et finition façon Rose, tir façon Curry) avec questionnaire, paliers, séances seules et blocs reliés à la muscu et au footing ; un seul écosystème.

- **Module** `basket-skills.js` (`BasketSkills`) : 4 domaines (maniement, tir, finition, appuis), 3 paliers, 17 points du questionnaire, tests de tir facultatifs (lancers /20, mi-distance /25) qui corrigent le palier du tir. 45 exercices `kind:'skill'`, hors du catalogue physique, visibles dans la bibliothèque (onglet Basket).
- **Écrans** (`skills-components.jsx`) : routes `skills` (« Mes skills. ») et `skills-quiz` (« Où en es-tu ? »). Case « J'ai un panier aujourd'hui » (`skills.hoopDate`) : sans panier, aucun exercice au panier ; avec panier, tirs et lancers francs en fin de séance.
- **Écosystème** : `SK.block` ajoute un bloc après la muscu haut du corps (maniement + tir), après le footing (finition) et après les jambes (sans sauts ni changements de direction). Rien les jours de club ou de match (`TrainingLoad.day().skills`). `todayPlan` propose une séance skills quand le physique est fait ou à éviter, jamais le jour de match. Le coach peut choisir `target:'skills'` (version légère si le corps doit récupérer).
- **Progression** : tirs notés (réussis/tentés) et ressenti en fin de séance → `SK.record` : deux « facile » ou ≥ 70 % → palier suivant ; deux « dur » ou < 35 % → palier précédent.
- **Démos** : 38 trouvées par Gemini sur 45, relues sur planche, 30 installées. Refusées à la relecture : `sk-100` (deux ballons), `sk-floater` (tir allongé au sol), `sk-rip` (montre un floater), `sk-catch-3`, `sk-catch-mid`, `sk-low-fast`, `sk-weak-finish`, `sk-pullup1` (plans de groupe, lointains ou sombres). Sans vidéo validée : `sk-weak-court`, `sk-ft`, `sk-ft-tired`, `sk-around3`, `sk-mikan-rev`, `sk-finish-feet`, `sk-jump-stop`.
- Cache `rehaab-v46-skills-videos`. Tests : `skills.spec.cjs` (9). Suite complète : 112 réussis, 3 ignorés.
- Rien n'a été déployé ni poussé.

## Lot 12 (11/10/2026) : dossier joueur + pistolet de massage — branche `feature/dossier-joueur`
Plan v3 (lots 12 → 17) : `~/.claude/plans/alors-j-ai-plusieurs-modifications-happy-ripple.md`. Règle : fin de lot testée = fusion dans `main` et push.

- **Module** `player-dossier.js` (`PlayerDossier`, pur) : 7 chapitres (gabarit, basket, pause, santé, corps, semaine, objectifs) ; essentiels = gabarit, basket, santé, objectifs. Questions conditionnelles (`when`) : relances de pause seulement si pause > 0, `kilosGained` seulement sans poids de jeu, 3 questions par zone douloureuse (où exactement → protocole `RehabWarmup.where`, côté, intensité), signes d'alerte seulement s'il y a une douleur. Réponses exclusives (« Aucune »). Les réponses d'une branche abandonnée sont retirées à l'enregistrement.
- **`apply` / `saveChapter`** écrivent dans l'existant : `profile` (âge, taille, poids, `weeklyTarget`, `experience`, `onboarded` quand les 4 essentiels sont faits), `player`, `basketProfile`, `athletic.answers` (questions `ap-*`), `symptoms` (une zone retirée est résolue, `protocol` posé), `owned`. Aucun moteur réécrit. Nouvelle clé d'état `dossier` (validée, `null` pour les anciennes sauvegardes).
- **IA** : mode `dossier` dans `api/coach.js` (système et schéma dédiés : message, 3 priorités avec « pourquoi », points d'attention, 2 à 5 questions de relance, bornés côté serveur). Les relances répondues entrent dans `PD.summary`, qui est aussi envoyé au coach du jour (`ptCoachContext.dossier`). Hors ligne : `PD.localSynthesis` (priorités des moteurs + risques : pause, poids, douleur, entorses), qui explique quand la priorité n°1 du joueur arrive plus tard.
- **Écrans** `dossier-components.jsx` : `PTDossierWelcome` (premier lancement : dossier ou « Version rapide (3 questions) » = ancien accueil), routes `dossier` (héros photo + anneau + 7 tuiles photo), `dossier-q/<chapitre>` (une question par écran, choix unique = passage automatique), `dossier-synthese`. Entrées : Profil (« Mon dossier joueur ») et carte d'invitation de l'accueil. `player`, `basket-profile` et `bilan` restent.
- **Composants image** (`visual-components.jsx`) : `PTImageTile`, `PTHeroCard` (CSS dans `basket.css`), réutilisés au lot 15. Photos : 8 Pexels, recadrées/étalonnées (sharp → WebP 960×600) dans `media/ui/dossier/`, sources dans `media/ui/SOURCES.json`, relues sur planche (hommes uniquement : silhouettes ambiguës et photos avec public écartées).
- **Pistolet de massage** (demande en cours de lot) : matériel `massagegun` (icône `gun`), 9 exercices `gun-*` (`tool:'massagegun'`, consignes : jamais sur os, rotule, tendon ou zone douloureuse), classés « faible charge » genou/cheville/hanche. Ouverture des échauffements « Avant entraînement », « Avant match » et « Avant jambes » quand il est possédé (bloc facultatif qui ajoute son temps sans raccourcir l'échauffement actif), un passage au plus par séance générée. Source : Konrad et al. 2020 (amplitude des mollets sans perte de force), `RW.sources.percussion`.
- Catalogue 290 (+9, référence de `basket-removal.spec.cjs` mise à jour). Cache `rehaab-v47-dossier`. Tests : `dossier.spec.cjs` (8) ; `mobile.spec.cjs` passe par « Version rapide ».

## Correctif (11/10/2026) : séance vidée par le coach — branche `fix/seance-vide`
- Crash « Cannot read properties of undefined (reading 'id') » sur l'accueil : le coach (décision mobilité + zones épargnées) pouvait enregistrer une séance sans exercice ; `PTThumbnail` lisait `exercises[0].id`.
- Le coach refuse une séance vide, `validateState` retire une séance vide au chargement, `PTThumbnail` tolère un exercice absent. Test dans `dossier.spec.cjs`. Cache `rehaab-v48-seance-vide`.

## Lot 13 (11/10/2026) : bibliothèque basket + médias web — branche `feature/biblio-basket`
- **Éclaireur** `scripts/scout-yt-drills.cjs` (+ `scout-channels.json`) : vidéos récentes des chaînes suivies et recherche YouTube triée par date par thème (`--topics-only`) ; Gemini regarde chaque vidéo et liste les drills montrés (catégorie, but, points clés, dosage, instant, démonstrateur homme, doublon du catalogue). Résultat : `scripts/drill-candidates.json` (≈ 60 vidéos, 18 créateurs). Le format `ytsearchdate` n'existe plus dans yt-dlp : on passe par `results?search_query=…&sp=CAI%253D`.
- **Fiches** : 63 exercices physiques (`personal-engine.js`, catalogue 353) et 51 drills (`basket-skills.js`, 96), tous avec `transfer` (« Sur le terrain »), `cues`, et pour le physique `qualities` + `load` ({knee, ankle, hip}). `PlayerProfile.load` lit `e.load` en premier, **sauf exercice à impacts = toujours high** sur genou/cheville/hanche (sécurité rattrapée par le test du bilan). `PlayerProfile.qualitiesOf(e)` accepte une fiche ou un id.
- **Matériel** : médecine-ball, box, plots, mini-bande, trap bar, landmine, slant board, traîneau (`weighted:'trapbar'|'landmine'`, unité dans `loadUnit`).
- **Skills** : domaines `defense` (posture, glissés, closeout, aide et retour, refus, box-out) et `moves` (lire le pied avant, hesi tir/crossover, jab-cross, spin, re-crossover…), 7 points de questionnaire en plus ; anciennes sauvegardes = palier 1.
- **Branchements** : `AthleticProfile.focusLists` (par étape), créneaux du parcours (trap bar, slant board, traîneau, médecine-ball, landmine en tête quand le matériel existe), quick `vivacite` (15 min, isométrique avant l'étape 2) affichée dans le hub Parcours, récup avec pistolet, famille muscu `basket` (landmine, B-stance, rotations médecine-ball ; les jambes lourdes restent au parcours).
- **« Vu chez… »** : `scripts/install-drill-sources.cjs` → `drill-sources.js` (`window.RehaabSources`, 127 fiches, 18 créateurs, lien avec l'instant exact) ; `drill-sources-manual.json` pour les fiches écrites d'après une vidéo précise. Bibliothèque : filtres « Qualité basket » et « Créateur ».
- **Médias** : toutes les images générées par IA sont retirées (`media/generated`, `media/cards`, 154 paires + 159 cartes) et remplacées par des démos YouTube (pipeline `fetch-yt-demos` → planche → `install-yt-demos`), 370 démos au total, relues sur planche (hommes uniquement) : refusées `full-court-layups`, `df-closeout-contest`, `df-box-out` (plusieurs personnes non vérifiables), anciennes `db-jump`, `rope-single`, `sk-floater-1`, `df-closeout`, `df-zigzag`, `stepjack`, `downdog`, `depth-drop` remplacées. Sans démo (icône + consignes) : `rim-touches`, `tempo-court`, `df-help-recover`, `db-jump`, et les 3 refusées. Photos du parcours (`media/pathway/1-5.webp`) : Pexels, sources dans `media/ui/SOURCES.json`. La silhouette du filtre muscles (`media/body`) reste (schéma).
- Cache `rehaab-v49-biblio`. Tests : `library-basket.spec.cjs` (8) ; références mises à jour volontairement : catalogue 353, regex du point faible (étape 4), illustrations du bilan (démo web au lieu des positions IA), questionnaire skills (`weak[id]??1`).

## Lot 14 (11/10/2026) : plan de saison, calendrier, IA architecte — branche `feature/coach-plan-calendrier`
- **`season-plan.js`** (`SeasonPlan`, pur) : `build` (remise en route 2-4 semaines si pause ≥ 12 mois, douleur active ou ≥ 5 kg au-dessus du poids de jeu ; 5 étapes ; cycles de développement de 4 semaines ; tests toutes les 4 semaines ; fourchette de retour au jeu), `weekSchedule` (jours libres du dossier, club, match, objectif hebdo, durée max), `violations`, `reschedule`, `missed`, `ics`, `review`. Règles : pas de jambes lourdes la veille/lendemain de match ni un jour de club, 48 h entre deux séances de jambes, pas de skills un jour de club, une séance physique par jour, rien avant le début du plan.
- **État** : `seasonPlan` (start, resetWeeks, resetDone, devStart, architect), `calendar` (moves, skips par semaine), `weeklyReviews`, validés par `validateState`.
- **IA** (`api/coach.js`) : `api/_knowledge.js` (principes, sources dans `COACH-SOURCES.md`), mode `plan` (architecte, `GEMINI_MODEL_PLAN` facultatif, liste fermée par créneau, identifiants hors liste rejetés par le serveur), mode `review` (debrief), coach du jour avec `season`, `trends` et `because` (2-3 « parce que »). Le choix de l'architecte passe en tête de son créneau dans `BasketPathway.sessionPlan`, toujours filtré par la sécurité.
- **Écrans** `calendar-components.jsx` : routes `calendar` (semaine, lancer, « Je ne peux pas aujourd'hui », déplacer, export .ics) et `plan` (feuille de route, pourquoi, architecte) ; `PTWeekStrip` et `PTWeekReview` sur l'accueil ; onglet « Parcours » renommé « Plan ».
- Cache `rehaab-v50-plan-calendrier`. Tests : `season-plan.spec.cjs` (7, dont 600 semaines aléatoires sans règle enfreinte). Suite complète : 136 réussis, 3 ignorés.
- **Reste** : lots 15 (interface vivante, menu moins générique), 16 (QI 3D), 17 (poids de forme, séances de tir).

## Lot 15 (11/10/2026) : interface vivante — branche `feature/interface-vivante`
- Direction conservée (charbon, lime, Barlow Condensed italique, Cabinet Grotesk) ; la photo porte désormais l'accueil, le hub et « Moi ». `DESIGN.md` : section « Système photo ».
- **Photos** : 12 Pexels dans `media/ui/hub/` (muscu, skills, tests, semaine, saison, QI, récup, tir, jeu, bibliothèque, matériel, carte), relues sur planche (deux écartées pour des personnes non vérifiables en arrière-plan), sources dans `media/ui/SOURCES.json`, précachées. Helpers `ptHub`, `ptTodayPhoto` (`visual-components.jsx`).
- **Accueil** : séance du jour en grande photo (photo selon l'action : étape du parcours, skills, muscu, récup…), deux raisons visibles et « Pourquoi cette séance » à la demande ; coach en ligne compacte (`.coach-card.is-ask`) ; QI du jour et « Ma carte joueur » en tuiles côte à côte ; bilan et bandeau de la semaine dessous.
- **Hub Plan** : `PTPlanArsenal`, 8 tuiles photo (semaine, plan de saison, muscu, skills, tests, mon jeu, exercices, matériel) à la place des listes d'icônes.
- **« Moi »** (onglet renommé) : `PTPlayerCard` (numéro de poste, nom, profil, 6 qualités en 3 niveaux tirées d'`AthleticProfile.assess`, source « test » ou « réponse », flèche si un test suivi progresse ou recule ; aucune note chiffrée inventée) puis 4 tuiles photo.
- Cache `rehaab-v51-interface`. Tests : `interface.spec.cjs` (2) ; tests mis à jour pour l'onglet « Moi » et la carte coach compacte. Suite complète : 138 réussis, 3 ignorés.

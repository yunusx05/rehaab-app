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

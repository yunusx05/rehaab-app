# Rehaab — rapport de reprise

Mis à jour le 13 septembre 2026 (deuxième session). **Refonte sportive intégrée et testée localement. Comptes Supabase non commencés. Rien n’est commité ni déployé.**

## Demandes de l’utilisateur

1. Refaire l’interface pour une app sportive, actuelle, plus dynamique et avec beaucoup moins de texte.
2. Reprendre un maximum de fonctionnalités pertinentes des images du dossier `ui inspiration-fonction`.
3. Changer la typographie, rendre les vidéos automatiques et en boucle, compléter les démonstrations manquantes.
4. Ajouter création de compte, connexion et synchronisation du profil et de la progression entre appareils.
5. **Choix confirmé : Supabase.** L’utilisateur n’a pas de projet Supabase existant pour cette app.
6. Tenir ce rapport à jour. Cette demande ne constitue pas une annulation du chantier.

## Projet

- Dossier : `C:\Users\Anton\Desktop\app test\reeducation-app\reeducation-app`. Git : `https://github.com/yunusx05/rehaab-app.git`, branche `codex/fixes-latest`.
- Application statique : React 18 UMD et Babel dans le navigateur, CSS classique. Ne pas migrer de framework.
- Entrée `index.html`. Ordre de chargement : `program-data.js`, `personal-engine.js`, `exercise-media.js`, GSAP (`vendor/`), puis en Babel `visual-components.jsx`, `sport-components.jsx`, `live-session.jsx`, `personal-app.jsx`. CSS : `personal.css`, `live-session.css`, puis `sport.css` qui surcharge.
- Démarrage : `npm start -- --listen 4173`. Tests : `npm run test:mobile` (Playwright, Chrome).

## Fait pendant cette session

### Intégration de la refonte
- `sport.css`, `sport-components.jsx` et GSAP 3.13 (local) chargés dans `index.html`. Couleur de thème alignée sur #111212 (`index.html`, `manifest.json`).
- L’accueil utilise `PTSportToday` ; l’ancien `PTToday` et `PTWeekPulse` (utilisé seulement par l’ancien accueil) sont supprimés.
- **Bug bloquant corrigé** dans `sport-components.jsx` : accolade manquante dans le gestionnaire clavier de la carte musculaire, qui empêchait Babel de compiler tout le fichier.
- Carte musculaire : les traits décoratifs du torse interceptaient les clics, ils ne captent plus le pointeur.
- Bouton rond « Choisir ma séance » de la grande carte retiré : il doublait « Trouver ma séance ».
- Vignettes sans image : fond sombre au lieu d’un bloc gris clair.

### Polices et crédits
- `media/fonts/cabinet.css` pointait vers le CDN Fontshare sans aucun fichier local. Cabinet Grotesk 400/500/700/800 est maintenant téléchargée en woff2 dans `media/fonts/` et référencée localement ; Satoshi, inutilisée, est retirée.
- `media/ATTRIBUTION.md` mis à jour : 29 exercices en photos, 11 vidéos, polices et licences, ajouts du jour.
- Les deux nouvelles vidéos ont été contrôlées image par image : `pullup` montre de vraies tractions à la barre, `overhead-triceps` une extension au-dessus de la tête haltère tenu à deux mains, conforme à la consigne du moteur.

### Vidéos et animations (points de l’audit)
- Hook commun `usePTVisibleMedia` : lecture muette, inline, en boucle ; pause hors écran et onglet masqué ; les pauses causées par le défilement ou l’onglet ne sont pas prises pour un choix de l’utilisateur ; commandes natives et bouton « Pause démo / Lire la démo » partagent un seul état (points 1 et 4).
- `PTDemo` : repli sur les photos exactes départ/arrivée du même mouvement si la vidéo échoue, message « Démonstration indisponible » avec bouton Réessayer ; message explicite s’il n’existe aucun média.
- `PTThumbnail` : le lecteur reste monté une fois vu (plus de téléchargement relancé au défilement) et suit la visibilité de l’onglet ; repli photos si la vidéo échoue (point 2).
- `PTSession` : plus d’intervalle de 250 ms. Un rendu par seconde, calé sur les limites du minuteur actif, aucun pendant la pause ou le bilan ; les timestamps restent la source de vérité ; affichage borné pour éviter un saut à la reprise (point 3).
- Préférence de réduction des animations écoutée en direct dans `PTDemo`, la bibliothèque et les apparitions GSAP (point 5).

### Bibliothèque
- Carte musculaire face/dos (`PTMuscleExplorer`) en tête, filtres rapides par type (Tous, Favoris, Force, Basket, Cardio, Pliométrie, Mobilité), recherche et filtre matériel conservés, favoris et exercices personnels intacts.

### Séance
- Commandes précédent / pause / suivant sous le chrono. « Suivant » passe une série sans la valider ; pendant le repos il termine le repos. Aucun résultat n’est enregistré sans la feuille de saisie. Règles de douleur inchangées : un mouvement non permis renvoie toujours vers les douleurs.
- Carte « Pour commencer » pendant l’échauffement, « Ensuite » avec vignette et numéro de série pendant l’exercice et le repos.
- Le bouton pause de la barre du haut a été déplacé dans ces commandes, pour éviter deux boutons portant le même nom.

### Service worker
- Version `rehaab-v10-sport` ; nouveaux CSS/JSX, GSAP, polices, photo d’ambiance, nouvelles photos et vidéos précachés ; requêtes vidéo partielles conservées.
- Seuls le même domaine et unpkg / Google Fonts sont mis en cache. Les autres domaines, dont Supabase, et les chemins `/api/` passent toujours par le réseau.

### Tests
- Tests mis à jour sans affaiblir les assertions : nouvel accueil, bouton Profil désigné exactement, carte musculaire et filtres rapides à la place des listes déroulantes.
- Nouveaux tests : parcours à 1440 px ; carte musculaire au clavier et à la souris ; lecture automatique muette, pause onglet masqué, pause manuelle respectée, pause hors écran ; précédent/suivant sans validation et chrono figé en pause ; séance active jamais remplacée depuis l’accueil ; repli photos après échec vidéo ; précache hors connexion des nouveaux fichiers.
- **Résultat : 15 tests sur 15 réussis** (`npx playwright test`).

### Vérification visuelle
- Captures inspectées : accueil 320 / 390 / 1440, bibliothèque 320 / 390, aperçu de séance, échauffement et exercice en séance.
- Défilement réel : toutes les sections animées au scroll finissent visibles. Dans les captures pleine page, le bas de l’accueil peut paraître vide car ScrollTrigger n’y reçoit pas de défilement : c’est un artefact de capture.

## Reste à faire

1. **Comptes et synchronisation Supabase : rien d’implémenté.** Voir l’architecture ci-dessous.
2. Crédit de `media/training-floor.jpg` : photo Unsplash dont l’auteur et l’URL n’ont pas été conservés. Retrouver la source ou remplacer l’image avant publication.
3. Premier affichage lent (3 à 6 s mesurés en local) : Babel compile les JSX dans le navigateur. Existait avant la refonte ; précompiler serait le vrai correctif, mais sort du périmètre « pas de migration ».
4. CSS devenus inutiles et sans effet : `.hero-card`, `.week-pulse`, `.hero-settings`. Nettoyage possible.
5. Validation par l’utilisateur sur un vrai téléphone : autoplay iOS, sons, verrouillage de l’écran.
6. Commit, push et déploiement : non faits, à la demande de l’utilisateur.

## Comptes et synchronisation Supabase — à implémenter

- Connexion et création de compte par e-mail/mot de passe, confirmation e-mail et récupération du mot de passe.
- Profil en ligne contenant l’état métier complet : profil, séances, brouillon, progression programme, favoris, événements, mesures, préférences, exercices personnels.
- Table privée avec clé `user_id`, RLS fondée sur `auth.uid()` et aucune clé service-role dans le navigateur.
- Synchronisation versionnée avec contrôle de concurrence pour éviter qu’un ancien appareil écrase une progression plus récente.
- Stockage local isolé par identifiant utilisateur ; aucune fuite du suivi entre deux comptes sur le même appareil.
- Préserver/importer explicitement le suivi invité au premier compte. Sauvegarder avant toute résolution de conflit.
- Sauvegarde locale hors connexion, envoi à la reconnexion, état visible (synchronisé, hors ligne, conflit, erreur).
- Fichier SQL et instructions reproductibles ; configuration publique URL Supabase + clé publishable/anon, idéalement fournie par un endpoint Vercel `/api/` (déjà exclu du cache du service worker).
- Sans projet Supabase provisionné et configuré, **ne pas prétendre que la synchronisation multiappareil est opérationnelle**.

## Points d’attention

- Les nouvelles cartes ne remplacent jamais un brouillon actif (vérifié par test).
- Ne pas changer le programme, le dosage des exercices ni les règles de douleur. Aucun de ces éléments n’a été modifié.
- Les chiffres de progression restent dérivés des résultats réels ; aucune calorie, récupération ou record inventé.
- La suppression de `ui inspiration-fonction/2026-09-12 20_35_01-Greenshot.png` n’a pas été faite par l’agent : ne pas la restaurer ni l’attribuer à la refonte sans instruction.
- Aucun commit ni push. Les nouveaux fichiers (`sport.css`, `sport-components.jsx`, `vendor/`, `media/fonts/`, nouveaux médias, `DESIGN.md`, ce rapport) restent non suivis par Git.

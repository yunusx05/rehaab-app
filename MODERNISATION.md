# Rehaab — dynamiser l’existant

Mise à jour du 12 septembre 2026. Les programmes, les données locales, les favoris, les exercices personnels et le suivi des douleurs restent en place.

## Les quatre évolutions

- **Visuel d’abord** : démonstration en tête des cartes de proposition, aperçus animés uniquement lorsqu’ils sont visibles dans le catalogue, 23 mouvements illustrés dont 9 vidéos filmées locales en boucle. Séries, répétitions, repos et charge sont présentés par chiffres et icônes. Les détails de posture restent à portée de main. Pause, deux positions consultables manuellement et réduction des animations sont pris en charge.
- **Bibliothèque** : onglet permanent « Exercices », grille visuelle, recherche sans distinction d’accents, filtres combinables par muscle, matériel et famille, favoris et remise à zéro. Les filtres musculaires servent à explorer ; les contraintes de douleur continuent d’utiliser les zones et articulations du moteur existant.
- **Séance en direct** : bouton fixe « Démarrer la séance », interface dédiée sans barre de navigation, vidéo dominante, étape « Exercice 1/5 », grand chrono central. Une commande fixe passe de « Échauffement effectué » à « Terminé », puis « Passer à l’exercice… ». Un panneau de saisie court conserve la validation explicite des résultats. La pause suspend les chronos de séance, d’étape et de bloc ; la saisie du bilan ne gonfle plus la durée. Les circuits/supersets suivent l’ordre existant, le HIIT compte le temps de travail, l’AMRAP affiche le temps du bloc, et le repos EMOM tient compte du temps déjà écoulé dans la minute. Les transitions et résultats restent confirmés par l’utilisateur.
- **Progression motivante** : calendrier réel de la semaine, défi lié à l’objectif du profil, 50 points par séance enregistrée (partielle comprise), badges à 1, 5 et 10 séances. Le ressenti se choisit de 1 à 10 ; un effort ≥ 8 déclaré récemment allège les propositions pendant la fenêtre existante de deux jours. Une note facile ne déclenche pas de hausse automatique de charge.

## Inspirations et choix retenus

Les captures du dossier `ui inspiration-fonction` ont guidé les vignettes, les cercles de progression et les commandes de séance, en gardant les couleurs, la typographie et la navigation de Rehaab.

- [Hevy — suivi des séances](https://www.hevyapp.com/features/track-workouts/) : séries validées, repos automatique, bibliothèque accessible. Ces interactions sont rendues visibles dans le moteur existant.
- [Fitbod — personnalisation](https://fitbod.me/blog/fitbod-algorithm/) : tenir compte des retours et de la récupération. Ici, cela reste une règle explicite sur le ressenti récent et les données déjà saisies ; aucun score physiologique n’est inventé.
- [Strava — défis](https://support.strava.com/en-us/articles/15401916-strava-challenges) : objectifs mesurables et motivation partagée. Ici, défi hebdomadaire personnel et bouton pour copier un bilan destiné aux amis. Aucun classement ou ami fictif, aucun envoi automatique.

Pages officielles consultées le 12 septembre 2026 ; sélection d’idées produit, pas classement de popularité.

## Données et médias

Les récompenses sont dérivées des identifiants des séances : revoir un bilan ou recharger ne redonne pas de points. Elles suivent les corrections/retraits/restaurations de l’historique. Tout reste local et inclus dans les exports existants. Un défi synchronisé entre plusieurs comptes nécessiterait un service partagé ; le partage actuel est une copie de texte volontaire.

Les médias locaux sont précachés par le service worker pour les visites suivantes, avec gestion des requêtes partielles du lecteur vidéo. Les crédits et licences sont dans [media/ATTRIBUTION.md](media/ATTRIBUTION.md). Les exercices sans démonstration vérifiée affichent une icône et leurs repères, sans substituer la vidéo d’un autre mouvement.

Lancement : `npm start -- --listen 4173`. Vérification : `npm run test:mobile`.

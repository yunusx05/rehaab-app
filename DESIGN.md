# Rehaab — direction sportive

## Atmosphère
Application de training, dense et visuelle. Charbon neutre, photographie sportive, titres condensés inclinés. Les références du dossier `ui inspiration-fonction` priment sur les recettes de landing page : pas de longs chapitres marketing, pas de statistiques inventées, pas de défilement bloqué.

## Palette
- Canvas #111212, surfaces #1b1d1c, relief #272a28.
- Texte #f6f7f2, secondaire #a9afaa, séparateurs #ffffff0d.
- Accent lime #c3e65a : actions, sélection, progression. Danger réservé aux erreurs réelles.

## Typographie
- Barlow Condensed 700/800 italic : titres sportifs, 2 lignes maximum sur l'accueil.
- Cabinet Grotesk 400/500/700 : interface et formulaires.
- Chiffres tabulaires pour chronos et résultats.
- Titres fluides avec clamp ; contrôles et texte courant 14–16 px.

## Composants et interactions
Grande carte de séance photographique, rail de séances, calendrier sélectionnable, reprise avec progression réelle, filtres rapides et carte musculaire face/dos. Démonstrations visibles dans le programme, repos et exercice suivant pendant la séance. Consignes détaillées à la demande.
Boutons d'au moins 44 px, focus visible, pression scale(.98), retour immédiat. Nav flottante ; panneau de saisie natif dialog. Aucun bouton factice.

## Layout
Mobile en premier, grille dense. Deux petites colonnes réservées aux contrôles et mesures ; cartes de contenu en une colonne sur petit écran. Bureau : 1080 px maximum. Aucune zone vide dans les grilles. Photos de posture affichées entièrement ; photos d'ambiance recadrables.

## Mouvement
Courbe cubic-bezier(.23,1,.32,1), pression 140 ms, entrées 240 ms, cascade 40 ms. GSAP ScrollTrigger pour les apparitions du contenu uniquement. Nettoyage au démontage. Aucun mouvement imposé pendant les entrées clavier. Respect de prefers-reduced-motion.
Lecteurs muets, playsInline, autoplay, loop ; pause hors écran et onglet masqué. Échec : repli vers les positions exactes disponibles, sinon consignes explicites. Ne jamais substituer une variante différente à une démonstration manquante.

## Vérification
Parcours à 320/390/1440 px, lecture réelle des vidéos, pause/reprise, séries et historique persistés, filtres musculaires clavier, création de séance sans perdre un brouillon actif, erreurs médias, mode hors connexion. Les nouveaux comptes doivent restaurer les données réelles, isoler les utilisateurs et refuser les conflits de synchronisation.

/* Existing personal programme: preserved verbatim as source data, not medical clearance. */
(function (root) {
'use strict';
const PHASE1={
  A:{title:'Séance A',sub:'Chaîne postérieure & Poussée',duration:'~42 min',supersets:[
    {name:'Superset 1',rest:90,exercises:[
      {id:'p1a1',name:'Soulevé de terre (haltères/EZ)',volume:'4 x 10',tempo:'3-1-1',hasWeight:true,desc:'Dos plat, pousse les fesses en arrière. Descente 3 sec contrôlée. Haltères chargeables ou barre EZ.',variant:'Élastique sous les pieds si gêne lombaire.',video:'https://www.youtube.com/watch?v=vzLAZLlxU90',alts:[{name:'Hip Thrust banc (barre)',desc:'Dos sur le banc, barre sur le bassin, pousse via les fessiers. Plus doux pour le bas du dos.'},{name:'Leg Curl (Leg Developer)',desc:'Allongé sur ta station, ramène les talons aux fesses. Isole l\'arrière de cuisse, zéro risque dos.'}]},
      {id:'p1a2',name:'Développé incliné 30° (barre/haltères)',volume:'4 x 8-10',tempo:'3-1-1',hasWeight:true,desc:'Ton mouvement roi de poussée : banc à 30° = épaules protégées (ton focus dossier). Coudes ~45°, descente 3 sec, pousse fort — c\'est une zone où tu peux charger. SÉCURITÉ SOLO obligatoire à la barre : chandelles réglées en butées, garde 1-2 reps en réserve, JAMAIS l\'échec total sans pareur.',variant:'Passe aux haltères si l\'épaule est sensible ce jour-là (trajet plus naturel, et tu les lâches sur les côtés si tu rates).',video:'https://www.youtube.com/watch?v=8iPEnn-ltC8',alts:[{name:'Développé couché (haltères)',desc:'À plat, un haltère par main. Sécurité totale en solo : tu lâches sur les côtés.'},{name:'Développé couché (barre)',desc:'À plat sur chandelles-butées si tu veux varier. Charge un peu plus lourd.'},{name:'Pompes lestées (gilet)',desc:'Gilet 5kg, corps gainé, au sol.'}]},
    ]},
    {name:'Superset 2',rest:75,exercises:[
      {id:'p1a3',name:'Fentes arrière (haltères légers)',volume:'3 x 10 / jambe',tempo:'2-0-1',hasWeight:true,desc:'Grand pas en arrière, genou frôle le sol. Protège le genou avant. Charge légère.',variant:'Sans poids si le genou droit tire.',video:'https://www.youtube.com/watch?v=xNLfW34fht0',alts:[{name:'Leg Extension légère (Leg Developer)',desc:'Sur ta station. Contrôle la montée, ne verrouille pas le genou à fond. STOP si l\'aine pique.'},{name:'Pont fessier 1 jambe',desc:'Sans charge, au sol. Talon proche des fesses, serre la fesse à 100%.'}]},
      {id:'p1a4',name:'Swing Kettlebell (10kg) — contrôlé',volume:'3 x 12',tempo:'rythmé',hasWeight:false,desc:'Coup de hanche franc mais PAS maximal en Phase 1 : rythme fluide, dos plat, zéro violence. La version explosive t\'attend en Phase 2, genou validé. Pas un squat.',variant:'Pont fessier au sol rapide (15 reps) si dos sensible.',video:'https://www.youtube.com/watch?v=hnPJ1XhN1jE',alts:[{name:'Good morning élastique',desc:'Élastique sous les pieds, sur les épaules. Bascule du buste, dos plat.'},{name:'Pont fessier explosif',desc:'Au sol, monte vite, descends lent.'}]},
    ]},
  ]},
  B:{title:'Séance B',sub:'Jambes, Dos & Gainage',duration:'~45 min',supersets:[
    {name:'Superset 1',rest:90,exercises:[
      {id:'p1b1',name:'Goblet Squat (KB 10kg)',volume:'4 x 10',tempo:'3-1-1',hasWeight:false,desc:'KB contre la poitrine. Descends bas, genoux vers l\'extérieur, talons au sol. Descente 3 sec.',variant:'Squat au poids du corps tempo lent si genou prudent.',video:'https://www.youtube.com/watch?v=EkSAynpQxuo',alts:[{name:'Leg Extension + Leg Curl (combo)',desc:'10 extensions + 10 curls sur la station. Travaille la cuisse sans charge axiale, idéal genou en reprise.'},{name:'Squat 2 haltères épaules',desc:'Un haltère sur chaque épaule. Charge un peu plus lourd.'}]},
      {id:'p1b2',name:'Tirage dos penché (barre/EZ)',volume:'4 x 10',tempo:'2-1-2',hasWeight:true,desc:'Buste penché à 45°, dos plat. Tire vers le nombril, serre les omoplates.',variant:'Tirage élastique ancré dans une porte.',video:'https://www.youtube.com/watch?v=X97Jxni1ofw',alts:[{name:'Rowing 1 bras (haltère)',desc:'Appui main+genou sur le banc. Tire l\'haltère vers la hanche.'},{name:'Tirage élastique assis',desc:'Élastique autour des pieds, tire vers le ventre.'}]},
    ]},
    {name:'Superset 2',rest:60,exercises:[
      {id:'p1b3',name:'Mollets debout (1 pied)',volume:'3 x 12 / jambe',tempo:'2-1-2',hasWeight:false,desc:'Sur une marche, descends bas, monte haut. Un haltère à la main pour charger.',variant:'Deux pieds au sol si équilibre fragile.',video:'https://www.youtube.com/watch?v=3bCraReG5o8',alts:[{name:'Mollets assis (KB sur genoux)',desc:'Assis, KB posée sur les genoux, monte sur les pointes.'}]},
      {id:'p1b4',name:'Farmer Walk (2 KB 10kg)',volume:'4 x 30 sec',tempo:'—',hasWeight:false,desc:'Une KB dans chaque main, marche droit, ventre serré, épaules basses. Gainage total.',variant:'Planche Copenhagen sur chaise si pas de place pour marcher.',video:'https://www.youtube.com/watch?v=rt17lmnaLSM',alts:[{name:'Suitcase carry (1 KB)',desc:'Une seule KB d\'un côté, change à chaque tour. Anti-bascule du bassin.'},{name:'Stomach Vacuum debout',desc:'5 x 12 sec d\'apnée ventre rentré. Plaque le transverse.'}]},
    ]},
  ]},
  C:{title:'Séance C',sub:'Dos, Poussée & Cardio',duration:'~40 min',supersets:[
    {name:'Superset 1',rest:90,exercises:[
      {id:'p1c1',name:'Rowing Bûcheron (haltère lourd)',volume:'4 x 8-10 / bras',tempo:'2-1-3',hasWeight:true,desc:'Appui sur le banc. Tire l\'haltère vers la hanche, descente 3 sec. Charge lourde.',variant:'Tirage élastique haut (remplace la traction, t\'as pas de barre).',video:'https://www.youtube.com/watch?v=X97Jxni1ofw',alts:[{name:'Tirage élastique vertical (lat pulldown)',desc:'Élastique accroché en haut d\'une porte, tire vers la poitrine à genoux. Le vrai substitut de tes tractions.'},{name:'Rowing barre EZ',desc:'Penché, tire l\'EZ vers le nombril.'}]},
      {id:'p1c2',name:'Développé incliné 30° (haltères)',volume:'4 x 10',tempo:'3-1-1',hasWeight:true,desc:'Banc incliné à 30° (protège l\'épaule). Pousse vers le plafond, descente contrôlée.',variant:'Pompes pieds surélevés.',video:'https://www.youtube.com/watch?v=8iPEnn-ltC8',alts:[{name:'Pompes lestées (gilet)',desc:'Gilet 5kg, corps gainé.'},{name:'Développé militaire assis (haltères)',desc:'Assis sur le banc, pousse au-dessus de la tête. Épaules.'}]},
    ]},
    {name:'Superset 2 (finisher)',rest:60,exercises:[
      {id:'p1c3',name:'Pont fessier 1 jambe',volume:'3 x 12 / jambe',tempo:'2-1-2',hasWeight:false,desc:'Talon proche des fesses, orteils levés. Serre la fesse à 100% AVANT de décoller. Réveille le fessier (clé hanche/genou).',variant:'Deux pieds + haltère sur le ventre.',video:'https://www.youtube.com/watch?v=AVAXhy6pl7o',alts:[{name:'Hip thrust banc',desc:'Dos sur le banc, charge sur le bassin.'}]},
      {id:'p1c4',name:'Vélo Ativafit — intervalles doux',volume:'8 min · 30s vite / 30s lent',tempo:'—',hasWeight:false,desc:'Résistance modérée. Alterne 30 sec rythme soutenu / 30 sec récup. Cardio sans impact, safe pour le genou.',variant:'10 min allure constante si fatigue.',video:'',alts:[{name:'Marche rapide 12 min',desc:'Dehors, allure soutenue. Zéro impact.'}]},
    ]},
  ]},
  D:{title:'Séance D',sub:'Haut du corps · Core · Cardio (optionnelle)',duration:'~45 min',optional:true,circuit:true,supersets:[
    {name:'Superset 1',rest:60,exercises:[
      {id:'p1d1',name:'Développé incliné 30° (haltères)',volume:'4 x 12',tempo:'2-1-1',hasWeight:true,desc:'Reps plus hautes, recherche du pump. Banc à 30°, épaules protégées. Jour léger : on cherche le muscle, pas la barre la plus lourde.',variant:'Pompes pieds surélevés.',video:'https://www.youtube.com/watch?v=8iPEnn-ltC8',alts:[{name:'Développé couché haltères',desc:'À plat, un haltère par main.'},{name:'Pompes lestées (gilet)',desc:'Gilet 5kg, corps gainé.'}]},
      {id:'p1d2',name:'Tirage élastique / Rowing (12 reps)',volume:'4 x 12',tempo:'2-1-2',hasWeight:true,desc:'Dos épais. Tire vers le nombril, serre les omoplates. Pas de barre de traction → élastique ou rowing.',variant:'Rowing 1 bras haltère.',video:'https://www.youtube.com/watch?v=X97Jxni1ofw',alts:[{name:'Tirage élastique vertical',desc:'Élastique en haut d\'une porte, vers la poitrine.'}]},
    ]},
    {name:'Superset 2 (bras & épaules — le tracé)',rest:45,exercises:[
      {id:'p1d3',name:'Élévations latérales (haltères légers)',volume:'3 x 15',tempo:'2-0-2',hasWeight:true,desc:'Léger, contrôle strict, pas d\'élan. Dessine la largeur d\'épaules = effet tracé immédiat.',variant:'Élévations à l\'élastique.',video:'https://www.youtube.com/watch?v=3VcKaXpzqRo',alts:[{name:'Développé militaire léger',desc:'Assis, pousse au-dessus de la tête.'}]},
      {id:'p1d4',name:'Curl marteau + Dips banc (triceps)',volume:'3 x 12 (chaque)',tempo:'2-0-1',hasWeight:true,desc:'Biceps (curl marteau) puis triceps (dips sur le banc). Volume bras = bras qui ressortent.',variant:'Extension triceps haltère au-dessus de la tête.',video:'https://www.youtube.com/watch?v=zC3nLlEvin4',alts:[{name:'Curl + extension à l\'élastique',desc:'Tout à l\'élastique.'}]},
    ]},
    {name:'Core / Anti-rotation (le tracé du ventre)',rest:45,exercises:[
      {id:'p1dc1',name:'Halo Kettlebell',volume:'3 x 8 / sens',tempo:'lent',hasWeight:false,desc:'KB autour de la tête, lent et contrôlé. Serre le ventre fort tout du long. Gaine le tronc + ouvre les épaules.',variant:'Halo avec un disque ou un haltère.',video:'',alts:[{name:'Tour du monde (disque)',desc:'Disque autour de la taille, change de sens.'}]},
      {id:'p1dc2',name:'Pallof Press (élastique)',volume:'3 x 12 / côté',tempo:'2-1-2',hasWeight:false,desc:'Élastique ancré sur le côté, hauteur poitrine. Pousse les bras devant et RÉSISTE à la rotation. L\'exo roi des obliques.',variant:'À genoux si debout instable.',video:'',alts:[{name:'Suitcase carry (1 KB)',desc:'Porté valise lourd d\'un côté, le tronc résiste à la bascule.'}]},
      {id:'p1dc3',name:'Stomach Vacuum',volume:'4 x 15 sec',tempo:'apnée',hasWeight:false,desc:'Ventre rentré au max, nombril vers la colonne. Réveille le transverse profond → resserre la taille. Mieux à jeun.',variant:'Allongé si debout trop dur.',video:'',alts:[{name:'Gainage planche',desc:'Corps gainé, ventre serré, 3 x 30s.'}]},
    ]},
    {name:'Finisher cardio',rest:0,exercises:[
      {id:'p1d5',name:'Vélo — intervalles',volume:'10 min · 30s vite / 60s lent',tempo:'—',hasWeight:false,desc:'Ta soupape cardio. Résistance modérée sur les 30s. Zéro impact genou. C\'est ici que tu te défonces sans risque.',variant:'10 min allure constante soutenue si fatigue.',video:'',alts:[{name:'Marche rapide 15 min',desc:'Dehors, allure vive.'}]},
    ]},
  ]},
};

const PHASE2={
  A:{title:'Séance A',sub:'Force Jambes & Rebond',duration:'~48 min',supersets:[
    {name:'Superset 1',rest:120,exercises:[
      {id:'p2a1',name:'Squat lourd (barre/haltères)',volume:'4 x 6-8',tempo:'2-0-X',hasWeight:true,desc:'Descente 2 sec, remonte explosif (X). Charge lourde.',variant:'Goblet squat 2 KB si dos prudent.',video:'https://www.youtube.com/watch?v=EkSAynpQxuo',alts:[{name:'Squat bulgare (haltères)',desc:'Pied arrière sur le banc. Unilatéral, gros sur le fessier.'},{name:'Hack squat maison',desc:'Talons surélevés, dos droit, charge sur la poitrine.'}]},
      {id:'p2a2',name:'Soulevé de terre lourd (barre)',volume:'4 x 8',tempo:'2-0-X',hasWeight:true,desc:'Dos plat, chaîne postérieure, remontée explosive.',variant:'Hip thrust lourd au banc.',video:'https://www.youtube.com/watch?v=vzLAZLlxU90',alts:[{name:'Romanian deadlift (haltères)',desc:'Jambes quasi tendues, étire l\'ischio, dos plat.'}]},
    ]},
    {name:'Superset 2 (pliométrie — si genou 0/10)',rest:75,exercises:[
      {id:'p2a3',name:'Petits rebonds sur place',volume:'3 x 20 sauts',tempo:'élastique',hasWeight:false,desc:'Pointes de pieds, genoux quasi tendus, contact sol minimal. STOP si le genou réagit.',variant:'Montées sur pointes rapides sans décoller (si genou sensible).',video:'https://www.youtube.com/watch?v=RkcZ1BzYl_M',alts:[{name:'Montées de mollet explosives',desc:'Sans décoller du sol, juste la cheville. Zéro impact genou.'}]},
      {id:'p2a4',name:'Copenhagen Plank complet',volume:'3 x 30 sec / côté',tempo:'—',hasWeight:false,desc:'Pied sur le banc (pas le genou). Bétonne l\'intérieur des cuisses, blinde la pubalgie.',variant:'Sur le genou si trop dur.',video:'https://www.youtube.com/watch?v=rJQ1XdHKZBs',alts:[{name:'Adduction élastique debout',desc:'Élastique à la cheville, ramène la jambe vers l\'intérieur.'}]},
    ]},
  ]},
  B:{title:'Séance B',sub:'Haut du corps & Armure',duration:'~52 min',supersets:[
    {name:'Superset 1 — le lourd',rest:150,exercises:[
      {id:'p2b1',name:'Développé couché lourd (haltères/barre)',volume:'5 x 5-6',tempo:'2-0-X',hasWeight:true,desc:'⬆️ Cran au-dessus : moins de reps, plus de charge. Tu vises la dernière rep de chaque série avec 1 SEULE en réserve (RIR 1) — pas deux, pas trois. Descente 2 sec, pousse avec violence. ⚠️ SÉCURITÉ SOLO à la barre : chandelles en butées réglées, jamais l\'échec total sans pareur. Aux haltères tu peux lâcher sur les côtés → c\'est LA solution pour chercher l\'échec en sécurité.',variant:'Développé incliné 30° si l\'épaule tire ce jour-là.',video:'https://www.youtube.com/watch?v=LlguIiYZjUs',alts:[{name:'Développé incliné lourd',desc:'Banc à 30°, plus safe épaule, même intention lourde.'},{name:'Pompes lestées + élastique',desc:'Gilet 5kg + élastique dans le dos, séries longues jusqu\'à l\'échec.'}]},
      {id:'p2b2',name:'Rowing lourd (barre) / Tirage élastique dur',volume:'5 x 6-8',tempo:'2-1-2',hasWeight:true,desc:'⬆️ Cran au-dessus. Pas de barre de traction : rowing barre penché le plus lourd que ton dos tient à plat, OU tirage élastique vertical le plus dur. RIR 1 aussi. Dos épais = épaules saines pour les contacts.',variant:'Rowing 1 bras haltère le plus lourd.',video:'https://www.youtube.com/watch?v=X97Jxni1ofw',alts:[{name:'Rowing 1 bras lourd (haltère)',desc:'Appui banc, tire vers la hanche, charge max.'},{name:'Tirage élastique vertical dur',desc:'Élastique le plus résistant, ancré en haut de porte.'}]},
    ]},
    {name:'Superset 2 — épaules & gainage',rest:90,exercises:[
      {id:'p2b3',name:'Développé militaire (haltères)',volume:'4 x 6-8',tempo:'2-0-1',hasWeight:true,desc:'⬆️ Plus lourd, moins de reps. Assis sur le banc, dos calé, pousse au-dessus de la tête sans cambrer. Serre les fesses et le ventre pour verrouiller le bassin.',variant:'Reste à 4 x 10 plus léger si l\'épaule chauffe.',video:'https://www.youtube.com/watch?v=B-aVuyhvLHU',alts:[{name:'Pike push-up',desc:'En V inversé, descends la tête vers le sol. Épaules au poids du corps.'},{name:'Développé Arnold (haltères)',desc:'Rotation des poignets pendant la poussée, plus de deltoïde antérieur.'}]},
      {id:'p2b4',name:'Farmer Walk lourd (2 KB / haltères)',volume:'4 x 45 sec',tempo:'—',hasWeight:false,desc:'Le plus lourd que tu tiens. Gainage max, épaules basses, ventre serré. Bonus : ça blinde la sangle sans un seul crunch.',variant:'Suitcase carry 1 côté (anti-bascule du bassin).',video:'https://www.youtube.com/watch?v=rt17lmnaLSM',alts:[{name:'Gainage planche lestée',desc:'Gilet 5kg sur le dos, planche 3x40s.'},{name:'Suitcase carry lourd',desc:'Une seule KB d\'un côté, change à chaque tour.'}]},
    ]},
    {name:'Tri-set 3 — le finisher congestion',rest:45,triset:true,exercises:[
      {id:'p2b5',name:'Élévations latérales (haltères)',volume:'4 x 15',tempo:'2-0-2',hasWeight:true,desc:'Départ du tri-set. Léger, strict, zéro élan. Les épaules larges = l\'effet "tracé" le plus rapide à obtenir.',variant:'Élévations à l\'élastique si les haltères les plus légers sont encore trop lourds.',video:'https://www.youtube.com/watch?v=3VcKaXpzqRo',alts:[{name:'Élévations élastique',desc:'Tension continue, brûle encore plus.'},{name:'Oiseau (deltoïde postérieur)',desc:'Buste penché, ouvre les bras sur les côtés. Posture.'}]},
      {id:'p2b6',name:'Curl marteau (haltères)',volume:'4 x 12',tempo:'2-0-1',hasWeight:true,desc:'Enchaîné SANS repos après les élévations. Prise marteau (paumes face à face) : épargne le poignet et épaissit l\'avant-bras.',variant:'Curl EZ si tu veux charger plus.',video:'https://www.youtube.com/watch?v=zC3nLlEvin4',alts:[{name:'Curl barre EZ',desc:'Charge plus lourde, poignets protégés par la barre coudée.'},{name:'Curl élastique',desc:'Tension continue, parfait en fin de tri-set.'}]},
      {id:'p2b7',name:'Extension triceps au-dessus de la tête',volume:'4 x 12',tempo:'2-0-1',hasWeight:true,desc:'3e et dernier de l\'enchaînement, puis 45s de repos et tu repars. Haltère ou EZ derrière la nuque, coudes serrés et fixes. À la fin du 4e tour les bras doivent être durs comme du bois — c\'est le signal que le tri-set a fait son job.',variant:'Dips sur banc lestés si tu préfères le poids du corps.',video:'https://www.youtube.com/watch?v=_gsUck-7M74',alts:[{name:'Dips sur banc (gilet 5kg)',desc:'Mains sur le banc derrière toi, descends bas.'},{name:'Extension élastique (kickback)',desc:'Élastique ancré haut, tends les bras vers le bas.'}]},
    ]},
  ]},
  C:{title:'Séance C',sub:'Déplacements & Souffle',duration:'~44 min',supersets:[
    {name:'Superset 1',rest:90,exercises:[
      {id:'p2c1',name:'Fentes marchées (haltères)',volume:'4 x 10 / jambe',tempo:'2-0-1',hasWeight:true,desc:'Avance pas à pas, genou arrière frôle le sol. Contrôle l\'axe du genou avant.',variant:'Fentes arrière sur place (plus doux genou).',video:'https://www.youtube.com/watch?v=xNLfW34fht0',alts:[{name:'Step-up sur banc (haltères)',desc:'Monte sur le banc une jambe, contrôle la descente.'}]},
      {id:'p2c2',name:'Pompes explosives (gilet)',volume:'4 x 10-12',tempo:'X',hasWeight:false,desc:'Pousse fort pour décoller les mains. Gilet si trop facile.',variant:'Pompes classiques + élastique dans le dos.',video:'https://www.youtube.com/watch?v=IODxDxX7oi4',alts:[{name:'Développé haltères explosif',desc:'Léger, pousse vite vers le plafond.'}]},
    ]},
    {name:'Superset 2 (basket)',rest:75,exercises:[
      {id:'p2c3',name:'Swing Kettlebell explosif',volume:'4 x 15',tempo:'X',hasWeight:false,desc:'Coup de hanche sec. Puissance et explosivité du bassin.',variant:'Pont fessier explosif lesté.',video:'https://www.youtube.com/watch?v=hnPJ1XhN1jE',alts:[{name:'Kettlebell deadlift rapide',desc:'2 KB, monte vite, dos plat.'}]},
      {id:'p2c4',name:'Pas chassés latéraux (élastique)',volume:'3 x 1 min',tempo:'—',hasWeight:false,desc:'Élastique aux genoux, posture basse de défense, déplacements latéraux. Spécifique basket.',variant:'Pas de côté lents jambes tendues.',video:'https://www.youtube.com/watch?v=7GLe7AwtmNU',alts:[{name:'Vélo Ativafit sprint',desc:'6 x 20s sprint / 40s récup. Cardio sans impact.'}]},
    ]},
  ]},
  D:{title:'Séance D',sub:'Circuit haut du corps + Circuit gainage (optionnelle)',duration:'~42 min',optional:true,circuit:true,supersets:[
    {name:'Circuit 1 — Haut du corps',rest:90,tours:'3 à 4 tours',note:'Enchaîne les 4 exos SANS repos, puis 90s de récup en fin de tour. Charges modérées : ici on cherche la congestion, pas le record. Coche les exos à ton dernier tour.',exercises:[
      {id:'p2d1',name:'Développé incliné (haltères)',volume:'10-12 reps / tour',tempo:'2-0-1',hasWeight:true,desc:'Ouverture du circuit. Banc 30°, épaules protégées. Charge modérée — tu dois pouvoir enchaîner derrière sans t\'écrouler.',variant:'Pompes pieds surélevés si les haltères sont pris.',video:'https://www.youtube.com/watch?v=8iPEnn-ltC8',alts:[{name:'Pompes lestées (gilet)',desc:'Gilet 5kg, corps gainé.'},{name:'Développé couché haltères',desc:'À plat, un haltère par main.'}]},
      {id:'p2d2',name:'Rowing / Tirage élastique',volume:'12 reps / tour',tempo:'2-1-2',hasWeight:true,desc:'Enchaîné direct. Tire au nombril, serre les omoplates 1 sec. Équilibre la poussée du dessus.',variant:'Rowing 1 bras haltère.',video:'https://www.youtube.com/watch?v=X97Jxni1ofw',alts:[{name:'Tirage élastique vertical',desc:'Élastique en haut d\'une porte, vers la poitrine.'},{name:'Rowing barre EZ',desc:'Penché, dos plat, tire au nombril.'}]},
      {id:'p2d3',name:'Élévations latérales (haltères légers)',volume:'15 reps / tour',tempo:'2-0-2',hasWeight:true,desc:'Enchaîné direct. Léger et strict. C\'est l\'exo qui fait le plus mal dans un circuit — et celui qui dessine le plus vite.',variant:'À l\'élastique.',video:'https://www.youtube.com/watch?v=3VcKaXpzqRo',alts:[{name:'Développé militaire léger',desc:'Assis, pousse au-dessus de la tête.'},{name:'Oiseau (deltoïde postérieur)',desc:'Buste penché, ouvre les bras.'}]},
      {id:'p2d4',name:'Curl marteau + Dips sur banc',volume:'12 reps chacun / tour',tempo:'2-0-1',hasWeight:true,desc:'Fin du tour : biceps puis triceps collés. Puis 90s de repos et tu repars. Les bras finissent le circuit en béton.',variant:'Curl + extension à l\'élastique.',video:'https://www.youtube.com/watch?v=zC3nLlEvin4',alts:[{name:'Curl EZ + extension au-dessus de la tête',desc:'Barre EZ pour les deux mouvements.'},{name:'Tout à l\'élastique',desc:'Tension continue, zéro matériel à changer.'}]},
    ]},
    {name:'Circuit 2 — Gainage & sangle abdominale',rest:60,tours:'2 à 3 tours',note:'Deuxième circuit, plus court. Enchaîne les 3 exos, 60s de repos en fin de tour. Aucun crunch, aucun relevé de buste : on travaille le transverse et les obliques en anti-mouvement.',exercises:[
      {id:'p2dc1',name:'Halo Kettlebell',volume:'8 / sens',tempo:'lent',hasWeight:false,desc:'KB autour de la tête, lent et contrôlé. Ventre serré fort tout du long. Gaine le tronc + ouvre les épaules après le circuit 1.',variant:'Halo avec un disque.',video:'',alts:[{name:'Tour du monde (disque)',desc:'Disque autour de la taille, change de sens.'}]},
      {id:'p2dc2',name:'Pallof Press (élastique dur)',volume:'12 / côté',tempo:'2-1-2',hasWeight:false,desc:'Élastique ancré sur le côté, hauteur poitrine. Pousse devant et RÉSISTE à la rotation. L\'exo roi des obliques — celui qui resserre la sangle sans la faire gonfler.',variant:'À genoux si instable debout.',video:'',alts:[{name:'Suitcase carry lourd',desc:'Porté valise d\'un côté, le tronc résiste à la bascule.'}]},
      {id:'p2dc3',name:'Stomach Vacuum',volume:'4 x 15 sec',tempo:'apnée',hasWeight:false,desc:'Fin de tour. Ventre rentré au max, nombril vers la colonne. Réveille le transverse profond → la réponse directe à la sangle molle et à la distension. Mieux à jeun, mais efficace ici aussi.',variant:'Allongé si debout trop dur.',video:'',alts:[{name:'Gainage planche lestée',desc:'Gilet 5kg, 3 x 40s.'}]},
    ]},
    {name:'Finisher cardio — optionnel',rest:0,tours:'si tu as encore du jus',optional:true,note:'À faire SEULEMENT si les deux circuits ne t\'ont pas vidé. Si tu es cuit, tu sors — la séance est déjà complète sans ça.',exercises:[
      {id:'p2d5',name:'Vélo — sprints (optionnel)',volume:'6 à 8 tours · 20s sprint / 40s récup',tempo:'—',hasWeight:false,desc:'Ta soupape. Sprint à fond sur les 20s, récup active sur les 40s. Zéro impact genou — c\'est ici que tu peux te défoncer sans rien risquer. Coupe à 6 tours si la séance a déjà été longue.',variant:'10 min allure constante si tu veux juste drainer.',video:'',alts:[{name:'Flush 10 min résistance minimale',desc:'Version récup : draine les tendons de la hanche, aide le sommeil.'}]},
    ]},
  ]},
};

// ── PHASE 3 — PRÉ-SAISON BASKET (S11-14) ──
const PHASE3={
  A:{title:'Séance A',sub:'Puissance Jambes & Détente',duration:'~45 min',supersets:[
    {name:'Superset 1',rest:120,exercises:[
      {id:'p2a1',name:'Squat explosif (charge modérée)',volume:'4 x 6',tempo:'2-0-X',hasWeight:true,desc:'−20% vs ton squat lourd de P2. Descente 2 sec, remontée la plus VITE possible : c\'est la vitesse qui construit la détente, pas la charge.',variant:'Goblet squat explosif 2 KB.',video:'https://www.youtube.com/watch?v=EkSAynpQxuo',alts:[{name:'Squat bulgare explosif (haltères)',desc:'Pied arrière sur le banc, pousse vite.'}]},
      {id:'p2a2',name:'Soulevé roumain (haltères)',volume:'3 x 8',tempo:'3-0-1',hasWeight:true,desc:'Jambes quasi tendues, étire l\'ischio, dos plat. Entretient la chaîne postérieure sans cramer les jambes.',variant:'Hip thrust banc.',video:'https://www.youtube.com/watch?v=vzLAZLlxU90',alts:[{name:'Leg Curl (Leg Developer)',desc:'Isolation ischios sur ta station, zéro risque dos.'}]},
    ]},
    {name:'Superset 2 (détente — genou validé)',rest:90,exercises:[
      {id:'p3a3',name:'Sauts verticaux contrôlés',volume:'4 x 5',tempo:'X',hasWeight:false,desc:'Saute haut, réception AMORTIE genoux fléchis, 2 sec de pause entre chaque saut. Qualité > quantité. STOP net si le genou réagit.',variant:'Petits rebonds sur place (version P2).',video:'https://www.youtube.com/watch?v=RkcZ1BzYl_M',alts:[{name:'Sauts sur pointes (faible amplitude)',desc:'Impact minimal, cheville élastique.'}]},
      {id:'p2a4',name:'Copenhagen Plank complet',volume:'3 x 30 sec / côté',tempo:'—',hasWeight:false,desc:'Pied sur le banc (pas le genou). Bétonne l\'intérieur des cuisses, blinde la pubalgie avant les matchs.',variant:'Sur le genou si trop dur.',video:'https://www.youtube.com/watch?v=rJQ1XdHKZBs',alts:[{name:'Adduction élastique debout',desc:'Élastique à la cheville, ramène la jambe vers l\'intérieur.'}]},
    ]},
  ]},
  B:{title:'Séance B',sub:'Haut du corps · Puissance',duration:'~42 min',supersets:[
    {name:'Superset 1',rest:120,exercises:[
      {id:'p2b1',name:'Développé incliné explosif (haltères)',volume:'5 x 5',tempo:'2-0-X',hasWeight:true,desc:'~80% de ton lourd P2, intention de vitesse maximale à la poussée.',variant:'Pompes explosives gilet.',video:'https://www.youtube.com/watch?v=8iPEnn-ltC8',alts:[{name:'Développé couché explosif',desc:'À plat, même intention de vitesse.'}]},
      {id:'p2b2',name:'Rowing lourd (barre/haltère)',volume:'4 x 8',tempo:'2-1-2',hasWeight:true,desc:'Dos épais, épaules saines pour encaisser les contacts.',variant:'Tirage élastique le plus dur.',video:'https://www.youtube.com/watch?v=X97Jxni1ofw',alts:[{name:'Rowing 1 bras lourd',desc:'Appui banc, tire vers la hanche.'}]},
    ]},
    {name:'Superset 2',rest:75,exercises:[
      {id:'p2b3',name:'Développé militaire (haltères)',volume:'4 x 8',tempo:'2-0-1',hasWeight:true,desc:'Assis, dos calé, pousse au-dessus de la tête sans cambrer.',variant:'Élévations latérales légères.',video:'https://www.youtube.com/watch?v=B-aVuyhvLHU',alts:[{name:'Pike push-up',desc:'En V inversé, tête vers le sol.'}]},
      {id:'p2dc2',name:'Pallof Press (élastique dur)',volume:'3 x 12 / côté',tempo:'2-1-2',hasWeight:false,desc:'Anti-rotation, obliques en béton pour les contacts.',variant:'À genoux si instable.',video:'',alts:[{name:'Suitcase carry lourd',desc:'Porté valise, anti-bascule.'}]},
    ]},
    {name:'Tri-set 3 — entretien (volume réduit)',rest:45,triset:true,exercises:[
      {id:'p2b5',name:'Élévations latérales (haltères)',volume:'3 x 15',tempo:'2-0-2',hasWeight:true,desc:'Version pré-saison : 3 tours au lieu de 4. On entretient l\'armure sans créer de fatigue qui plomberait les jambes.',variant:'À l\'élastique.',video:'https://www.youtube.com/watch?v=3VcKaXpzqRo',alts:[{name:'Élévations élastique',desc:'Tension continue.'},{name:'Oiseau (deltoïde postérieur)',desc:'Buste penché, ouvre les bras.'}]},
      {id:'p2b6',name:'Curl marteau (haltères)',volume:'3 x 12',tempo:'2-0-1',hasWeight:true,desc:'Enchaîné direct. Entretien des bras, charge modérée.',variant:'Curl EZ.',video:'https://www.youtube.com/watch?v=zC3nLlEvin4',alts:[{name:'Curl barre EZ',desc:'Poignets protégés.'},{name:'Curl élastique',desc:'Tension continue.'}]},
      {id:'p2b7',name:'Extension triceps au-dessus de la tête',volume:'3 x 12',tempo:'2-0-1',hasWeight:true,desc:'3e du tri-set. En semaine d\'affûtage (S4 du bloc), coupe à 2 tours.',variant:'Dips sur banc.',video:'https://www.youtube.com/watch?v=_gsUck-7M74',alts:[{name:'Dips sur banc (gilet 5kg)',desc:'Mains sur le banc derrière toi.'},{name:'Extension élastique',desc:'Élastique ancré haut.'}]},
    ]},
  ]},
  C:{title:'Séance C',sub:'Spécifique Basket & Souffle',duration:'~44 min',supersets:[
    {name:'Superset 1',rest:90,exercises:[
      {id:'p2c1',name:'Fentes marchées (haltères)',volume:'4 x 10 / jambe',tempo:'2-0-1',hasWeight:true,desc:'Avance pas à pas, genou arrière frôle le sol. Contrôle l\'axe du genou avant.',variant:'Fentes arrière sur place (plus doux genou).',video:'https://www.youtube.com/watch?v=xNLfW34fht0',alts:[{name:'Step-up sur banc (haltères)',desc:'Monte une jambe, contrôle la descente.'}]},
      {id:'p2c4',name:'Pas chassés latéraux (élastique)',volume:'4 x 45 sec',tempo:'—',hasWeight:false,desc:'Posture basse de défense, déplacements vifs. Spécifique basket.',variant:'Pas de côté lents jambes tendues.',video:'https://www.youtube.com/watch?v=7GLe7AwtmNU',alts:[{name:'Vélo sprint',desc:'6 x 20s sprint / 40s récup.'}]},
    ]},
    {name:'Superset 2 (conditioning match)',rest:75,exercises:[
      {id:'p2c3',name:'Swing Kettlebell explosif',volume:'4 x 15',tempo:'X',hasWeight:false,desc:'Coup de hanche sec. Puissance et explosivité du bassin.',variant:'Pont fessier explosif lesté.',video:'https://www.youtube.com/watch?v=hnPJ1XhN1jE',alts:[{name:'KB deadlift rapide',desc:'2 KB, monte vite, dos plat.'}]},
      {id:'p3c4',name:'Vélo — efforts répétés type match',volume:'10 x 15s sprint / 45s récup',tempo:'—',hasWeight:false,desc:'Simule les efforts répétés d\'un match. À fond 15s, récup active 45s. Les jambes de 4e quart-temps se gagnent ici.',variant:'8 tours si fatigue.',video:'',alts:[{name:'Pas chassés + montées de genoux',desc:'3 x 1 min haute intensité.'}]},
    ]},
  ]},
};
PHASE3.D=PHASE2.D;

// ── BLOC 2 — FORCE & EXPLOSIVITÉ (S1-4 du bloc 2, semaines internes 5-8) ──
// Progression directe du Bloc 1 : moins de reps, plus lourd, et la pliométrie entre par la petite porte.
const BLOC2={
  A:{title:'Séance A',sub:'Force Jambes & Détente',duration:'~50 min',supersets:[
    {name:'Superset 1 — force pure',rest:150,exercises:[
      {id:'p2a1',name:'Squat lourd (barre/haltères)',volume:'5 x 5',tempo:'2-0-X',hasWeight:true,desc:'⬆️ Cran au-dessus du Bloc 1 : 5 reps, charge max. Descente 2 sec contrôlée, remontée la plus explosive possible. Genoux vers l\'extérieur, talons plantés. ⚠️ Si l\'aine ou la hanche pince en bas → tu réduis l\'amplitude avant de réduire la charge.',variant:'Goblet squat 2 KB si le dos est prudent ce jour-là.',video:'https://www.youtube.com/watch?v=EkSAynpQxuo',alts:[{name:'Squat bulgare (haltères)',desc:'Pied arrière sur le banc. Unilatéral, très fessier, moins de charge axiale.'},{name:'Leg Extension + Leg Curl lourds',desc:'Sur la station. Zéro charge axiale — la porte de sortie si le dos ou la hanche parle.'}]},
      {id:'p2a2',name:'Soulevé de terre lourd (barre)',volume:'4 x 5',tempo:'2-0-X',hasWeight:true,desc:'⬆️ Lourd, dos plat, chaîne postérieure. Pousse le sol avec les pieds, ne tire pas avec le bas du dos. Remontée explosive. RIR 1-2 : sur le SDT on ne joue pas avec l\'échec.',variant:'Hip thrust lourd au banc (plus doux lombaires).',video:'https://www.youtube.com/watch?v=vzLAZLlxU90',alts:[{name:'Romanian deadlift (haltères)',desc:'Jambes quasi tendues, étire l\'ischio, dos plat.'},{name:'Hip Thrust lourd (barre + banc)',desc:'Fessiers à fond, zéro compression lombaire.'}]},
    ]},
    {name:'Superset 2 — détente (volume bas, qualité haute)',rest:120,exercises:[
      {id:'b2a3',name:'Sauts verticaux contrôlés',volume:'4 x 4',tempo:'X',hasWeight:false,desc:'⚠️ Le mouvement le plus exigeant du programme pour ton genou. Saute haut, réception AMORTIE genoux fléchis, 3 sec de pause DEBOUT entre chaque saut. 4 reps seulement : c\'est la qualité qui construit la détente, jamais le volume. STOP net au premier signal du genou ou de la hanche — tu bascules sur les petits rebonds.',variant:'Petits rebonds sur place (3 x 20) si le genou est incertain.',video:'https://www.youtube.com/watch?v=RkcZ1BzYl_M',alts:[{name:'Petits rebonds sur place',desc:'Pointes de pieds, contact sol minimal. La version douce, zéro risque.'},{name:'Montées de mollet explosives',desc:'Sans décoller du sol, juste la cheville. Impact nul.'}]},
      {id:'p2a4',name:'Copenhagen Plank complet',volume:'3 x 35 sec / côté',tempo:'—',hasWeight:false,desc:'Pied sur le banc (pas le genou). Bétonne l\'intérieur des cuisses = l\'assurance-vie de ta pubalgie. Non négociable dans ce bloc : c\'est lui qui te permet de sauter.',variant:'Sur le genou si trop dur.',video:'https://www.youtube.com/watch?v=rJQ1XdHKZBs',alts:[{name:'Adduction élastique debout',desc:'Élastique à la cheville, ramène la jambe vers l\'intérieur.'}]},
    ]},
  ]},
  B:{title:'Séance B',sub:'Haut du corps · Force & Armure',duration:'~54 min',supersets:[
    {name:'Superset 1 — le très lourd',rest:180,exercises:[
      {id:'p2b1',name:'Développé couché lourd (haltères/barre)',volume:'5 x 4-5',tempo:'2-0-X',hasWeight:true,desc:'⬆️⬆️ Le plus lourd du programme. 4-5 reps, RIR 1. Repos long (3 min) : c\'est ce qui te permet de charger vraiment. ⚠️ SÉCURITÉ SOLO : chandelles-butées à la barre, ou haltères (que tu peux lâcher sur les côtés). Jamais l\'échec total à la barre sans pareur.',variant:'Développé incliné 30° si l\'épaule tire.',video:'https://www.youtube.com/watch?v=LlguIiYZjUs',alts:[{name:'Développé incliné lourd',desc:'Banc à 30°, plus safe épaule.'},{name:'Développé haltères lourd',desc:'La version sécurisée pour chercher l\'échec en solo.'}]},
      {id:'p2b2',name:'Rowing lourd (barre) / Tirage élastique dur',volume:'5 x 5-6',tempo:'2-1-2',hasWeight:true,desc:'⬆️⬆️ Charge max, dos plat strict. Si la technique casse, la série est finie — le bas du dos n\'est pas négociable. Serre les omoplates 1 sec en haut.',variant:'Rowing 1 bras haltère le plus lourd (dos soutenu par le banc).',video:'https://www.youtube.com/watch?v=X97Jxni1ofw',alts:[{name:'Rowing 1 bras lourd',desc:'Appui banc, zéro contrainte lombaire, charge max.'},{name:'Tirage élastique vertical dur',desc:'Élastique le plus résistant.'}]},
    ]},
    {name:'Superset 2 — épaules & gainage',rest:90,exercises:[
      {id:'p2b3',name:'Développé militaire (haltères)',volume:'4 x 6',tempo:'2-0-1',hasWeight:true,desc:'⬆️ Lourd. Assis, dos calé, fesses et ventre serrés pour verrouiller le bassin. Pousse au-dessus de la tête sans cambrer.',variant:'4 x 10 plus léger si l\'épaule chauffe.',video:'https://www.youtube.com/watch?v=B-aVuyhvLHU',alts:[{name:'Développé Arnold',desc:'Rotation des poignets pendant la poussée.'},{name:'Pike push-up',desc:'En V inversé, épaules au poids du corps.'}]},
      {id:'b2b4',name:'Farmer Walk très lourd (2 KB / haltères)',volume:'4 x 50 sec',tempo:'—',hasWeight:false,desc:'Le plus lourd que tes mains tiennent 50 secondes. Épaules basses, ventre serré, pas courts. Le gainage le plus rentable qui existe — et zéro crunch.',variant:'Suitcase carry (1 côté) pour l\'anti-bascule du bassin.',video:'https://www.youtube.com/watch?v=rt17lmnaLSM',alts:[{name:'Suitcase carry lourd',desc:'Une KB d\'un seul côté, change à chaque tour.'},{name:'Gainage planche lestée',desc:'Gilet 5kg, 3 x 45s.'}]},
    ]},
    {name:'Tri-set 3 — le finisher congestion',rest:45,triset:true,exercises:[
      {id:'p2b5',name:'Élévations latérales (haltères)',volume:'4 x 15',tempo:'2-0-2',hasWeight:true,desc:'Départ du tri-set, enchaîné sans repos. Strict, zéro élan. Après le lourd, c\'est ici que tu vas chercher la congestion.',variant:'À l\'élastique.',video:'https://www.youtube.com/watch?v=3VcKaXpzqRo',alts:[{name:'Élévations élastique',desc:'Tension continue.'},{name:'Oiseau (deltoïde postérieur)',desc:'Buste penché, ouvre les bras.'}]},
      {id:'p2b6',name:'Curl marteau (haltères)',volume:'4 x 12',tempo:'2-0-1',hasWeight:true,desc:'Enchaîné direct. Prise marteau, coudes collés au corps, pas de balancier.',variant:'Curl EZ pour charger plus.',video:'https://www.youtube.com/watch?v=zC3nLlEvin4',alts:[{name:'Curl barre EZ',desc:'Poignets protégés, charge plus lourde.'},{name:'Curl élastique',desc:'Tension continue.'}]},
      {id:'p2b7',name:'Extension triceps au-dessus de la tête',volume:'4 x 12',tempo:'2-0-1',hasWeight:true,desc:'3e du tri-set, puis 45s et tu repars. Coudes serrés et fixes, seul l\'avant-bras bouge.',variant:'Dips sur banc lestés.',video:'https://www.youtube.com/watch?v=_gsUck-7M74',alts:[{name:'Dips sur banc (gilet 5kg)',desc:'Mains sur le banc derrière toi.'},{name:'Extension élastique',desc:'Élastique ancré haut, tends vers le bas.'}]},
    ]},
  ]},
  C:{title:'Séance C',sub:'Puissance & Déplacements',duration:'~46 min',supersets:[
    {name:'Superset 1',rest:90,exercises:[
      {id:'p2c1',name:'Fentes marchées (haltères)',volume:'4 x 12 / jambe',tempo:'2-0-1',hasWeight:true,desc:'Avance pas à pas, genou arrière frôle le sol. Surveille l\'axe du genou avant : il ne rentre JAMAIS vers l\'intérieur. Le meilleur test de contrôle unilatéral que tu as.',variant:'Fentes arrière sur place (plus doux pour le genou).',video:'https://www.youtube.com/watch?v=xNLfW34fht0',alts:[{name:'Step-up sur banc (haltères)',desc:'Monte une jambe, contrôle la descente 3 sec.'},{name:'Fentes arrière sur place',desc:'Moins de contrainte sur le genou avant.'}]},
      {id:'b2c2',name:'Pompes explosives (gilet 5kg)',volume:'4 x 8-10',tempo:'X',hasWeight:false,desc:'Pousse assez fort pour décoller les mains du sol. Intention de vitesse maximale — c\'est ça qui transfère sur le tir et la passe.',variant:'Pompes classiques + élastique dans le dos.',video:'https://www.youtube.com/watch?v=IODxDxX7oi4',alts:[{name:'Développé haltères explosif',desc:'Charge légère, pousse le plus vite possible.'},{name:'Pompes déclinées',desc:'Pieds sur le banc, plus de charge sur les épaules.'}]},
    ]},
    {name:'Superset 2 — spécifique basket',rest:75,exercises:[
      {id:'p2c3',name:'Swing Kettlebell explosif',volume:'5 x 15',tempo:'X',hasWeight:false,desc:'Coup de hanche SEC. La KB monte parce que le bassin la projette, pas parce que les bras tirent. C\'est ton exo de puissance de hanche n°1 — et il soigne autant qu\'il muscle.',variant:'Pont fessier explosif lesté.',video:'https://www.youtube.com/watch?v=hnPJ1XhN1jE',alts:[{name:'KB deadlift rapide',desc:'2 KB, monte vite, dos plat.'},{name:'Pont fessier explosif lesté',desc:'Disque sur le bassin, monte vite.'}]},
      {id:'p2c4',name:'Pas chassés latéraux (élastique)',volume:'4 x 1 min',tempo:'—',hasWeight:false,desc:'Élastique aux genoux, posture basse de défense, bassin bas. Déplacements vifs sans croiser les pieds. Le moyen fessier travaille exactement comme en match.',variant:'Pas de côté lents jambes tendues si la hanche est raide.',video:'https://www.youtube.com/watch?v=7GLe7AwtmNU',alts:[{name:'Vélo Ativafit sprint',desc:'6 x 20s sprint / 40s récup. Zéro impact.'},{name:'Monster walk élastique',desc:'Marche avant/arrière élastique aux genoux, posture basse.'}]},
    ]},
  ]},
};
BLOC2.D=PHASE2.D;

// Mapping final : Bloc 1 = ex-Phase 2 (armure/volume) · Bloc 2 = force/explosivité · Bloc 3 = pré-saison
const BLOC1=PHASE2;
const BLOC3=PHASE3;


root.RehaabProgram = { blocks: [BLOC1, BLOC2, BLOC3], names: ['Armure & Volume', 'Force & Explosivité', 'Pré-saison Basket'] };
})(typeof globalThis !== 'undefined' ? globalThis : this);


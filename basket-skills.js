/* Rehaab : skills basket. Maniement (inspiration Kyrie Irving), explosivité au cercle (Derrick Rose), tir (Stephen Curry),
   jeu de jambes avec ballon. Questionnaire → paliers par domaine → séances skills complètes et blocs ajoutés aux autres séances.
   Fiches écrites pour l'app ; les noms de joueurs indiquent un style de jeu, pas un programme officiel. Pur, sans DOM. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BasketSkills = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const today = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const uid = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;

  const areas = {
    handle:{label:'Maniement de balle',short:'Dribble',style:'Kyrie Irving',why:'Contrôle des deux mains, tête haute, changements de rythme.'},
    coordination:{label:'Coordination & réception',short:'Coordination',style:'',why:'Attraper la balle en mouvement des deux côtés, changer de main autour d’un plot, pieds et mains ensemble.'},
    shoot:{label:'Tir',short:'Tir',style:'Stephen Curry',why:'Routine de forme, catch & shoot, tir après dribble, volume.'},
    finish:{label:'Finition au cercle',short:'Finition',style:'Derrick Rose',why:'Deux mains, appuis variés, vitesse et explosivité au cercle.'},
    footwork:{label:'Jeu de jambes avec ballon',short:'Appuis',style:'',why:'Triple menace, feintes, arrêts et pivots.'},
    defense:{label:'Défense',short:'Défense',style:'',why:'Posture, glissés, closeouts, aide et retour, rebond.'},
    moves:{label:'Moves & contres',short:'Moves',style:'',why:'Lire le défenseur et enchaîner le bon contre.'}
  };
  const TIERS = ['Fondations','Intermédiaire','Avancé'];

  // Points travaillés, évalués dans le questionnaire.
  const items = {
    weakHand:{area:'handle',label:'Dribbler de la main faible'},
    eyesUp:{area:'handle',label:'Dribbler sans regarder la balle'},
    pressure:{area:'handle',label:'Garder la balle sous pression'},
    moves:{area:'handle',label:'Enchaîner crossover, entre les jambes, dans le dos'},
    speedDribble:{area:'handle',label:'Dribbler vite en transition'},
    catchTwo:{area:'coordination',label:'Attraper une passe en mouvement, à droite comme à gauche'},
    coneHands:{area:'coordination',label:'Contourner un plot en changeant de main au bon moment'},
    feetHands:{area:'coordination',label:'Coordonner les pieds et le dribble sans regarder'},
    catchShoot:{area:'shoot',label:'Catch & shoot seul, pieds prêts'},
    pullup:{area:'shoot',label:'Tir après dribble (pull-up)'},
    freeThrow:{area:'shoot',label:'Lancers francs'},
    range:{area:'shoot',label:'Tir à 3 points'},
    onMove:{area:'shoot',label:'Tir en mouvement, en sortie de déplacement'},
    weakFinish:{area:'finish',label:'Finir de la main faible'},
    contactFinish:{area:'finish',label:'Finir au contact'},
    floater:{area:'finish',label:'Floater, tir en extension'},
    footFinish:{area:'finish',label:'Euro-step, pas de côté au cercle'},
    explosive:{area:'finish',label:'Attaquer le cercle vite et haut'},
    tripleThreat:{area:'footwork',label:'Triple menace : jab, feinte, attaque'},
    stops:{area:'footwork',label:'Arrêts et pivots propres'},
    onBall:{area:'defense',label:'Rester devant mon joueur'},
    closeout:{area:'defense',label:'Closeout sans me faire déborder'},
    helpD:{area:'defense',label:'Aider puis revenir sur mon joueur'},
    boxout:{area:'defense',label:'Box-out et rebond'},
    readFoot:{area:'moves',label:'Lire le pied avant ou la main du défenseur'},
    counter:{area:'moves',label:'Enchaîner un contre quand mon move est lu'},
    combos:{area:'moves',label:'Hesi, jab, in-and-out en vitesse'}
  };
  const ratings = [[0,'Difficile'],[1,'Correct'],[2,'Point fort']];

  // Exercices. needs : ball toujours, hoop quand il faut un panier. impact : sauts répétés (charge des jambes).
  // measure 'shots' : réussis / tentés ; seconds sert à estimer la durée (≈ 6 s par tir).
  const D = (id,name,area,tier,tags,needs,instructions,o={}) => ({id,name,kind:'skill',pattern:area,area,tier,tags,needs,instructions,
    regions:o.regions||(area==='handle'?['wrist']:area==='shoot'?['wrist','elbow','shoulder']:['ankle','knee','wrist']),
    level:tier,impact:!!o.impact,measure:o.measure||'reps',sets:o.sets||3,min:o.min||8,max:o.max||12,rest:o.rest||30,seconds:o.seconds||30,
    weighted:false,unilateral:!!o.unilateral,style:o.style||null,cuts:!!o.cuts,transfer:o.transfer||null,cues:o.cues||null,source:o.source||null,intense:!!o.intense});
  const H = ['ball'], HH = ['ball','hoop'], HC = ['ball','court'];
  const shots = (sets,n,o={}) => ({measure:'shots',sets,min:n,max:n,seconds:n*6,rest:o.rest||30,...o});

  const drills = [
    // Maniement — paliers 1 à 3.
    D('sk-pound','Dribbles appuyés, une main','handle',1,['weakHand','eyesUp'],H,['Genoux fléchis, balle à hauteur de genou.','Dribble fort, une main, 30 secondes.','Change de main, tête haute.'],{measure:'seconds',seconds:30,unilateral:true,rest:20}),
    D('sk-100','100 dribbles par main','handle',1,['weakHand','eyesUp'],H,['Cent dribbles main droite, puis cent main gauche.','Balle sous la hanche, tête haute.','Recommence si la balle t’échappe.'],{measure:'seconds',seconds:60,unilateral:true,sets:2,rest:20}),
    D('sk-low-fast','Dribbles bas et rapides','handle',1,['speedDribble','weakHand'],H,['Balle sous le genou, doigts écartés.','Le plus vite possible sans perdre le contrôle.','Alterne les mains toutes les 10 secondes.'],{measure:'seconds',seconds:30,rest:20}),
    D('sk-cross-stand','Crossovers sur place','handle',1,['moves','weakHand'],H,['Pieds écartés, balle basse devant toi.','Passe d’une main à l’autre sous le genou.','Garde la tête haute.'],{min:20,max:30,rest:20}),
    D('sk-eyes-up','Dribble tête haute, compter les doigts','handle',1,['eyesUp'],H,['Fixe un point au mur, un partenaire lève des doigts.','Dribble et annonce le chiffre sans baisser les yeux.','Seul : lis des numéros collés au mur.'],{measure:'seconds',seconds:30,rest:20}),
    D('sk-figure8','Huit autour des jambes','handle',1,['moves'],H,['Pieds écartés, buste penché.','Fais passer la balle en huit autour des jambes.','Accélère sans la laisser tomber.'],{measure:'seconds',seconds:30,rest:20}),
    D('sk-btl-stand','Entre les jambes sur place','handle',2,['moves','weakHand'],H,['Pied avant décalé, balle basse.','Passe entre les jambes, change de pied avant.','Garde le rythme, tête haute.'],{min:16,max:24,rest:25}),
    D('sk-btb-stand','Dans le dos sur place','handle',2,['moves'],H,['Balle à côté de la hanche.','Enroule la balle dans le dos vers l’autre main.','Main de réception basse, prête à dribbler.'],{min:16,max:24,rest:25}),
    D('sk-combo','Combo crossover, entre les jambes, dans le dos','handle',2,['moves','eyesUp'],H,['Enchaîne les trois changements de main.','Un dribble entre chaque geste.','Tête haute, accélère sur la fin.'],{min:10,max:15,rest:30}),
    D('sk-weak-court','Main faible en déplacement','handle',2,['weakHand','speedDribble'],HC,['Traverse le terrain uniquement main faible.','Aller en marche rapide, retour en courant.','Balle à hauteur de hanche.'],{measure:'seconds',seconds:40,rest:30,cuts:true,regions:['wrist','ankle','knee']}),
    D('sk-tennis','Dribble et balle de tennis','handle',2,['eyesUp','pressure'],H,['Dribble d’une main, balle de tennis dans l’autre.','Lance la balle de tennis et rattrape-la.','Le dribble ne s’arrête jamais.'],{measure:'seconds',seconds:30,rest:25,style:'Kyrie Irving'}),
    D('sk-pressure','Dribble sous pression','handle',2,['pressure'],H,['Un partenaire tente de toucher la balle, ou une serviette.','Protège avec le corps et l’avant-bras libre.','Garde le dribble vivant 30 secondes.'],{measure:'seconds',seconds:30,rest:30}),
    D('sk-hesi-cross','Hésitation puis crossover','handle',3,['moves','speedDribble'],HC,['Attaque, freine en levant le buste.','Explose avec un crossover bas.','Cinq fois chaque côté.'],{min:5,max:5,unilateral:true,rest:40,cuts:true,regions:['wrist','ankle','knee'],style:'Kyrie Irving'}),
    D('sk-snatch','Snatch-back pour créer l’espace','handle',3,['moves','pressure'],HC,['Attaque deux dribbles.','Ramène la balle d’un dribble arrière en reculant.','Finis équilibré, prêt à tirer.'],{min:6,max:8,rest:40,cuts:true,regions:['wrist','ankle','knee']}),
    D('sk-spin','Spin move en sortie','handle',3,['moves'],HC,['Attaque un plot.','Pivote sur le pied avant, balle collée à la hanche.','Ressors vite de l’autre côté.'],{min:6,max:8,rest:40,cuts:true,regions:['wrist','ankle','knee']}),
    D('sk-zigzag','Zigzag tout terrain','handle',3,['speedDribble','moves','pressure'],HC,['Traverse en zigzag d’un côté à l’autre.','Change de main à chaque changement de direction.','Varie : crossover, entre les jambes, dans le dos.'],{measure:'seconds',seconds:45,rest:40,cuts:true,regions:['wrist','ankle','knee'],style:'Kyrie Irving'}),
    // Coordination & réception : les bases qui manquent souvent après une longue pause. Un plot peut être une bouteille ou une chaussure.
    D('co-wall-catch','Passes au mur, réception deux mains','coordination',1,['catchTwo'],H,['À deux mètres d’un mur, passe à deux mains, poitrine.','Attrape mains ouvertes en « W », pouces presque joints, coudes souples.','Ramène tout de suite la balle en triple menace.'],{measure:'seconds',seconds:40,rest:20,transfer:'Ne plus perdre les passes faciles.',cues:['Mains prêtes avant la balle','Yeux sur la balle jusqu’aux mains']}),
    D('co-one-hand-catch','Passes au mur à une main','coordination',1,['catchTwo'],H,['Passe au mur d’une main, rattrape de la même main.','Dix de la main droite, dix de la main gauche.','La main recule avec la balle pour l’amortir.'],{min:10,max:15,unilateral:true,rest:20,transfer:'Une main faible qui sécurise la balle.',cues:['Amortir, pas taper','Main faible en premier']}),
    D('co-toss-catch','Lancer et rattraper en marchant','coordination',1,['catchTwo','feetHands'],H,['Marche en lançant la balle juste au-dessus de la tête.','Rattrape à deux mains sans t’arrêter de marcher.','Puis main droite seule, puis main gauche seule.'],{measure:'seconds',seconds:40,rest:20,transfer:'Les mains qui suivent pendant que les pieds avancent.',cues:['Balle pas plus haut que la tête','Les pieds ne s’arrêtent pas']}),
    D('co-cone-walk','Tour du plot en marchant, main extérieure','coordination',1,['coneHands','weakHand'],HC,['Pose un plot (ou une bouteille).','Tourne autour en dribblant de la main la plus éloignée du plot.','Change de sens et change de main. Marche, tête haute.'],{measure:'seconds',seconds:40,rest:20,transfer:'Protéger la balle du défenseur avec le corps.',cues:['Main loin du plot','Corps entre le plot et la balle']}),
    D('co-line-dribble','Pas autour d’une ligne en dribblant','coordination',1,['feetHands'],HC,['Une ligne au sol.','Petits pas de part et d’autre, dribble main droite.','Change de main à chaque aller-retour, sans regarder tes pieds.'],{measure:'seconds',seconds:30,rest:20,transfer:'Dribbler sans penser à ses appuis.',cues:['Tête haute','Petits appuis rapides']}),
    D('co-catch-move','Réception en mouvement des deux côtés','coordination',2,['catchTwo'],HC,['Lance la balle contre le mur en te déplaçant en pas chassés.','Attrape en appui 1-2, côté droit puis côté gauche.','Enchaîne un dribble de la main extérieure.'],{min:8,max:10,unilateral:true,rest:30,cuts:true,regions:['wrist','ankle','knee'],transfer:'Recevoir une passe en sortie de coupe et partir tout de suite.',cues:['Pieds qui arrivent sous la balle','Main extérieure au départ']}),
    D('co-cone-cross','Plot : crossover au bon moment','coordination',2,['coneHands','moves'],HC,['Dribble vers un plot main droite.','À un pas du plot, crossover bas vers la main gauche.','Passe le plot côté gauche et accélère deux dribbles. Puis l’inverse.'],{min:6,max:8,unilateral:true,rest:30,cuts:true,regions:['wrist','ankle','knee'],transfer:'Changer de main juste avant le défenseur, pas trop tôt.',cues:['Un pas avant le plot','Crossover sous le genou']}),
    D('co-slalom','Slalom de plots, main extérieure','coordination',2,['coneHands','speedDribble'],HC,['Quatre plots espacés de deux mètres.','Toujours la main extérieure : change de main entre deux plots.','Aller en trottinant, retour plus vite.'],{measure:'seconds',seconds:40,rest:30,cuts:true,regions:['wrist','ankle','knee'],transfer:'Traverser le trafic sans perdre la balle.',cues:['Main extérieure','Balle basse au plot']}),
    D('co-catch-turn','Réception, pivot et départ main opposée','coordination',2,['catchTwo','coneHands'],HC,['Lance-toi la balle et attrape-la en arrêt deux temps.','Pivote vers le plot.','Pars main la plus éloignée du plot et contourne-le.'],{min:6,max:8,rest:30,cuts:true,regions:['wrist','ankle','knee'],transfer:'Attraper, faire face, attaquer du bon côté.',cues:['Arrêt équilibré','Premier dribble main extérieure']}),
    D('co-figure8-cones','Huit autour de deux plots en vitesse','coordination',3,['coneHands','speedDribble'],HC,['Deux plots à trois mètres.','Fais des huit en dribble, main extérieure à chaque plot.','Accélère à chaque sortie de plot.'],{measure:'seconds',seconds:40,rest:40,cuts:true,regions:['wrist','ankle','knee'],transfer:'Changer de main en vitesse sans ralentir.',cues:['Épaule basse au plot','Accélère en sortie']}),
    D('co-pass-attack','Passe au mur, réception et attaque du plot','coordination',3,['catchTwo','coneHands'],HC,['Passe au mur en courant.','Réception en mouvement, sans arrêter les pieds.','Main extérieure, contourne le plot, finis en arrêt deux temps.'],{min:6,max:8,unilateral:true,rest:40,cuts:true,regions:['wrist','ankle','knee'],transfer:'Recevoir en course et attaquer le bon côté.',cues:['Mains prêtes avant la balle','Pas d’arrêt avant le plot']}),
    D('co-reaction-catch','Réception sur signal','coordination',3,['catchTwo'],H,['Un partenaire lance la balle à droite ou à gauche, au hasard.','Attrape d’une main ou des deux, ramène en triple menace.','Seul : lance-la de biais contre un mur irrégulier.'],{min:10,max:12,rest:30,regions:['wrist','ankle'],transfer:'Les mains qui réagissent aux mauvaises passes.',cues:['Mains ouvertes, coudes souples','Triple menace tout de suite']}),
    // Tir — avec panier.
    D('sk-form','Tir de forme près du cercle','shoot',1,['catchShoot','freeThrow'],HH,['À un mètre du cercle, une main.','Coude sous la balle, poignet cassé en fin de geste.','Cinq réussis de suite avant de reculer.'],shots(5,5,{style:'Stephen Curry'})),
    D('sk-ft','Lancers francs','shoot',1,['freeThrow'],HH,['Toujours la même routine avant le tir.','Respire, fixe l’arrière du cercle.','Note chaque série de 10.'],shots(2,10,{rest:20})),
    D('sk-catch-mid','Catch & shoot mi-distance','shoot',1,['catchShoot'],HH,['Lance-toi la balle avec effet, attrape en 1-2.','Pieds prêts avant la balle, monte direct.','Cinq positions, cinq tirs chacune.'],shots(5,5)),
    D('sk-catch-3','Catch & shoot à 3 points','shoot',2,['catchShoot','range'],HH,['Même routine qu’à mi-distance, derrière la ligne.','La force vient des jambes, pas des bras.','Cinq positions, cinq tirs chacune.'],shots(5,5,{style:'Stephen Curry'})),
    D('sk-pullup1','Pull-up après un dribble','shoot',2,['pullup'],HH,['Un dribble fort vers la droite ou la gauche.','Ramasse la balle en arrêt deux temps.','Monte équilibré, épaules face au cercle.'],shots(4,5)),
    D('sk-relocate','Tir en sortie de déplacement','shoot',2,['onMove','catchShoot'],HH,['Passe-toi la balle, cours vers un autre spot.','Reçois en sautillant, pieds face au cercle.','Tire dans le rythme.'],shots(4,5,{regions:['wrist','elbow','shoulder','ankle']})),
    D('sk-ft-tired','Lancers francs fatigué','shoot',2,['freeThrow'],HH,['Sprint aller-retour sur le terrain.','Enchaîne deux lancers francs, même routine.','Recommence cinq fois.'],shots(5,2,{rest:15,regions:['wrist','elbow','shoulder','knee','ankle'],cuts:true})),
    D('sk-stepback','Step-back à 3 points','shoot',3,['pullup','range'],HH,['Attaque un dribble, freine sur le pied d’appel.','Recule d’un grand pas, retombe équilibré.','Tire sans dériver vers l’arrière.'],shots(4,5,{style:'Stephen Curry',regions:['wrist','elbow','shoulder','knee','ankle'],cuts:true})),
    D('sk-sidestep','Side-step à 3 points','shoot',3,['pullup','range','onMove'],HH,['Dribble vers un côté.','Pas chassé latéral hors de la ligne de défense.','Tire en restant compact.'],shots(4,5,{regions:['wrist','elbow','shoulder','knee','ankle'],cuts:true})),
    D('sk-around3','Tour du monde à 3 points','shoot',3,['range','catchShoot'],HH,['Cinq positions de corner à corner.','Avance seulement après deux réussis.','Note le nombre de tirs pour finir.'],shots(1,25,{rest:60,style:'Stephen Curry'})),
    D('sk-pullup-speed','Pull-ups vitesse match','shoot',3,['pullup','onMove'],HH,['Pars du milieu de terrain en dribble rapide.','Freine en deux temps à mi-distance.','Monte sans perdre l’équilibre.'],shots(4,5,{regions:['wrist','elbow','shoulder','knee','ankle'],cuts:true})),
    // Tir — sans panier.
    D('sk-lying-form','Tir de forme allongé','shoot',1,['catchShoot','freeThrow'],H,['Allongé sur le dos, balle dans la main de tir.','Tire droit vers le plafond, rattrape.','Coude aligné, poignet cassé.'],{min:20,max:25,rest:20}),
    D('sk-wall-shot','Tir contre le mur','shoot',1,['catchShoot'],H,['Vise un point haut sur un mur, une main.','Rotation arrière sur la balle.','Rattrape et recommence sans regarder tes pieds.'],{min:20,max:30,rest:20}),
    // Finition — avec panier.
    D('sk-mikan','Mikan drill','finish',1,['weakFinish'],HH,['Sous le panier, lay-up main droite, côté droit.','Rattrape, lay-up main gauche, côté gauche.','Rythme continu, sans dribble.'],{measure:'seconds',seconds:45,rest:30,impact:true}),
    D('sk-mikan-rev','Mikan inversé','finish',1,['weakFinish'],HH,['Comme le Mikan, mais en reverse.','Main extérieure, utilise le cercle pour te protéger.','Rythme continu.'],{measure:'seconds',seconds:45,rest:30,impact:true}),
    D('sk-layup2','Lay-ups des deux mains','finish',1,['weakFinish'],HH,['Départ à la ligne des lancers, un dribble.','Main droite à droite, main gauche à gauche.','Genou opposé qui monte.'],{min:6,max:8,unilateral:true,rest:30,impact:true}),
    D('sk-euro','Euro-step','finish',2,['footFinish'],HH,['Attaque, premier pas d’un côté.','Deuxième pas large de l’autre côté.','Protège la balle, finis haut.'],{min:6,max:8,unilateral:true,rest:40,impact:true,cuts:true}),
    D('sk-floater','Floater','finish',2,['floater'],HH,['Attaque, décolle tôt sur un pied.','Balle haute, lâchée en cloche du bout des doigts.','Cinq de chaque côté.'],shots(3,5,{impact:true,regions:['ankle','knee','wrist']})),
    D('sk-power','Lay-up en force, deux pieds','finish',2,['contactFinish'],HH,['Arrêt deux pieds sous le cercle.','Balle protégée sous le menton.','Monte fort, épaules carrées.'],{min:6,max:8,rest:40,impact:true}),
    D('sk-weak-finish','Finitions main faible','finish',2,['weakFinish'],HH,['Toutes les finitions de la main faible.','Lay-up, reverse, puis floater.','Note les réussis sur 10.'],shots(3,10,{impact:true,regions:['ankle','knee','wrist']})),
    D('sk-rose','Finition explosive en un temps','finish',3,['explosive','footFinish'],HH,['Attaque à pleine vitesse depuis le milieu.','Dernier appui court, décolle vers le cercle.','Finis haut, main extérieure.'],{min:4,max:6,unilateral:true,rest:60,impact:true,cuts:true,style:'Derrick Rose'}),
    D('sk-reverse','Reverse lay-up','finish',3,['weakFinish','footFinish'],HH,['Attaque la ligne de fond.','Passe sous le cercle, finis de l’autre côté.','Main extérieure, effet sur la planche.'],{min:6,max:8,unilateral:true,rest:40,impact:true,cuts:true}),
    D('sk-contact','Finition au contact','finish',3,['contactFinish','explosive'],HH,['Un partenaire te bouscule avec un coussin.','Encaisse, garde la balle haute.','Finis malgré le contact.'],{min:6,max:8,rest:45,impact:true,regions:['ankle','knee','wrist','shoulder']}),
    // Finition — sans panier.
    D('sk-finish-feet','Appuis de finition sans panier','finish',1,['footFinish'],HC,['Euro-step, hop step et pas de côté, balle en main.','Lentement, puis à vitesse de match.','Termine chaque appui équilibré.'],{min:6,max:8,unilateral:true,rest:30,cuts:true}),
    // Jeu de jambes avec ballon.
    D('sk-jab','Jab step et attaque','footwork',1,['tripleThreat'],H,['Triple menace, pied de pivot fixe.','Jab court, regarde la réaction, attaque.','Alterne jab-tir et jab-drive.'],{min:8,max:10,rest:30}),
    D('sk-pivots','Pivots avant et arrière','footwork',1,['stops'],H,['Balle protégée sous le menton.','Pivot avant, pivot arrière, sans décoller le pied.','Change de pied de pivot.'],{min:10,max:12,rest:20}),
    D('sk-jump-stop','Arrêts deux temps et sauté','footwork',2,['stops'],HC,['Dribble, arrêt sauté sur deux pieds.','Puis arrêt deux temps, pied intérieur d’abord.','Équilibré, prêt à tirer ou pivoter.'],{min:8,max:10,rest:30,cuts:true}),
    D('sk-shot-fake','Feinte de tir et drive','footwork',2,['tripleThreat'],HC,['Feinte crédible : balle et yeux montent.','Les jambes restent fléchies.','Un grand premier pas, deux dribbles.'],{min:8,max:10,rest:30,cuts:true}),
    D('sk-rip','Rip-through et attaque','footwork',3,['tripleThreat','pressure'],HC,['Balle balayée bas d’une hanche à l’autre.','Attaque côté opposé en un dribble.','Épaule devant pour protéger.'],{min:6,max:8,rest:40,cuts:true}),
    // Lot 13 · drills supplémentaires, fiches écrites pour l'app. transfer : l'action de match travaillée ; cues : points clés.
    // Maniement.
    D('sk-pound-cross','Dribble appuyé puis crossover','handle',1,['weakHand','moves'],H,['Trois dribbles appuyés main droite.','Crossover bas, trois dribbles main gauche.','Tête haute, rythme régulier.'],{measure:'seconds',seconds:30,rest:20,transfer:'Changer de main sans perdre la force du dribble.',cues:['Balle sous le genou au crossover','Main qui recouvre la balle']}),
    D('sk-in-out','In-and-out','handle',2,['moves'],H,['Dribble d’une main devant toi.','Fais rentrer la balle puis ressortir, même main.','Le buste feinte le changement de main.'],{min:10,max:15,unilateral:true,rest:25,transfer:'Faire bouger le défenseur sans changer de main.',cues:['Main sur le côté de la balle','Épaules qui vendent la feinte']}),
    D('sk-hesi','Hésitation en avançant','handle',2,['moves','speedDribble'],HC,['Avance en dribble à mi-vitesse.','Ralentis, buste qui se relève, balle haute.','Réaccélère d’un coup sur le pied avant.'],{min:6,max:8,rest:30,cuts:true,regions:['wrist','ankle','knee'],transfer:'Figer le défenseur avant de le passer.',cues:['Changement de vitesse net','Regard vers le cercle']}),
    D('sk-retreat','Dribble de recul','handle',2,['pressure'],HC,['Attaque deux dribbles.','Recule de deux pas chassés, balle protégée.','Repars en attaque.'],{min:6,max:8,rest:30,cuts:true,regions:['wrist','ankle','knee'],transfer:'Sortir d’un piège ou d’une prise à deux.',cues:['Épaule devant la balle','Reste bas en reculant']}),
    D('sk-change-pace','Changements de rythme','handle',2,['speedDribble','moves'],HC,['Traverse le terrain en dribble.','Alterne lent, arrêt, explosion, sur ton propre signal.','Main faible au retour.'],{measure:'seconds',seconds:40,rest:30,cuts:true,regions:['wrist','ankle','knee'],transfer:'Gagner un pas grâce au rythme, pas à la vitesse.',cues:['Lent puis très vite','Pas de pause sur l’explosion']}),
    D('sk-two-ball','Deux ballons en même temps','handle',2,['weakHand','eyesUp'],H,['Un ballon dans chaque main.','Dribbles simultanés, même hauteur.','Trente secondes, tête haute.'],{measure:'seconds',seconds:30,rest:20,transfer:'La main faible rattrape la main forte.',cues:['Les deux balles touchent le sol ensemble','Regard droit devant']}),
    D('sk-two-ball-alt','Deux ballons alternés','handle',2,['weakHand','eyesUp'],H,['Un ballon dans chaque main.','Dribbles alternés, comme des pistons.','Accélère sans perdre le rythme.'],{measure:'seconds',seconds:30,rest:20,transfer:'Coordination et contrôle sans regarder la balle.',cues:['Rythme régulier','Balles sous la hanche']}),
    D('sk-tight-combos','Combos en espace réduit','handle',3,['moves','pressure'],H,['Reste dans un carré d’un mètre.','Enchaîne crossover, entre les jambes, dans le dos.','Pieds actifs, balle jamais au-dessus du genou.'],{measure:'seconds',seconds:30,rest:30,transfer:'Créer avec le dribble dans une raquette chargée.',cues:['Gestes courts','Pieds toujours en mouvement']}),
    D('sk-attack-foot','Attaque le pied avant','handle',3,['moves','speedDribble'],HC,['Un plot figure le pied avant du défenseur.','Déborde du côté de ce pied, en un dribble.','Épaule basse, passe près du plot.'],{min:6,max:8,unilateral:true,rest:40,cuts:true,regions:['wrist','ankle','knee'],transfer:'Battre le défenseur du côté où il ne peut pas pivoter.',cues:['Premier pas près du plot','Épaule qui protège la balle']}),
    // Tir.
    D('sk-one-motion','Tir en un seul mouvement','shoot',1,['catchShoot'],HH,['À trois mètres, prise de balle à la hanche.','La balle monte sans pause jusqu’au lâcher.','Jambes et bras ensemble.'],shots(4,5,{transfer:'Un tir plus rapide, plus dur à contrer.',cues:['Pas d’arrêt au front','Jambes qui donnent le tempo']})),
    D('sk-feet-into-shot','Appuis vers le tir','shoot',2,['onMove','catchShoot'],HH,['Pars de l’aile, viens vers la balle.','Réception en 1-2, pieds face au cercle.','Tire dans le rythme.'],shots(4,5,{regions:['wrist','elbow','shoulder','ankle'],transfer:'Être prêt à tirer dès la réception.',cues:['Mains prêtes avant la balle','Pied intérieur en premier']})),
    D('sk-hop-12','Réception sautée ou 1-2','shoot',1,['catchShoot'],HH,['Lance-toi la balle devant toi.','Réception sautée deux pieds, tir.','Puis réception 1-2, tir. Compare.'],shots(4,5,{transfer:'Choisir sa réception selon la passe.',cues:['Genoux fléchis à l’atterrissage','Épaules face au cercle']})),
    D('sk-hang-pullup','Pull-up après dribble suspendu','shoot',3,['pullup'],HH,['Attaque, dribble suspendu sur place.','Ramasse sur le dernier dribble, monte.','Cinq de chaque côté.'],shots(4,5,{regions:['wrist','elbow','shoulder','knee','ankle'],cuts:true,transfer:'Tirer quand le défenseur attend le drive.',cues:['Balle haute au ramassé','Monte droit']})),
    D('sk-fake-pullup','Feinte, un dribble, pull-up','shoot',2,['pullup'],HH,['Réception, feinte de tir crédible.','Un dribble de côté.','Pull-up équilibré.'],shots(4,5,{regions:['wrist','elbow','shoulder','knee','ankle'],cuts:true,transfer:'Punir le closeout qui saute.',cues:['Feinte avec les yeux','Dribble large et bas']})),
    D('sk-fadeaway','Fadeaway','shoot',3,['pullup','range'],HH,['Dos au panier, pivote sur le pied d’appui.','Saute légèrement en arrière, balle haute.','Atterris équilibré.'],shots(3,5,{regions:['wrist','elbow','shoulder','knee','ankle','back'],transfer:'Tirer malgré un défenseur plus grand.',cues:['Recul léger, pas exagéré','Coude au-dessus des yeux']})),
    D('sk-5-spots','5 spots, 3 d’affilée','shoot',2,['catchShoot','range'],HH,['Cinq positions autour de la raquette.','Reste sur un spot jusqu’à trois réussis d’affilée.','Note le nombre total de tirs.'],shots(1,25,{rest:60,transfer:'Tirer sous la pression du résultat.',cues:['Même routine à chaque tir','Respire après un raté']})),
    D('sk-1min','Une minute de tir','shoot',2,['catchShoot','onMove'],HH,['Chronomètre une minute.','Tire, récupère, change de spot, recommence.','Note les réussis.'],shots(3,10,{rest:60,regions:['wrist','elbow','shoulder','ankle'],transfer:'Tirer juste malgré le souffle.',cues:['Pieds prêts avant la balle','Pas de tir précipité']})),
    D('sk-dry-shot','Tir à blanc','shoot',1,['catchShoot'],H,['Sans panier, devant un mur ou un miroir.','Appuis, montée, lâcher, pose figée.','Vérifie l’alignement pied, genou, coude.'],{min:20,max:25,rest:20,transfer:'Fixer le geste les jours sans panier.',cues:['Pose finale tenue 2 s','Coude sous la balle']}),
    // Finition.
    D('sk-pro-hop','Pro hop et finition','finish',2,['footFinish','contactFinish'],HH,['Attaque d’un dribble.','Saut d’un pied sur deux pieds.','Monte fort, deux mains, épaules carrées.'],{min:6,max:8,rest:40,impact:true,transfer:'Changer d’angle et finir équilibré au contact.',cues:['Saut court, pas long','Balle protégée sous le menton'],regions:['ankle','knee','wrist']}),
    D('sk-inside-hand','Finition main intérieure','finish',3,['weakFinish','footFinish'],HH,['Attaque côté droit.','Finis de la main gauche, côté intérieur.','Effet sur la planche.'],{min:6,max:8,unilateral:true,rest:40,impact:true,transfer:'Éviter le contreur qui arrive du côté de la main forte.',cues:['Balle loin du contreur','Planche haute']}),
    D('sk-reverse-pivot','Reverse pivot et lay-up','finish',3,['footFinish'],HH,['Attaque, arrêt deux temps.','Pivot arrière dos au défenseur.','Finis de l’autre côté.'],{min:6,max:8,rest:40,impact:true,cuts:true,transfer:'Se dégager d’un défenseur collé en drive.',cues:['Balle collée au corps','Épaule qui protège']}),
    D('sk-up-under','Up-and-under','finish',2,['footFinish','contactFinish'],HH,['Arrêt deux pieds sous le cercle.','Feinte de tir haute.','Pas croisé sous le défenseur, finis.'],{min:6,max:8,rest:40,impact:true,transfer:'Finir quand le défenseur saute sur la feinte.',cues:['Feinte crédible','Pied de pivot fixe']}),
    D('sk-same-foot','Lay-up pied et main du même côté','finish',2,['footFinish','weakFinish'],HH,['Attaque côté droit.','Décolle du pied droit, finis main droite.','Puis côté gauche.'],{min:6,max:8,unilateral:true,rest:40,impact:true,transfer:'Surprendre le contreur qui attend le rythme classique.',cues:['Timing décalé','Corps entre balle et défenseur']}),
    D('sk-euro-counter','Euro-step contré','finish',3,['footFinish'],HH,['Premier pas d’euro vers la gauche.','Ramène vers la droite au deuxième pas.','Finis main forte.'],{min:6,max:8,rest:40,impact:true,cuts:true,transfer:'Contrer le défenseur qui lit l’euro-step.',cues:['Premier pas vendu','Deuxième pas court']}),
    D('sk-floater-1','Floater en un temps','finish',3,['floater'],HH,['Attaque à pleine vitesse.','Décolle dès le premier appui, sans ralentir.','Lâcher haut en cloche.'],shots(3,5,{impact:true,regions:['ankle','knee','wrist'],transfer:'Finir avant que l’aide intérieure n’arrive.',cues:['Décollage précoce','Bras tendu vers le haut']})),
    // Appuis.
    D('sk-jab-series','Série de jabs','footwork',2,['tripleThreat'],HH,['Jab-tir, jab-drive, jab-crossover.','Pied de pivot fixe.','Tire ou finis à chaque fin de série.'],{min:6,max:8,rest:30,transfer:'Lire le défenseur depuis la triple menace.',cues:['Jab court','Épaules basses']}),
    D('sk-rip-cross','Rip-through puis pas croisé','footwork',3,['tripleThreat','pressure'],HC,['Balle balayée bas.','Pas croisé devant le défenseur.','Attaque en un dribble.'],{min:6,max:8,rest:40,cuts:true,transfer:'Attaquer un défenseur collé sans dribble préalable.',cues:['Balle sous les genoux','Pas croisé long']}),
    D('sk-face-up','Attraper et faire face','footwork',1,['tripleThreat','stops'],H,['Reçois la balle, dos au panier imaginaire.','Pivote pour faire face.','Triple menace immédiate.'],{min:8,max:10,rest:20,transfer:'Être une menace dès la réception.',cues:['Balle à la hanche','Regard vers le cercle']}),
    D('sk-pivot-shot','Pivot puis tir','footwork',2,['stops','tripleThreat'],HH,['Arrêt deux temps à mi-distance.','Pivot avant ou arrière.','Tir équilibré.'],shots(3,5,{transfer:'Créer un tir après l’arrêt.',cues:['Pivot sur l’avant du pied','Équilibre avant de monter']})),
    // Défense.
    D('df-stance','Posture défensive tenue','defense',1,['onBall'],['court'],['Pieds plus larges que les épaules, assis bas.','Mains actives, poids sur l’avant du pied.','Tiens, puis petits sautillés sur place.'],{measure:'seconds',seconds:30,rest:20,regions:['knee','hip','ankle'],transfer:'Rester devant son joueur dès le premier dribble.',cues:['Dos droit','Talons légers'],style:null}),
    D('df-slide','Glissés et freinage','defense',1,['onBall'],['court'],['Glisse sur trois mètres.','Freine du pied extérieur.','Repars de l’autre côté.'],{measure:'seconds',seconds:20,rest:30,regions:['knee','hip','ankle'],cuts:true,transfer:'Couper la route du dribbleur.',cues:['Pieds jamais joints','Tête au même niveau']}),
    D('df-closeout','Closeout','defense',2,['closeout'],['court'],['Sprinte vers un plot à l’aile.','Petits pas rapides les deux derniers mètres.','Arrive bas, une main haute.'],{min:6,max:8,rest:30,cuts:true,regions:['knee','hip','ankle'],transfer:'Gêner le tir sans se faire déborder.',cues:['Freine avant d’arriver','Poids en arrière à l’arrivée']}),
    D('df-closeout-contest','Closeout et contestation','defense',3,['closeout'],['ball','hoop','court'],['Un partenaire reçoit et tire ou attaque.','Closeout, main sur la balle.','S’il attaque, glisse et reste devant.'],{min:6,max:8,rest:40,cuts:true,impact:true,regions:['knee','hip','ankle'],transfer:'Contester sans faute ni débordement.',cues:['Main haute, pas de saut','Réagis au premier dribble']}),
    D('df-slide-sprint','Glissé puis sprint','defense',2,['onBall'],['court'],['Glisse trois pas.','Le dribbleur te passe : pivote et sprinte.','Reprends la glissade devant le plot suivant.'],{min:4,max:6,rest:40,cuts:true,regions:['knee','hip','ankle'],transfer:'Récupérer quand tu es battu d’un pas.',cues:['Pivot de hanche','Sprint puis reprise basse']}),
    D('df-drop-step','Drop step défensif','defense',2,['onBall'],['court'],['Position défensive.','Ouvre la hanche vers l’arrière, pied qui recule.','Glisse dans la nouvelle direction.'],{min:6,max:8,unilateral:true,rest:30,cuts:true,regions:['knee','hip','ankle'],transfer:'Suivre le crossover sans croiser les pieds.',cues:['Pied qui recule en diagonale','Reste bas']}),
    D('df-help-recover','Aide et retour','defense',3,['helpD'],['court'],['Pars en position d’aide, au milieu de la raquette.','Sprinte vers le dribbleur, freine.','Reviens sur ton joueur en closeout.'],{min:5,max:6,rest:45,cuts:true,regions:['knee','hip','ankle'],transfer:'Aider sans laisser ton joueur seul.',cues:['Vois balle et joueur','Pas de saut en aide']}),
    D('df-mirror','Miroir','defense',2,['onBall'],['court'],['Un partenaire se déplace de côté librement.','Reste face à lui, à un bras.','Seul : suis une ligne en réagissant au son.'],{measure:'seconds',seconds:20,rest:40,cuts:true,regions:['knee','hip','ankle'],transfer:'Réagir aux appuis du porteur.',cues:['Regarde ses hanches','Pas courts']}),
    D('df-zigzag','Zigzag défensif tout terrain','defense',2,['onBall'],['court'],['Glisse en diagonale d’une ligne à l’autre.','Drop step à chaque changement.','Remonte tout le terrain.'],{measure:'seconds',seconds:40,rest:45,cuts:true,regions:['knee','hip','ankle'],transfer:'Ralentir le porteur sur tout le terrain.',cues:['Changement par la hanche','Bas tout du long']}),
    D('df-deny','Défense de passe et retour','defense',3,['helpD'],['court'],['Main dans la ligne de passe, de profil.','Le joueur coupe dos : suis-le.','Reviens en position de refus.'],{measure:'seconds',seconds:30,rest:40,cuts:true,regions:['knee','hip','ankle','shoulder'],transfer:'Empêcher la passe facile.',cues:['Vois balle et joueur','Bras tendu, paume vers la balle']}),
    D('df-hands','Mains actives','defense',1,['onBall'],['ball'],['Un partenaire tient la balle, toi en posture.','Touche la balle sans faute, main basse vers le haut.','Seul : balle de tennis lâchée devant toi.'],{min:10,max:15,rest:20,regions:['wrist','shoulder'],transfer:'Voler ou dévier sans faute.',cues:['Main de bas en haut','Pieds immobiles']}),
    D('df-box-out','Box-out et rebond','defense',2,['boxout'],['ball','hoop'],['Lance la balle contre la planche.','Pivote, dos à un joueur imaginaire, bloque.','Va chercher la balle à deux mains.'],{min:6,max:8,rest:30,impact:true,regions:['knee','hip','ankle','wrist'],transfer:'Gagner le rebond sans être le plus grand.',cues:['Contact d’abord, balle ensuite','Deux mains au sommet']}),
    // Moves & contres.
    D('mv-front-foot','Lis le pied avant','moves',1,['readFoot'],HC,['Un partenaire avance un pied au hasard.','Déborde côté pied avant, en un dribble.','Seul : plot posé au hasard.'],{min:6,max:8,rest:30,cuts:true,regions:['wrist','ankle','knee'],transfer:'Attaquer là où le défenseur ne peut pas suivre.',cues:['Lis avant de bouger','Premier pas près de son pied']}),
    D('mv-hesi-read','Hesi : tir ou crossover','moves',2,['counter','readFoot'],HH,['Hesi face au défenseur.','S’il recule : pull-up. S’il colle : crossover.','Seul : le partenaire montre la réponse.'],shots(3,5,{regions:['wrist','elbow','shoulder','knee','ankle'],cuts:true,transfer:'Choisir le bon move selon la réaction.',cues:['Regarde ses pieds pendant la hesi','Décision immédiate']})),
    D('mv-jab-cross','Jab puis crossover','moves',2,['counter','combos'],HC,['Jab à droite, le défenseur suit.','Crossover et attaque à gauche.','Deux dribbles maximum jusqu’au cercle.'],{min:6,max:8,rest:30,cuts:true,regions:['wrist','ankle','knee'],transfer:'Utiliser la feinte de pied pour ouvrir l’autre côté.',cues:['Jab crédible','Crossover bas et court']}),
    D('mv-spin-counter','Spin en contre','moves',3,['counter'],HC,['Attaque, le défenseur coupe ta route.','Spin sur le pied avant vers l’autre côté.','Finis ou passe.'],{min:6,max:8,rest:40,cuts:true,regions:['wrist','ankle','knee'],transfer:'Contrer le défenseur qui te ferme le chemin.',cues:['Balle collée à la hanche','Ressors vers le cercle']}),
    D('mv-double-cross','Crossover puis re-crossover','moves',3,['counter','combos'],HC,['Crossover d’attaque.','Le défenseur suit : re-crossover immédiat.','Attaque le côté libéré.'],{min:6,max:8,rest:40,cuts:true,regions:['wrist','ankle','knee'],transfer:'Battre le défenseur qui réagit vite.',cues:['Deuxième crossover plus bas','Pied d’appui qui pousse']}),
    D('mv-btl-retreat','Entre les jambes en recul puis attaque','moves',3,['counter','combos'],HC,['Recule d’un pas, entre les jambes.','Le défenseur se relâche : attaque.','Deux dribbles jusqu’au cercle.'],{min:6,max:8,rest:40,cuts:true,regions:['wrist','ankle','knee'],transfer:'Créer l’espace, puis l’exploiter.',cues:['Recul court','Explosion sur le premier pas']}),
    D('mv-fake-sidestep','Feinte de tir puis side-step','moves',3,['counter'],HH,['Feinte de tir crédible.','Le défenseur saute : side-step.','Tir équilibré.'],shots(3,5,{regions:['wrist','elbow','shoulder','knee','ankle'],cuts:true,transfer:'Punir le défenseur qui saute sur la feinte.',cues:['Jambes fléchies pendant la feinte','Pas latéral court']})),
    D('mv-in-out-cross','In-and-out puis crossover','moves',2,['combos'],HC,['In-and-out main droite.','Le défenseur bouge : crossover.','Attaque à gauche.'],{min:6,max:8,rest:30,cuts:true,regions:['wrist','ankle','knee'],transfer:'Deux feintes pour un seul vrai départ.',cues:['Épaules qui vendent','Crossover sous le genou']}),
    D('mv-snatch-cross','Snatch-back puis crossover','moves',3,['counter','combos'],HC,['Attaque, snatch-back pour reculer.','Le défenseur revient fort : crossover.','Attaque le côté libre.'],{min:6,max:8,rest:40,cuts:true,regions:['wrist','ankle','knee'],transfer:'Contrer le défenseur qui recolle vite.',cues:['Recul équilibré','Crossover dès qu’il avance']}),
    D('mv-drive-read','Drive : finir ou passer','moves',3,['counter','readFoot'],['ball','hoop','court'],['Attaque le cercle.','L’aide arrive : passe au coin. Sinon, finis.','Seul : un partenaire lève la main pour l’aide.'],{min:6,max:8,rest:40,impact:true,cuts:true,regions:['wrist','ankle','knee'],transfer:'Lire l’aide au lieu de forcer.',cues:['Regarde l’aide, pas le cercle','Passe à deux mains']}),
    // Lot 18 · intensité match : efforts courts et répétés, récupération courte, gestes de match sous fatigue.
    // intense : réservés à la séance « Intensité match » (matchSession), jamais tirés dans une séance skills ordinaire.
    D('mi-dribble-2010','Intervalles de dribble 20/10','handle',2,['speedDribble','moves','weakHand'],H,['20 s à fond : crossover, entre les jambes, dans le dos.','10 secondes de récupération, balle en main.','Huit fois : le rythme d’une possession sous pression.'],{measure:'seconds',seconds:20,sets:8,rest:10,intense:true,transfer:'Garder une balle propre quand le souffle part.',cues:['Tête haute même fatigué','Balle sous le genou']}),
    D('mi-full-court-attack','Contre-attaque en dribble tout terrain','handle',2,['speedDribble'],HC,['Dribble à pleine vitesse d’une ligne de fond à l’autre.','Crossover au milieu du terrain, sans ralentir.','Arrêt deux temps à la ligne des lancers, retour en trottinant.'],{min:4,max:6,rest:30,cuts:true,intense:true,regions:['wrist','ankle','knee'],transfer:'Pousser la balle en transition sans la perdre.',cues:['Balle devant toi, à hauteur de hanche','Arrêt équilibré malgré la vitesse']}),
    D('mi-cone-attack','Attaque de plots sous fatigue','handle',3,['moves','pressure'],HC,['Trois plots en ligne, quatre mètres d’écart.','À chaque plot, un move différent à vitesse de match.','30 secondes de travail, 30 de récupération.'],{measure:'seconds',seconds:30,sets:5,rest:30,cuts:true,intense:true,regions:['wrist','ankle','knee'],transfer:'Créer avec le dribble au 4e quart-temps.',cues:['Move court près du plot','Accélère en sortie']}),
    D('mi-sprint-shot','Sprint, catch & shoot','shoot',2,['catchShoot','onMove'],HH,['Sprint jusqu’au milieu du terrain et retour.','Lance-toi la balle, réception 1-2, tir à mi-distance ou à 3 points.','Cinq tirs par série, un sprint avant chaque tir.'],shots(4,5,{rest:45,cuts:true,intense:true,regions:['wrist','elbow','shoulder','knee','ankle'],transfer:'Tirer juste en sortie de course, comme en transition.',cues:['Pieds prêts avant la balle','Souffle une fois avant de monter']})),
    D('mi-1min-pullup','Minute folle : pull-ups','shoot',3,['pullup','onMove'],HH,['Une minute sans t’arrêter.','Attaque depuis la ligne à 3 points, un ou deux dribbles, pull-up.','Récupère, ressors au large, recommence. Compte les réussis.'],shots(3,10,{rest:60,cuts:true,intense:true,regions:['wrist','elbow','shoulder','knee','ankle'],transfer:'Créer son tir quand les jambes brûlent.',cues:['Arrêt deux temps propre','Monte droit, même fatigué']})),
    D('mi-3spot-race','Course aux trois spots','shoot',2,['catchShoot','onMove','range'],HH,['Corner, aile, haut de la raquette.','Un tir à chaque spot, sprint entre les spots, retour au corner.','Deux tours par série, note tes réussis.'],shots(4,6,{rest:45,cuts:true,intense:true,regions:['wrist','elbow','shoulder','knee','ankle'],transfer:'Se replacer vite et tirer dans le rythme.',cues:['Arrive face au cercle','Même routine à chaque tir']})),
    D('mi-closeout-shot','Closeout, glissés puis tir','shoot',2,['catchShoot'],HH,['Closeout sur un plot, trois glissés défensifs.','Sprint vers l’aile, réception et tir.','Défense puis attaque : une vraie possession.'],shots(4,4,{rest:40,cuts:true,intense:true,regions:['wrist','elbow','shoulder','knee','ankle','hip'],transfer:'Tirer juste après avoir défendu.',cues:['Bas en défense','Pieds prêts à la réception']})),
    D('mi-suicide-ft','Navettes et lancers francs','shoot',2,['freeThrow'],HH,['Navette : ligne des lancers, milieu, ligne opposée, retour.','Enchaîne deux lancers francs, même routine, une grande expiration avant.','Comme en fin de match.'],shots(5,2,{rest:30,cuts:true,intense:true,regions:['wrist','elbow','shoulder','knee','ankle'],transfer:'Mettre ses lancers quand le match se joue.',cues:['Une expiration, puis la routine','Fixe l’arrière du cercle']})),
    D('mi-transition-layups','Transition : lay-ups tout terrain','finish',2,['explosive','weakFinish'],HH,['Dribble d’un panier à l’autre, lay-up.','Reprends la balle, repars, lay-up de l’autre main.','Quarante secondes sans t’arrêter.'],{measure:'seconds',seconds:40,sets:4,rest:40,impact:true,cuts:true,intense:true,regions:['ankle','knee','wrist'],transfer:'Finir en contre-attaque à pleine vitesse.',cues:['Dernier appui court','Main extérieure']}),
    D('mi-mikan-sprint','Mikan puis sprint','finish',2,['weakFinish'],HH,['Vingt secondes de Mikan.','Sprint jusqu’à la ligne des lancers et retour, deux fois.','Encore vingt secondes de Mikan, mains douces malgré le souffle.'],{measure:'seconds',seconds:45,sets:4,rest:45,impact:true,cuts:true,intense:true,regions:['ankle','knee','wrist'],transfer:'Finir près du cercle en fin de possession.',cues:['Rythme régulier','Planche haute']}),
    D('mi-drive-kick','Navette puis drive au cercle','finish',3,['explosive','contactFinish'],HH,['Navette rapide jusqu’au milieu et retour.','Reçois au large, attaque en deux dribbles.','Finis fort au cercle, main extérieure.'],{min:5,max:6,rest:45,impact:true,cuts:true,intense:true,regions:['ankle','knee','wrist'],transfer:'Attaquer le cercle quand la défense est fatiguée.',cues:['Premier pas long','Épaule devant']}),
    D('mi-shell-slides','Possession défensive : glissés, closeout, rebond','defense',2,['onBall','closeout','boxout'],['ball','hoop','court'],['Glisse de la raquette au corner, closeout main haute.','Retour dans la raquette, box-out, rebond.','Ressors en dribble jusqu’au milieu : 30 secondes, comme une possession.'],{measure:'seconds',seconds:30,sets:5,rest:30,cuts:true,impact:true,intense:true,regions:['knee','hip','ankle','wrist'],transfer:'Tenir une possession défensive complète, puis relancer.',cues:['Bas tout du long','Contact avant la balle']})
  ];
  const byId = id => drills.find(d=>d.id===id)||null;

  // Questionnaire → palier de départ par domaine (1 à 3). Tests de tir facultatifs : ils corrigent le palier du tir.
  function blankProfile() {return {answers:{},tests:{},date:null};}
  function tierFromAnswers(answers,area) {
    const list=Object.entries(items).filter(([,v])=>v.area===area).map(([k])=>Number(answers[k])).filter(n=>[0,1,2].includes(n));
    if(!list.length) return 1;
    const avg=list.reduce((a,b)=>a+b,0)/list.length;
    return avg<0.7?1:avg<1.5?2:3;
  }
  // Repères personnels, pas des normes : 14/20 aux lancers et 13/25 à mi-distance correspondent à un niveau de club correct.
  function tierFromTests(t) {
    const ft=Number(t.freeThrows),spot=Number(t.spotShooting);
    const ratios=[ft>=0&&ft<=20&&t.freeThrows!==''&&t.freeThrows!=null?ft/20:null,spot>=0&&spot<=25&&t.spotShooting!==''&&t.spotShooting!=null?spot/25:null].filter(x=>x!==null);
    if(!ratios.length) return null;
    const r=ratios.reduce((a,b)=>a+b,0)/ratios.length;
    return r<0.5?1:r<0.68?2:3;
  }
  function initialLevels(profile) {
    const out={};Object.keys(areas).forEach(a=>out[a]=tierFromAnswers(profile.answers||{},a));
    const t=tierFromTests(profile.tests||{});if(t) out.shoot=t<out.shoot?t:Math.round((out.shoot+t)/2);
    return out;
  }
  // Priorités : les points notés « Difficile » d'abord, pondérés par le poste.
  const positionAreas = {meneur:{handle:2,shoot:1,moves:1},arriere:{shoot:2,handle:1,defense:1},ailier:{finish:1,shoot:1,footwork:1,defense:1},'ailier-fort':{finish:2,footwork:1,defense:1},pivot:{finish:2,footwork:2,defense:1}};
  function priorities(skills,player) {
    const answers=(skills&&skills.profile&&skills.profile.answers)||{},bonus=positionAreas[player&&player.position]||{};
    return Object.entries(items).map(([id,v])=>({id,area:v.area,label:v.label,score:(2-(answers[id]==null?1:Number(answers[id])))*2+(bonus[v.area]||0)}))
      .sort((a,b)=>b.score-a.score);
  }

  function blank() {return {profile:blankProfile(),levels:{handle:1,shoot:1,finish:1,footwork:1},program:null,log:[],hoopDate:null};}
  function validate(v) {
    const b=blank();
    if(!v||typeof v!=='object'||Array.isArray(v)) return b;
    const answers={};Object.entries((v.profile&&v.profile.answers)||{}).forEach(([k,n])=>{if(items[k]&&[0,1,2].includes(Number(n)))answers[k]=Number(n);});
    const tests={};['freeThrows','spotShooting'].forEach(k=>{const n=v.profile&&v.profile.tests&&v.profile.tests[k];if(n!==''&&n!=null&&Number(n)>=0&&Number(n)<=(k==='freeThrows'?20:25))tests[k]=Number(n);});
    const levels={};Object.keys(areas).forEach(a=>{const n=Number(v.levels&&v.levels[a]);levels[a]=[1,2,3].includes(n)?n:1;});
    const p=v.program;
    const program=p&&typeof p==='object'?{perWeek:[1,2,3,4].includes(Number(p.perWeek))?Number(p.perWeek):2,minutes:[30,45,60].includes(Number(p.minutes))?Number(p.minutes):45,blocks:p.blocks!==false,blockMinutes:[10,15,20].includes(Number(p.blockMinutes))?Number(p.blockMinutes):15,status:p.status==='paused'?'paused':'active',startDate:typeof p.startDate==='string'?p.startDate:today()}:null;
    const log=(Array.isArray(v.log)?v.log:[]).filter(x=>x&&areas[x.area]&&typeof x.date==='string').slice(-200);
    const date=v.profile&&typeof v.profile.date==='string'?v.profile.date:null;
    return {profile:{answers,tests,date},levels,program,log,hoopDate:typeof v.hoopDate==='string'?v.hoopDate:null};
  }
  function complete(s) {return !!(s&&s.profile&&s.profile.date);}
  function saveProfile(skills,profile) {
    const s=validate(skills),clean=validate({...s,profile:{...profile,date:today()}});
    return {...clean,levels:initialLevels(clean.profile),program:clean.program||{perWeek:2,minutes:45,blocks:true,blockMinutes:15,status:'active',startDate:today()}};
  }
  const hoopToday = (skills,date=today()) => !!(skills&&skills.hoopDate===date);

  // Choix des exercices : domaine, palier atteint (on reprend aussi le palier du dessous), points faibles, panier, sauts.
  function pick(state,{area,count=2,hoop=false,noImpact=false,exclude=[],stationary=false}) {
    const s=state.skills||blank(),tier=s.levels[area]||1,prio=priorities(s,state.player);
    const weight=d=>d.tags.reduce((n,t)=>n+((prio.find(p=>p.id===t)||{}).score||0),0);
    const pains=(state.symptoms||[]).filter(x=>x.active).map(x=>x.region);
    return drills.filter(d=>d.area===area&&!d.intense&&d.tier<=tier&&d.tier>=tier-1&&(hoop||!d.needs.includes('hoop'))&&!(hoop&&area==='shoot'&&!d.needs.includes('hoop'))&&!(noImpact&&(d.impact||d.cuts))&&!(stationary&&d.cuts)
      &&!exclude.includes(d.id)&&!d.regions.some(r=>pains.includes(r)))
      .sort((a,b)=>(b.tier===tier)-(a.tier===tier)||(hoop?b.needs.includes('hoop')-a.needs.includes('hoop'):0)||weight(b)-weight(a)||a.id.localeCompare(b.id)).slice(0,count);
  }
  function dose(d,PT) {
    const p={...d,targetMin:d.min,targetMax:d.max,role:'skill',skillArea:d.area,skillTier:d.tier};
    return PT&&PT.makePrescription?{...PT.makePrescription(d,'classic',30,{low:false}),...p,sets:d.sets,rest:d.rest}:p;
  }
  function fill(state,plan,target,areaOrder,opts) {
    const used=plan.map(e=>e.id).concat(opts.exclude||[]);
    for(const area of areaOrder){
      while(estimate(plan)<target*0.85){const [d]=pick(state,{...opts,area,count:1,exclude:used});if(!d)break;used.push(d.id);plan.push(dose(d,opts.PT));}
    }
    let guard=0;
    while(estimate(plan)<target*0.85&&plan.some(e=>e.sets<5)&&guard++<40){const e=plan.filter(x=>x.sets<5).sort((a,b)=>a.sets-b.sets)[0];e.sets+=1;}
    return plan;
  }
  const estimate = list => list.reduce((n,e)=>n+e.sets*((e.measure==='seconds'||e.measure==='shots')?e.seconds:(e.max||10)*3*(e.unilateral?2:1))+Math.max(0,e.sets-1)*e.rest,0);

  // Séance skills complète. light : la veille d'un match ou jambes protégées (aucun saut ni changement de direction).
  function session(PT,state,{minutes,light=false,date=today()}={}) {
    const s=validate(state.skills),prog=s.program||{minutes:45};
    const total=Number(minutes)||prog.minutes||45,hoop=hoopToday(s,date),prio=priorities(s,state.player);
    const main=prio[0]?prio[0].area:'handle',second=(prio.find(p=>p.area!==main)||{area:hoop?'shoot':'footwork'}).area;
    const opts={hoop,noImpact:light};
    const used=hoop?['sk-ft']:[],take=(area,count)=>{const list=pick(state,{...opts,area,count,exclude:used});list.forEach(d=>used.push(d.id));return list.map(d=>dose(d,PT));};
    // Échauffement balle en main, cœur sur le point faible, deuxième domaine, puis lancers francs ou tir de forme pour finir.
    // Échauffement : coordination et réception tant qu'elles ne sont pas un point fort, sinon maniement.
    const warm=(s.levels.coordination||1)<3&&main!=='coordination'?'coordination':'handle';
    const plan=[...take(warm,1),...take(main,total>=45?3:2),...take(second,total>=45?2:1)];
    if(total>=60) plan.push(...take(main==='shoot'?'finish':'shoot',1),...take('footwork',1));
    // Avec un panier, la séance se termine toujours par des lancers francs (routine sous fatigue légère).
    const ft=hoop?dose(byId('sk-ft'),PT):null;
    fill(state,plan,(total-5)*60-(ft?estimate([ft]):0),[main,second,hoop?'shoot':'handle','footwork'],{...opts,exclude:ft?['sk-ft']:[],PT});
    if(ft) plan.push(ft);
    while(estimate(plan)>(total-5)*60&&plan.length>3) plan.splice(plan.length-2,1);
    while(estimate(plan)>(total-5)*60&&plan.some(e=>e.sets>2)) {const e=[...plan].reverse().find(x=>x.sets>2);e.sets-=1;}
    if(plan.length<2) return {error:'Pas assez d’exercices compatibles aujourd’hui (douleurs ou matériel).'};
    const reasons=[`Point faible travaillé : ${areas[main].label.toLowerCase()} (palier ${TIERS[s.levels[main]-1].toLowerCase()})${!hoop&&['shoot','finish'].includes(main)?', au panier dès que tu en as un':''}.`,
      hoop?'Panier disponible aujourd’hui : tir et finition au programme.':'Sans panier aujourd’hui : maniement, appuis et tir de forme sans panier. Coche « panier » si tu en as un.',
      'Note tes tirs réussis et tentés : ils font évoluer ton palier.'];
    if(light) reasons.push('Version légère : ni saut ni changement de direction, tes jambes restent fraîches.');
    const styles=[...new Set(plan.map(e=>e.style).filter(Boolean))];
    if(styles.length) reasons.push(`Inspiration : ${styles.join(', ')} (style de jeu, pas un programme officiel).`);
    const counts={};plan.forEach(e=>counts[e.area]=(counts[e.area]||0)+1);
    const lead=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
    return {id:uid(),title:`Skills · ${areas[lead].short}${hoop?' + panier':''}`,source:'skills',focus:'basket-skills',format:'classic',exercises:plan,check:{...state.checkIn,date,minutes:total,equipment:[...(state.owned||[]),'ball',...(hoop?['hoop']:[])],focus:'mixed',format:'classic'},reasons,warmupSeconds:180,estimatedMinutes:Math.ceil((estimate(plan)+240)/60),status:'preview',entries:{},createdAt:new Date().toISOString()};
  }

  // Intensité match : efforts de 20 à 60 s, récupérations courtes, tir, dribble et finition sous fatigue.
  // Le basket alterne des efforts très intenses et des récupérations incomplètes : on reproduit ce rythme ballon en main.
  const hash = s => [...String(s)].reduce((n,c)=>(n*31+c.charCodeAt(0))%9973,7);
  function matchSession(PT,state,{minutes=30,date=today()}={}) {
    const s=validate(state.skills),hoop=hoopToday(s,date),total=Number(minutes)||30;
    const pains=(state.symptoms||[]).filter(x=>x.active);
    if(pains.some(p=>['knee','ankle','hip','back'].includes(p.region)&&Number(p.severity)>=3)) return {error:'Douleur aux jambes ou au dos : pas d’intensité match aujourd’hui. Fais plutôt une séance skills légère ou ton soin.'};
    const lvl=a=>Math.max(2,s.levels[a]||1);
    const avail=d=>d.intense&&d.tier<=lvl(d.area)&&(hoop||!d.needs.includes('hoop'))&&!d.regions.some(r=>pains.some(p=>p.region===r));
    const order=hoop?['handle','shoot','finish','shoot','defense','handle','finish']:['handle','handle','handle'];
    const plan=[],used=new Set();
    const add=d=>{used.add(d.id);plan.push({...dose(d,PT),sets:d.sets,rest:d.rest});};
    for(const area of order){
      if(estimate(plan)>=(total-6)*60) break;
      const d=drills.filter(x=>x.area===area&&avail(x)&&!used.has(x.id)&&x.id!=='mi-suicide-ft').sort((a,b)=>hash(a.id+date)-hash(b.id+date))[0];
      if(d) add(d);
    }
    // Sans panier : on complète avec la défense et la coordination ballon en main, à vitesse de match.
    if(!hoop) ['df-slide-sprint','df-zigzag','co-figure8-cones'].forEach(id=>{const d=byId(id);if(d&&estimate(plan)<(total-6)*60&&!d.regions.some(r=>pains.some(p=>p.region===r)))add(d);});
    // Avec un panier, on finit toujours par des lancers francs fatigué.
    const ft=hoop?byId('mi-suicide-ft'):null;
    if(ft) add(ft);
    while(estimate(plan)>(total-5)*60&&plan.some(e=>e.sets>2)) {const e=[...plan].reverse().find(x=>x.sets>2);e.sets-=1;}
    while(estimate(plan)>(total-5)*60&&plan.length>3) plan.splice(plan.length-(ft?2:1),1);
    if(plan.length<2) return {error:'Pas assez d’exercices compatibles aujourd’hui (douleurs ou matériel).'};
    const reasons=['Intensité match : efforts courts et répétés, récupération courte. C’est le rythme d’un vrai match, ballon en main.',
      hoop?'Tirs, finitions et lancers francs sous fatigue : note tes réussis, c’est ton pourcentage quand les jambes brûlent.':'Sans panier : dribble, appuis et défense à vitesse de match. Coche « panier » pour ajouter tirs et finitions.',
      'Une à deux fois par semaine au plus, jamais la veille d’un match ni sur des jambes lourdes.'];
    if(state.pathway&&Number(state.pathway.step)<3) reasons.push('Ton parcours Retour au jeu n’est pas encore à l’étape 3 : une seule séance de ce type par semaine, et stop au moindre signal au genou ou à la cheville.');
    return {id:uid(),title:`Intensité match${hoop?' · panier':''}`,source:'match-intensity',focus:'basket-skills',format:'classic',exercises:plan,check:{...state.checkIn,date,minutes:total,equipment:[...(state.owned||[]),'ball',...(hoop?['hoop']:[])],focus:'mixed',format:'classic'},reasons,warmupSeconds:300,estimatedMinutes:Math.ceil((estimate(plan)+360)/60),status:'preview',entries:{},createdAt:new Date().toISOString()};
  }

  // Hôte d'un bloc : ce que la séance principale a déjà sollicité.
  function hostOf(exercises) {
    const n=p=>exercises.filter(e=>p.includes(e.pattern)).length;
    if(n(['cardio'])>=1&&n(['squat','hinge','jump'])<=1) return 'cardio';
    if(n(['squat','hinge','jump','calf'])>=2) return 'legs';
    return 'upper';
  }
  // Bloc ajouté après une autre séance : muscu haut du corps → dribble + tir ; footing → finition (ou dribble en mouvement) ;
  // jambes → tir de forme et dribble sur place, sans saut.
  function block(PT,state,{exercises=[],minutes,protectLegs=false,date=today()}={}) {
    const s=validate(state.skills);
    if(!s.program||s.program.status!=='active'||!s.program.blocks) return null;
    const hoop=hoopToday(s,date),host=hostOf(exercises),m=Number(minutes)||s.program.blockMinutes||15;
    const legs=protectLegs||host==='legs',count=m>=20?3:2,used=exercises.map(e=>e.id);
    const areasFor=host==='cardio'?(hoop?['finish','handle']:['handle','footwork']):host==='legs'?['shoot','handle']:['handle','shoot'];
    const list=[];
    areasFor.forEach((area,i)=>pick(state,{area,count:i===0?count-1:1,hoop,noImpact:legs,stationary:legs,exclude:used.concat(list.map(d=>d.id))}).forEach(d=>list.push(d)));
    if(!list.length) return null;
    const items=fill(state,list.map(d=>dose(d,PT)),m*60,areasFor,{hoop,noImpact:legs,stationary:legs,PT}).map(e=>({...e,skillBlock:true}));
    const label={upper:'après le haut du corps : dribble puis tir',cardio:hoop?'jour de footing : finition au cercle':'jour de footing : dribble en mouvement',legs:'après les jambes : tir de forme et dribble sur place, sans saut'}[host];
    return {exercises:items,minutes:Math.ceil(estimate(items)/60),note:`Bloc skills (${label}, ~${Math.ceil(estimate(items)/60)} min)${hoop?'':' — sans panier aujourd’hui'}.`};
  }
  // Ajoute le bloc à une séance déjà construite (sans le doubler).
  function withBlock(PT,state,plan,opts={}) {
    if(!plan||plan.error||plan.source==='skills'||(plan.exercises||[]).some(e=>e.skillBlock)) return plan;
    const b=block(PT,state,{...opts,exercises:plan.exercises});
    if(!b) return plan;
    return {...plan,exercises:[...plan.exercises,...b.exercises],reasons:[...(plan.reasons||[]),b.note],estimatedMinutes:(plan.estimatedMinutes||0)+b.minutes,skillBlockMinutes:b.minutes};
  }

  // Progression : ressenti par domaine + tirs. Deux séances « trop facile » (ou ≥ 70 % de réussite) font monter ; deux « trop dur » (ou < 35 %) font descendre.
  function record(skills,session,ratings={}) {
    const s=validate(skills),date=session.date||today(),log=[...s.log];
    const byArea={};
    (session.exercises||[]).filter(e=>e.skillArea).forEach(e=>{
      const a=e.skillArea,rows=((session.entries||{})[e.id]||[]).filter(r=>r.done);
      byArea[a]=byArea[a]||{made:0,attempts:0,done:0};
      byArea[a].done+=rows.length;
      if(e.measure==='shots') rows.forEach(r=>{byArea[a].made+=Number(r.made)||0;byArea[a].attempts+=Number(r.attempts)||0;});
    });
    const changes=[];const levels={...s.levels};
    Object.entries(byArea).forEach(([area,v])=>{
      if(!v.done) return;
      const pct=v.attempts>=10?v.made/v.attempts:null;
      const rating=ratings[area]||(pct===null?'right':pct>=0.7?'easy':pct<0.35?'hard':'right');
      log.push({date,area,tier:levels[area],rating,made:v.made,attempts:v.attempts,sessionId:session.id||null});
      const mine=log.filter(x=>x.area===area).slice(-2);
      if(mine.length===2&&mine.every(x=>x.rating==='easy'&&x.tier===levels[area])&&levels[area]<3){levels[area]+=1;changes.push({area,dir:1});}
      else if(mine.length===2&&mine.every(x=>x.rating==='hard'&&x.tier===levels[area])&&levels[area]>1){levels[area]-=1;changes.push({area,dir:-1});}
    });
    return {skills:{...s,levels,log:log.slice(-200)},changes};
  }

  function summary(s) {
    if(!complete(s)) return null;
    const v=validate(s);
    return Object.entries(areas).map(([a,x])=>`${x.short} : ${TIERS[v.levels[a]-1].toLowerCase()}`).join(' ; ')+(v.program?` ; ${v.program.perWeek} séance(s) skills/semaine`:'')+'.';
  }

  return {areas,TIERS,items,ratings,drills,byId,blank,validate,complete,saveProfile,initialLevels,tierFromAnswers,tierFromTests,priorities,pick,session,matchSession,hostOf,block,withBlock,record,summary,hoopToday,estimate};
});

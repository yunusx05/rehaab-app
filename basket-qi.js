/* Rehaab: QI basket. Lectures de jeu, placements, fins de match, vocabulaire, analyse de match. Règles FIBA. Pur, sans DOM. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BasketQI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const themes = {
    'pnr-handler':'Pick & roll · porteur','pnr-screener':'Pick & roll · poseur','help-defense':'Aides défensives','closeout':'Sorties sur tireur',
    offball:'Jeu sans ballon',cuts:'Coupes',transition:'Transition',tempo:'Rythme & fin de match','press-break':'Contre la presse',
    spacing:'Espacement',rebound:'Rebond','rim-protection':'Protection du cercle',post:'Jeu au poste','finishing-reads':'Lectures en pénétration',
    'on-ball':'Défense sur porteur','pnr-defense':'Défendre le pick & roll','off-ball-defense':'Défense sans ballon','transition-defense':'Repli défensif','post-defense':'Défense au poste'
  };
  // Thèmes défensifs : une lecture du jour sur deux vient de ce côté du terrain.
  const defenseThemes = ['help-defense','closeout','on-ball','pnr-defense','off-ball-defense','transition-defense','post-defense','rim-protection','rebound'];
  // Demi-terrain : cercle en haut (50,10), ligne médiane en bas (y = 94). Unité : 1 = 6 pouces.
  const spots = {top:[50,66],slotL:[34,62],slotR:[66,62],wingL:[14,44],wingR:[86,44],cornerL:[5,7],cornerR:[95,7],elbowL:[36,38],elbowR:[64,38],
    blockL:[36,15],blockR:[64,15],dunkL:[27,5],dunkR:[73,5],nail:[50,38],rim:[50,12],half:[50,88],deepL:[24,80],deepR:[76,80]};
  const at = (name,dx=0,dy=0) => [spots[name][0]+dx,spots[name][1]+dy];
  // o : attaquants [numéro, x, y, ballon] · d : défenseurs [numéro, x, y] · a : flèches [type, x1, y1, x2, y2] (cut, pass, dribble, screen)
  const O = (n,spot,ball,dx,dy) => [n,...at(spot,dx,dy),!!ball];
  const D = (n,x,y) => [n,x,y];
  const A = (type,from,to) => [type,...(typeof from==='string'?at(from):from),...(typeof to==='string'?at(to):to)];
  const Q = (id,theme,groups,title,prompt,court,choices,lesson) => ({id,theme,groups,title,prompt,court,choices:choices.map(([text,ok,why])=>({text,ok:!!ok,why})),lesson});
  const G='guard',W='wing',B='big';

  const quiz = [
    Q('pnr-drop','pnr-handler',[G,W],'Drop','X5 recule sous l’écran, vers la ligne des lancers. X1 passe par-dessus et te suit. Ta meilleure lecture ?',
      {o:[O(1,'top',1,10,6),O(5,'top',0,1,0),O(2,'wingL'),O(3,'cornerR'),O(4,'cornerL')],d:[D(1,66,78),D(5,50,30),D(2,20,42),D(3,86,12),D(4,12,12)],a:[A('screen',[51,66],[51,72]),A('dribble',[58,70],[40,50])]},
      [['Tir à mi-distance ou floater dans l’espace laissé devant X5',1,'X5 protège le cercle et reste bas : l’espace entre la ligne à 3 points et la raquette est à toi.'],['Foncer au cercle tout de suite',0,'C’est exactement là que X5 t’attend, grand et bien placé.'],['Passer immédiatement au poseur qui roule',0,'X5 est entre toi et lui : la passe est couverte tant que tu ne l’as pas fixé.'],['Refuser l’écran et partir de l’autre côté',0,'Le refus sert contre un défenseur qui anticipe ; ici la défense te laisse l’espace.']],
      'Contre un drop : fixe X5 avec ton dribble. S’il reste bas, tu tires ; s’il monte, le poseur est libre derrière lui.'),
    Q('pnr-hedge','pnr-handler',[G,W],'Hedge','X5 sort haut et fort devant toi pour te ralentir, pendant que X1 revient. Que fais-tu ?',
      {o:[O(1,'top',1,10,6),O(5,'top',0,1,0),O(2,'wingL'),O(3,'cornerR'),O(4,'cornerL')],d:[D(1,66,78),D(5,44,62),D(2,20,42),D(3,86,12),D(4,12,12)],a:[A('screen',[51,66],[51,72]),A('dribble',[60,72],[66,80]),A('cut',[51,66],[54,22])]},
      [['Reculer d’un dribble pour étirer le hedge, puis servir le poseur qui roule',1,'En reculant, tu obliges X5 à rester loin de son joueur : la passe vers le cercle s’ouvre.'],['Forcer entre les deux défenseurs',0,'Le passage entre deux défenseurs est une option d’expert, souvent une perte de balle.'],['Tirer à 3 points tout de suite',0,'X5 est sur toi, main haute : c’est le tir que la défense veut.'],['Passer à l’aile côté ballon',0,'Tu relâches la pression sans profiter du deux contre un créé par le hedge.']],
      'Hedge = deux défenseurs sur toi pendant une seconde. Garde ton dribble, crée l’angle, et le poseur devient le joueur libre.'),
    Q('pnr-switch','pnr-handler',[G,W,B],'Switch','Les deux défenseurs échangent : X5, le grand, est maintenant sur toi, et X1, le petit, sur le poseur. Qu’est-ce qui est presque toujours disponible ?',
      {o:[O(1,'slotL',1,4,-6),O(5,'rim',0,4,10),O(2,'wingL'),O(3,'cornerR'),O(4,'cornerL')],d:[D(5,40,50),D(1,54,33),D(2,20,42),D(3,86,12),D(4,12,12)],a:[]},
      [['Le poseur qui garde le petit dans son dos (seal) près du cercle',1,'Un petit défenseur sur un intérieur près du panier : c’est l’avantage le plus rapide à exploiter.'],['Un tir à 3 points contesté par le grand',0,'Tu peux attaquer le grand, mais pas en tirant sur sa main.'],['Une nouvelle demande d’écran au même poseur',0,'Un nouvel écran redonne à la défense le temps de se replacer.'],['Rien : il faut tout recommencer',0,'Un switch crée presque toujours un décalage de taille ou de vitesse.']],
      'Après un switch, lis les décalages : le grand sur toi (attaque-le en vitesse) ou le petit sur le poseur (donne-lui la balle près du cercle).'),
    Q('pnr-blitz','pnr-handler',[G,W],'Blitz','Les deux défenseurs te trappent au moment de l’écran. Ta meilleure option ?',
      {o:[O(1,'top',1,10,8),O(5,'nail',0,0,2),O(2,'wingL'),O(3,'cornerR'),O(4,'dunkL')],d:[D(1,67,79),D(5,53,76),D(2,20,42),D(3,86,12),D(4,40,18)],a:[A('pass',[58,72],[50,42])]},
      [['Passer vite au poseur en short roll : c’est 4 contre 3 derrière',1,'Deux défenseurs sur toi = un attaquant libre. Le short roll attaque ce surnombre.'],['Dribbler à reculons pour garder la balle',0,'La trappe se referme sur toi et le chrono tourne.'],['Longue passe au-dessus vers le coin opposé',0,'Passe lente et longue : les défenseurs du côté faible ont le temps d’intercepter.'],['Forcer un tir',0,'Tir sous deux défenseurs : c’est ce que le blitz cherche.']],
      'Contre une trappe, la balle doit sortir en moins de deux secondes, vers le milieu.'),
    Q('pnr-ice','pnr-handler',[G,W,B],'ICE','Pick & roll sur le côté. X1 se place au-dessus de l’écran pour t’empêcher de l’utiliser et X5 t’attend côté ligne de fond. Quel coéquipier est le plus souvent libre ?',
      {o:[O(1,'wingR',1),O(5,'wingR',0,-10,4),O(2,'wingL'),O(3,'top'),O(4,'dunkL')],d:[D(1,80,52),D(5,84,28),D(2,20,42),D(3,50,58),D(4,38,16)],a:[A('cut',at('wingR',-10,4),[70,60])]},
      [['Le poseur, s’il s’écarte (pop) ou glisse (slip) au lieu de bloquer',1,'X5 est parti vers la ligne de fond : son joueur n’a plus personne sur lui.'],['Le joueur dans le coin opposé',0,'Il peut se libérer ensuite, mais le décalage immédiat est sur le poseur.'],['Toi, en passant quand même par l’écran',0,'X1 est justement placé pour te l’interdire.'],['Personne : il faut ressortir la balle',0,'Ressortir la balle rend l’initiative à la défense.']],
      'ICE : la défense accepte de sortir X5 de la raquette. Le poseur qui s’écarte ou glisse devient la menace.'),
    Q('pnr-under','pnr-handler',[G],'Passage sous l’écran','X1 passe sous l’écran au lieu de te suivre. Tu tires bien à 3 points. Que fais-tu ?',
      {o:[O(1,'top',1,10,6),O(5,'top',0,1,0),O(2,'wingL'),O(3,'cornerR'),O(4,'cornerL')],d:[D(1,58,58),D(5,44,50),D(2,20,42),D(3,86,12),D(4,12,12)],a:[A('screen',[51,66],[51,72]),A('dribble',[58,72],[38,74])]},
      [['Tirer derrière l’écran, ou demander au poseur de le reposer plus haut',1,'Passer sous l’écran, c’est te laisser le tir : prends-le, ou fais remonter l’écran.'],['Pénétrer au cercle',0,'La défense est regroupée devant toi : c’est la raquette qui est protégée.'],['Passer au poseur',0,'Personne n’est aspiré : le poseur n’a pas d’avantage.'],['Attendre que X1 revienne',0,'Tu perds l’avantage que la défense vient de t’offrir.']],
      'Un défenseur qui passe sous l’écran te dit : « tire ». Un bon tireur punit ça tout de suite.'),
    Q('pnr-tag','pnr-handler',[G,W],'L’aide du coin','Le poseur roule. X4 quitte le coin droit pour venir le toucher sous le panier. Où est la passe ?',
      {o:[O(1,'slotL',1,4,-4),O(5,'rim',0,4,10),O(2,'wingL'),O(3,'wingR'),O(4,'cornerR')],d:[D(1,44,64),D(5,50,36),D(4,58,20),D(2,20,42),D(3,82,44)],a:[A('cut',[51,66],[54,22]),A('cut',[92,12],[60,20])]},
      [['Au coin droit, là où X4 a quitté son joueur',1,'L’aide vient de quelque part : la passe va là où elle est partie.'],['Au rouleur malgré l’aide',0,'X4 est sur la ligne de passe.'],['À l’aile côté ballon',0,'Son défenseur n’a pas bougé : pas d’avantage.'],['Tir en force au cercle',0,'Deux défenseurs t’attendent près du panier.']],
      'Règle d’or : regarde d’où vient l’aide. Le joueur qu’elle a laissé est ton joueur libre.'),
    Q('scr-shortroll','pnr-screener',[B],'Short roll','Ton meneur est trappé. Tu reçois à la ligne des lancers. X4 monte sur toi depuis le côté faible. Où joues-tu ?',
      {o:[O(1,'top',0,0,2),O(5,'nail',1,0,2),O(4,'dunkL'),O(2,'wingL'),O(3,'cornerR')],d:[D(1,48,70),D(5,58,64),D(4,44,34),D(2,20,42),D(3,86,12)],a:[A('pass',at('top'),at('nail',0,2))]},
      [['Passer à 4 au dunker spot, le joueur que X4 a quitté',1,'X4 est sorti pour toi : 4 est seul sous le panier.'],['Tirer à mi-distance quoi qu’il arrive',0,'Le tir est possible si personne ne sort. Ici X4 arrive.'],['Dribbler vers le cercle',0,'Tu fonces dans X4 : passage en force ou perte de balle.'],['Ressortir au meneur',0,'Il est encore trappé : tu gâches le 4 contre 3.']],
      'En short roll, tu es le meneur de jeu pendant deux secondes : regarde le low man et joue à l’opposé.'),
    Q('scr-rescreen','pnr-screener',[B],'Re-screen','Le défenseur de ton meneur passe sous ton écran. Ton meneur est un bon tireur. Ta meilleure action ?',
      {o:[O(1,'top',1,12,10),O(5,'top',0,1,0),O(2,'wingL'),O(3,'cornerR'),O(4,'cornerL')],d:[D(1,56,58),D(5,44,54),D(2,20,42),D(3,86,12),D(4,12,12)],a:[A('cut',[52,67],[55,71]),A('screen',[55,71],[55,77])]},
      [['Reposer l’écran plus haut pour lui donner le tir',1,'En remontant l’écran, tu bloques le défenseur qui a pris le chemin court par-dessous.'],['Rouler vers le cercle',0,'Personne n’est aspiré : ton roll est couvert.'],['Rester immobile',0,'L’écran est déjà contourné : il ne sert plus.'],['T’écarter dans le coin',0,'Tu vides l’action sans exploiter l’erreur de la défense.']],
      'Le poseur lit aussi la défense. Défenseur dessous → nouvel écran. Défenseur au-dessus → roll.'),
    Q('scr-slip','pnr-screener',[B],'Slip','Au moment où tu montes poser l’écran, les deux défenseurs annoncent un switch et regardent le porteur. Que fais-tu ?',
      {o:[O(1,'top',1,4,0),O(5,'elbowR',0,0,10),O(2,'wingL'),O(3,'cornerR'),O(4,'cornerL')],d:[D(1,52,72),D(5,60,56),D(2,20,42),D(3,86,12),D(4,12,12)],a:[A('cut',at('elbowR',0,10),at('rim',4,6))]},
      [['Glisser vers le cercle avant de poser l’écran (slip)',1,'Les deux défenseurs pensent à l’écran : couper tôt te donne un pas d’avance.'],['Poser un écran bien solide',0,'Ils ont déjà prévu de changer : l’écran ne crée rien.'],['T’écarter à 3 points',0,'Possible si tu tires bien, mais le cercle est plus dangereux.'],['Demander la balle au poste haut',0,'Tu arrêtes l’action.']],
      'Quand la défense anticipe l’écran, l’écran qui ne vient pas est la meilleure arme.'),
    Q('scr-droproll','pnr-screener',[B],'Rouler contre le drop','Ton défenseur reste bas (drop). Tu ne tires pas à 3 points. Comment aider quand même ton meneur ?',
      {o:[O(1,'slotL',1,4,-4),O(5,'top',0,1,0),O(2,'wingL'),O(3,'cornerR'),O(4,'cornerL')],d:[D(5,50,30),D(1,44,64),D(2,20,42),D(3,86,12),D(4,12,12)],a:[A('dribble',[60,72],[40,58]),A('cut',[51,66],[52,20])]},
      [['Rouler fort vers le cercle pour occuper X5 et libérer le tir de ton meneur',1,'Si X5 doit te suivre, ton meneur a le mi-distance. S’il reste sur le meneur, tu es seul.'],['Rester à la ligne des lancers',0,'Tu bouches l’espace où ton meneur veut tirer.'],['Reposer l’écran',0,'Contre un drop, le problème n’est pas l’écran, c’est X5 qui attend.'],['Aller au rebond offensif tout de suite',0,'Le tir n’est pas encore parti.']],
      'Même sans ballon, ta course fixe un défenseur. Un roll franc crée un choix difficile pour X5.'),
    Q('help-tag','help-defense',[W,B],'Toucher le rouleur','Le poseur roule vers le cercle et personne ne l’arrête. Tu es le défenseur le plus bas côté faible (low man). Que fais-tu ?',
      {o:[O(1,'top',1,10,-4),O(5,'rim',0,6,10),O(4,'cornerL'),O(2,'wingL'),O(3,'wingR')],d:[D(1,62,60),D(5,58,40),D(4,30,16),D(2,20,42),D(3,82,44)],a:[A('cut',at('top',-2,-12),at('rim',6,10))]},
      [['Venir toucher le rouleur (tag), puis revenir vers ton joueur',1,'Tu ralentis le roll le temps que X5 récupère, et tu gardes un œil sur le coin.'],['Rester collé à ton joueur dans le coin',0,'Le rouleur marque sans opposition.'],['Sauter sur le porteur',0,'Il est déjà pris en charge : tu laisses deux joueurs libres.'],['Aller au rebond',0,'Pas encore de tir : il faut stopper la passe.']],
      'Le low man protège le cercle d’abord. Ensuite, retour sur le tireur avec une sortie contrôlée.'),
    Q('help-stunt','help-defense',[G,W],'Stunt','Le porteur pénètre dans l’espace entre ton défenseur voisin et toi. Ton joueur est un bon tireur à l’aile. Ta réaction ?',
      {o:[O(1,'slotR',1,-6,-10),O(2,'wingL'),O(3,'wingR'),O(4,'cornerL'),O(5,'blockR')],d:[D(1,56,48),D(2,24,44),D(3,78,44),D(4,14,14),D(5,62,20)],a:[A('dribble',at('slotR'),at('slotR',-6,-10))]},
      [['Feinter l’aide (stunt) pour le ralentir, puis revenir sur ton tireur',1,'Un pas vers la balle suffit à faire hésiter le porteur, sans laisser ton tireur seul.'],['Aider franchement en quittant ton joueur',0,'Une passe et ton tireur est seul à 3 points.'],['Ne pas bouger',0,'Le porteur a une voie libre vers le cercle.'],['Faire faute',0,'Faute inutile, loin du panier.']],
      'Stunt = montrer l’aide sans la donner. Pour un tireur, on ne s’éloigne jamais d’un pas de trop.'),
    Q('help-xout','help-defense',[G,W,B],'Rotation après passe transversale','La balle traverse le terrain par une passe au-dessus de la défense vers l’aile opposée. Qui sort sur le receveur ?',
      {o:[O(1,'wingR',0),O(2,'wingL',1),O(3,'cornerR'),O(4,'cornerL'),O(5,'blockR')],d:[D(1,78,46),D(2,40,40),D(3,70,16),D(4,36,22),D(5,58,18)],a:[A('pass',at('wingR'),at('wingL'))]},
      [['Le défenseur le plus proche sprinte ; les autres tournent derrière lui',1,'La défense se croise (X-out) : le plus proche sort, le suivant prend son joueur.'],['Toujours le défenseur d’origine, même s’il est loin',0,'Il arrive en retard : tir ouvert.'],['Personne, on protège la raquette',0,'Un tir à 3 points ouvert concédé.'],['Les deux plus proches ensemble',0,'Double sur la balle = un autre joueur seul.']],
      'Sur une passe transversale, le plus proche sort d’abord. On règle les échanges ensuite, en parlant.'),
    Q('help-baseline','help-defense',[B],'Aide sur la ligne de fond','Ton coéquipier se fait battre côté ligne de fond. Tu défends l’intérieur côté faible. Où vas-tu ?',
      {o:[O(2,'wingR',1,4,-26),O(5,'blockL'),O(1,'top'),O(3,'wingL'),O(4,'cornerL')],d:[D(2,84,30),D(5,42,18),D(1,50,58),D(3,20,42),D(4,12,14)],a:[A('dribble',at('wingR'),at('wingR',4,-26))]},
      [['Devant le cercle, pieds posés hors du demi-cercle, pour stopper le porteur',1,'L’aide doit arriver avant le porteur, et hors de la zone où la faute offensive n’existe pas.'],['Rester sur ton intérieur',0,'Le porteur finit seul au panier.'],['Courir pour contrer par derrière',0,'Trop tard, et souvent une faute.'],['Sortir sur le meneur',0,'Il est loin de l’action.']],
      'L’aide sur la ligne de fond vient du côté faible. Le coéquipier suivant tourne sur ton joueur.'),
    Q('close-shooter','closeout',[G,W],'Sortie sur un tireur','La balle arrive à un très bon tireur à 3 points. Tu arrives de loin. Comment finis-tu ta sortie ?',
      {o:[O(3,'cornerL',1),O(1,'top'),O(2,'wingR'),O(4,'blockR'),O(5,'elbowR')],d:[D(3,30,30),D(1,50,58),D(2,82,44),D(4,60,18),D(5,62,40)],a:[A('pass',at('top'),at('cornerL'))]},
      [['Sprint, puis petits pas, main haute, sans sauter',1,'Tu gênes le tir et restes équilibré pour défendre la pénétration.'],['Sauter pour contrer',0,'Une feinte et il est seul au cercle, ou tu fais faute sur le tireur.'],['Arriver à fond sans freiner',0,'Il te passe à côté.'],['Rester à distance',0,'C’est un tireur : il prend le tir ouvert.']],
      'Une bonne sortie sur tireur : vite, puis contrôlé. Main haute, poids sur l’arrière.'),
    Q('close-driver','closeout',[G,W],'Sortie sur un pénétrateur','La balle arrive à un joueur qui tire mal de loin mais pénètre très bien. Comment sors-tu ?',
      {o:[O(4,'wingL',1),O(1,'top'),O(2,'wingR'),O(3,'cornerR'),O(5,'blockR')],d:[D(4,24,40),D(1,50,58),D(2,82,44),D(3,88,14),D(5,60,18)],a:[A('pass',at('top'),at('wingL'))]},
      [['À distance, en lui laissant le tir mais pas le passage',1,'Tu lui proposes son point faible et fermes son point fort.'],['Collé à lui, main haute',0,'Il te passe en un dribble.'],['Sauter pour contrer',0,'Il ne veut pas tirer : il te passe.'],['Aider les autres et le laisser',0,'Il a la balle : il faut défendre.']],
      'Défends le joueur, pas le schéma : on sort différemment sur un tireur et sur un pénétrateur.'),
    Q('cut-backdoor','cuts',[G,W],'Backdoor','À l’aile, ton défenseur surjoue la ligne de passe, main tendue. Que fais-tu ?',
      {o:[O(2,'wingL',0),O(1,'top',1),O(3,'wingR'),O(4,'cornerR'),O(5,'elbowR')],d:[D(2,22,50),D(1,50,58),D(3,82,44),D(4,88,14),D(5,62,40)],a:[A('cut',at('wingL'),[40,14])]},
      [['Couper dans son dos vers le cercle (backdoor)',1,'Il te ferme la ligne extérieure : le chemin vers le panier est ouvert.'],['Insister pour recevoir à l’aile',0,'Passe risquée : interception probable.'],['Aller poser un écran',0,'Possible, mais tu laisses passer l’avantage qu’il te donne.'],['Remonter vers le meneur',0,'Tu t’éloignes du panier.']],
      'Un défenseur trop agressif sur la ligne de passe offre la coupe dans son dos.'),
    Q('cut-drift','offball',[G,W],'Drift','Ton meneur pénètre par le milieu. Tu es à l’aile gauche. Où vas-tu ?',
      {o:[O(1,'nail',1,0,8),O(2,'wingL'),O(3,'wingR'),O(4,'cornerR'),O(5,'blockR')],d:[D(1,50,52),D(2,28,40),D(3,82,44),D(4,88,14),D(5,60,18)],a:[A('dribble',at('top'),at('nail',0,8)),A('cut',at('wingL'),at('cornerL',2,4))]},
      [['Glisser vers le coin pour garder l’espace et un angle de passe',1,'Ton défenseur aide : en glissant, tu t’éloignes de lui et restes visible.'],['Couper vers le cercle',0,'Tu amènes ton défenseur dans la zone de ton meneur.'],['Venir chercher la balle',0,'Tu bouches son espace.'],['Rester immobile',0,'Ton défenseur peut aider et revenir.']],
      'Pénétration par le milieu : l’aile glisse vers le coin. Pénétration par la ligne de fond : le coin remonte.'),
    Q('cut-lift','offball',[G,W],'Lift','Ton coéquipier à l’aile droite pénètre côté ligne de fond. Tu es dans le coin droit. Que fais-tu ?',
      {o:[O(2,'wingR',1,4,-22),O(3,'cornerR'),O(1,'top'),O(4,'wingL'),O(5,'blockL')],d:[D(2,84,34),D(3,86,14),D(1,50,58),D(4,20,42),D(5,40,18)],a:[A('dribble',at('wingR'),at('wingR',4,-22)),A('cut',at('cornerR'),at('wingR',0,0))]},
      [['Remonter vers l’aile (lift) pour libérer le coin et offrir la passe arrière',1,'Il arrive dans ton coin : tu lui laisses l’espace et deviens la sortie de balle.'],['Rester dans le coin',0,'Vous êtes deux au même endroit : ton défenseur défend les deux.'],['Couper au cercle',0,'Tu amènes un défenseur en plus sur sa route.'],['Traverser vers l’autre coin',0,'Trop loin pour être une option de passe.']],
      'L’espacement se lit en fonction du dribble : on ne reste jamais sur la trajectoire du porteur.'),
    Q('cut-curl','offball',[G,W],'Curl','Tu sors d’un écran vers le haut. Ton défenseur te suit dans le dos, collé à toi. Ta lecture ?',
      {o:[O(2,'blockL',0,0,4),O(4,'elbowL',0,0,-8),O(1,'wingL',1,0,20),O(3,'wingR'),O(5,'blockR')],d:[D(2,34,24),D(4,40,32),D(1,20,60),D(3,82,44),D(5,60,18)],a:[A('screen',at('elbowL',0,-8),at('elbowL',-4,-8)),A('cut',at('blockL',0,4),[46,26])]},
      [['Enrouler serré autour de l’écran vers le cercle (curl)',1,'Il te suit : il ne peut pas t’empêcher de couper vers l’intérieur.'],['T’écarter vers le coin (fade)',0,'Le fade sert contre un défenseur qui passe sous l’écran.'],['Remonter tout droit à 3 points',0,'Il est dans ton dos : il revient au contact.'],['Revenir en arrière',0,'Tu perds l’avantage de l’écran.']],
      'Défenseur derrière toi → curl. Défenseur qui passe dessous → fade. Défenseur qui anticipe → backdoor.'),
    Q('cut-watch','cuts',[W,G],'Défenseur qui regarde la balle','Ton défenseur côté faible tourne la tête vers le ballon et te perd de vue. Que fais-tu ?',
      {o:[O(3,'wingL'),O(1,'wingR',1),O(2,'top'),O(4,'cornerR'),O(5,'blockR')],d:[D(3,30,36),D(1,82,48),D(2,50,58),D(4,88,14),D(5,60,18)],a:[A('cut',at('wingL'),[44,14])]},
      [['Couper dans son dos vers le cercle',1,'Il ne te voit plus : la coupe au panier est gratuite.'],['Demander la balle à l’aile',0,'Tu restes loin du danger.'],['Aller poser un écran au meneur',0,'Tu perds un avantage immédiat.'],['Attendre qu’il te regarde',0,'Le moment est maintenant.']],
      'Côté faible, ta meilleure arme est la coupe au bon moment : quand ton défenseur regarde la balle.'),
    Q('tr-2v1','transition',[G,W],'Deux contre un','Contre-attaque à deux contre un. Le défenseur reste au milieu, entre vous deux. Que fais-tu avec la balle ?',
      {o:[O(1,'top',1,0,-6),O(2,'wingR',0,-4,10),O(3,'half'),O(4,'deepL'),O(5,'deepR')],d:[D(1,50,40)],a:[A('dribble',at('half'),at('top',0,-6)),A('cut',at('wingR',-4,10),[66,14])]},
      [['Attaquer jusqu’à ce qu’il s’engage, puis passer',1,'Tu l’obliges à choisir : s’il vient, ton coéquipier est seul.'],['Passer tout de suite',0,'Il n’a rien choisi : il intercepte ou se replace.'],['Tirer à 3 points',0,'Tu gâches un deux contre un.'],['Ralentir pour attendre les autres',0,'Les défenseurs reviennent.']],
      'En surnombre, on fixe le défenseur avant de passer.'),
    Q('tr-3v2','transition',[G,W],'Trois contre deux','Trois contre deux, défenseurs l’un derrière l’autre. Tu passes à l’aile droite, le défenseur du bas sort sur elle. Où va la balle ensuite ?',
      {o:[O(1,'top',0),O(2,'wingR',1,0,-6),O(3,'wingL',0,0,-6),O(4,'deepL'),O(5,'deepR')],d:[D(1,52,54),D(2,74,34)],a:[A('pass',at('top'),at('wingR',0,-6)),A('cut',at('wingL',0,-6),[40,14])]},
      [['Passe transversale vers l’aile gauche qui coupe au cercle',1,'Le défenseur du bas est sorti : personne ne protège le côté opposé.'],['Tir de l’aile droite',0,'Un défenseur est sur elle.'],['Retour au meneur',0,'Tu redonnes le temps à la défense.'],['Dribble vers le cercle',0,'Le défenseur est justement là.']],
      'Trois contre deux : l’aile droite fixe, la balle traverse. Le dernier défenseur ne peut pas couvrir deux côtés.'),
    Q('tr-rimrun','transition',[B],'Rim run','Ton équipe prend le rebond défensif. Tu es l’intérieur. Que fais-tu ?',
      {o:[O(5,'deepL',0,6,0),O(1,'half',1),O(2,'deepR'),O(3,'wingL'),O(4,'wingR')],d:[D(5,56,60),D(1,50,78)],a:[A('cut',at('deepL',6,0),at('rim',0,6))]},
      [['Sprinter droit vers le cercle adverse, même sans la balle',1,'Tu fixes le dernier défenseur ou tu marques facilement : tout le monde est plus libre.'],['Attendre la balle pour la remonter',0,'Ce n’est pas ton rôle, et ça ralentit l’équipe.'],['Trotter jusqu’au poste haut',0,'La défense a le temps de s’organiser.'],['Rester en défense',0,'Tu n’offres rien en attaque.']],
      'Le rim run est la façon la plus simple pour un intérieur de marquer sans système.'),
    Q('sp-dunker','spacing',[B],'Dunker spot','Ton meneur pénètre. Ton défenseur quitte ton côté pour venir l’aider. Tu étais au poste bas. Où vas-tu ?',
      {o:[O(1,'nail',1,6,-6),O(5,'blockR'),O(2,'wingL'),O(3,'cornerL'),O(4,'wingR')],d:[D(1,58,46),D(5,58,26),D(2,20,42),D(3,12,14),D(4,82,44)],a:[A('dribble',at('top'),at('nail',6,-6)),A('cut',at('blockR'),at('dunkR'))]},
      [['Glisser au dunker spot, sous le panier côté ligne de fond',1,'Tu restes dans son angle de passe, loin de ton défenseur qui aide.'],['Monter au poste haut',0,'Tu ramènes ton défenseur vers le porteur.'],['Aller poser un écran au meneur',0,'Il est déjà en pénétration.'],['Te placer devant le cercle',0,'Tu bouches sa route.']],
      'L’intérieur sans ballon se place là où son défenseur ne peut pas aider et le surveiller à la fois.'),
    Q('reb-boxout','rebound',[B,W],'Box-out','Le tir part. Ton adversaire direct est à deux pas de toi. Ta priorité ?',
      {o:[O(4,'blockR',0,0,6),O(2,'wingL',1),O(1,'top'),O(3,'cornerR'),O(5,'blockL')],d:[D(4,62,24),D(2,20,42),D(1,50,58),D(3,86,14),D(5,40,18)],a:[A('pass',at('wingL'),at('rim'))]},
      [['Le trouver, faire contact, pivoter dos contre lui, puis aller au ballon',1,'Le rebond se gagne d’abord au placement, ensuite à la détente.'],['Regarder le ballon et sauter au bon moment',0,'Il passe devant toi pendant que tu regardes.'],['Courir directement sous le panier',0,'Beaucoup de rebonds partent loin du cercle.'],['Partir en contre-attaque',0,'Pas avant que ton équipe ait le ballon.']],
      'Contact d’abord, ballon ensuite.'),
    Q('reb-weak','rebound',[B,W],'Côté du rebond','Un tir à 3 points part de l’aile droite. Où le rebond a-t-il le plus de chances de tomber ?',
      {o:[O(2,'wingR',1),O(1,'top'),O(3,'wingL'),O(4,'blockL'),O(5,'blockR')],d:[D(2,80,46),D(1,50,58),D(3,22,42),D(4,40,20),D(5,60,18)],a:[A('pass',at('wingR'),at('rim'))]},
      [['Du côté opposé au tir',1,'Un tir de côté raté ressort le plus souvent vers le côté faible : c’est là qu’on va au rebond offensif.'],['Juste devant le tireur',0,'Seulement sur les tirs très courts.'],['Toujours sous le cercle',0,'Les tirs de loin donnent des rebonds longs.'],['Au centre, à la ligne des lancers',0,'Moins fréquent sur un tir de côté.']],
      'Au rebond offensif, anticipe le côté faible sur les tirs de côté.'),
    Q('rim-vert','rim-protection',[B],'Verticalité','Un attaquant arrive lancé au cercle. Tu es déjà bien placé devant lui. Que fais-tu ?',
      {o:[O(1,'blockR',1,-4,0),O(2,'wingL'),O(3,'cornerR'),O(4,'cornerL'),O(5,'elbowL')],d:[D(5,54,16),D(1,70,30),D(2,20,42),D(3,86,14),D(4,12,14)],a:[A('dribble',at('wingR'),at('blockR',-4,0))]},
      [['Sauter droit, bras verticaux, sans avancer',1,'La règle protège le défenseur qui reste dans son cylindre : pas de faute, tir contesté.'],['Frapper le ballon en descendant',0,'Faute presque systématique.'],['Laisser passer pour éviter la faute',0,'Deux points faciles.'],['Avancer vers lui pour prendre le passage en force',0,'Trop tard, ou sous le panier dans le demi-cercle.']],
      'La verticalité est l’arme du protecteur de cercle : grand, droit, discipliné.'),
    Q('post-double','post',[B],'Prise à deux au poste','Tu reçois au poste bas. Le défenseur du meneur, en haut, descend te prendre à deux. Où passes-tu ?',
      {o:[O(5,'blockR',1),O(1,'top'),O(2,'wingR'),O(3,'wingL'),O(4,'cornerL')],d:[D(5,58,20),D(1,62,28),D(2,82,44),D(3,22,42),D(4,12,14)],a:[A('cut',[50,58],[62,28])]},
      [['Au meneur, dont le défenseur est venu doubler',1,'La prise à deux vient de quelque part : la passe part vers le joueur laissé seul.'],['Tirer en pivot',0,'Deux défenseurs sur toi.'],['Dribbler pour sortir',0,'La prise à deux cherche justement ça.'],['Coin opposé en passe lobée',0,'Trop long et trop lent.']],
      'Au poste, garde le ballon haut et lis d’où vient la prise à deux.'),
    Q('press-trap','press-break',[G],'Contre la presse','Toute la défense presse. Tu dribbles le long de la ligne de touche et un deuxième défenseur arrive. Que fais-tu ?',
      {o:[O(1,'deepR',1,10,-4),O(2,'half',0,-10,-20),O(3,'wingL',0,0,30),O(4,'deepL'),O(5,'top')],d:[D(1,82,80),D(2,76,70),D(3,40,70),D(4,20,60),D(5,50,50)],a:[A('pass',at('deepR',10,-4),at('half',-10,-20))]},
      [['Passer vers le milieu avant que la trappe se ferme',1,'Le milieu casse la presse : la défense doit tout recommencer.'],['Continuer vers le coin',0,'Ligne de touche + ligne médiane = deux défenseurs supplémentaires.'],['Garder la balle et protéger',0,'5 secondes, ou perte de balle.'],['Passe lobée vers l’avant',0,'Passe lente, souvent interceptée.']],
      'Contre une presse : on évite les coins, on joue vite vers le milieu.'),
    Q('fin-lowman','finishing-reads',[G,W],'Pénétration et low man','Tu pénètres côté droit. Le défenseur du coin opposé monte t’aider sous le panier. Qui est libre ?',
      {o:[O(1,'blockR',1,-6,6),O(4,'cornerL'),O(2,'wingL'),O(3,'wingR'),O(5,'elbowR')],d:[D(4,44,20),D(1,68,28),D(2,22,42),D(3,82,44),D(5,64,40)],a:[A('dribble',at('wingR'),at('blockR',-6,6)),A('cut',[10,12],[44,20])]},
      [['Le joueur dans le coin opposé',1,'Le low man a quitté son coin : passe au sol ou lobée vers lui.'],['Toi, en finissant contre lui',0,'Il est bien placé devant le cercle.'],['L’aile côté ballon',0,'Son défenseur est toujours là.'],['Le poste haut',0,'Couvert.']],
      'La meilleure passe d’un pénétrateur va souvent dans le coin opposé.'),
    Q('fin-nail','finishing-reads',[G,W],'Aide au milieu','Tu pénètres par le milieu. Le défenseur de l’aile gauche fait un pas vers toi (aide au milieu de la raquette). Où est la passe ?',
      {o:[O(1,'nail',1,0,6),O(2,'wingL'),O(3,'wingR'),O(4,'cornerL'),O(5,'blockR')],d:[D(2,34,44),D(1,50,52),D(3,82,44),D(4,12,14),D(5,60,18)],a:[A('dribble',at('top'),at('nail',0,6))]},
      [['À l’aile gauche, le joueur que l’aide a quitté',1,'Passe courte et rapide : il tire avant que l’aide revienne.'],['Continuer au cercle',0,'Le grand t’attend.'],['À l’aile droite',0,'Son défenseur n’a pas bougé.'],['Tir en suspension',0,'Contesté par l’aide.']],
      'Une pénétration n’est pas un tir : c’est une question posée à la défense.')
  ];

  // Placement : touche le terrain là où tu dois être. Cible en unités terrain, rayon toléré r.
  const place = [
    {id:'pl-weak-corner',theme:'help-defense',groups:[G,W,B],title:'Aide côté faible',prompt:'Balle à l’aile droite. Tu défends le joueur du coin gauche, à deux passes. Où te places-tu ?',court:{o:[O(2,'wingR',1),O(3,'cornerL'),O(1,'top'),O(5,'blockR'),O(4,'wingL')],d:[D(2,80,46),D(1,52,58),D(5,60,18),D(4,24,42)]},you:'X3',target:[40,20],r:10,lesson:'À deux passes, tu es dans la raquette, au niveau du cercle : tu vois la balle et ton joueur, et tu protèges le panier.'},
    {id:'pl-gap',theme:'help-defense',groups:[G,W],title:'Une passe d’écart',prompt:'Balle en tête. Tu défends l’aile gauche, à une passe. Où te places-tu ?',court:{o:[O(1,'top',1),O(2,'wingL'),O(3,'wingR'),O(4,'cornerR'),O(5,'blockR')],d:[D(1,50,58),D(3,78,42),D(4,86,14),D(5,60,18)]},you:'X2',target:[24,48],r:9,lesson:'À une passe : un peu décalé vers la balle, sur la ligne balle-joueur. Assez près pour sortir, assez rentré pour fermer l’espace.'},
    {id:'pl-split',theme:'help-defense',groups:[W,B],title:'Ligne médiane',prompt:'Balle à l’aile droite. Tu défends l’aile gauche, à deux passes. Où te places-tu ?',court:{o:[O(2,'wingR',1),O(3,'wingL'),O(1,'top'),O(4,'cornerR'),O(5,'blockR')],d:[D(2,80,46),D(1,58,58),D(4,88,14),D(5,60,18)]},you:'X3',target:[46,38],r:10,lesson:'Deux passes : un pied sur la ligne qui coupe le terrain en deux, vers le milieu de la raquette.'},
    {id:'pl-drop',theme:'pnr-screener',groups:[B],title:'Défendre en drop',prompt:'Pick & roll en tête. Consigne : défense en drop. Tu défends le poseur. Où te places-tu au moment de l’écran ?',court:{o:[O(1,'top',1,4,0),O(5,'top',0,-4,-6),O(2,'wingL'),O(3,'cornerR'),O(4,'cornerL')],d:[D(1,56,70),D(2,22,42),D(3,86,14),D(4,12,14)]},you:'X5',target:[50,30],r:9,lesson:'En drop, tu recules au niveau de la ligne des lancers, entre le porteur et le cercle : tu contiens le porteur et gardes le rouleur.'},
    {id:'pl-transition-d',theme:'transition',groups:[G,W,B],title:'Premier de retour',prompt:'Tir raté, l’adversaire récupère. Tu es le premier défenseur de retour. Où vas-tu d’abord ?',court:{o:[O(1,'half',1,0,2),O(2,'deepL'),O(3,'deepR')],d:[D(1,50,70)]},you:'X',target:[50,18],r:10,lesson:'Le premier de retour protège le cercle, puis arrête le ballon. Jamais l’inverse.'},
    {id:'pl-drift',theme:'offball',groups:[G,W],title:'Glisser au coin',prompt:'Ton meneur pénètre par le milieu. Tu es à l’aile gauche. Où vas-tu ?',court:{o:[O(1,'nail',1,0,8),O(3,'wingR'),O(4,'cornerR'),O(5,'blockR')],d:[D(1,50,52),D(2,30,40),D(3,82,44),D(4,88,14),D(5,60,18)]},you:'2',offense:true,target:[7,10],r:11,lesson:'Pénétration par le milieu : l’aile glisse vers le coin. Tu restes visible et loin de ton défenseur qui aide.'},
    {id:'pl-lift',theme:'offball',groups:[G,W],title:'Remonter à l’aile',prompt:'Ton coéquipier pénètre côté ligne de fond, vers ton coin droit. Où vas-tu ?',court:{o:[O(2,'wingR',1,4,-22),O(1,'top'),O(4,'wingL'),O(5,'blockL')],d:[D(2,84,34),D(3,86,14),D(1,50,58),D(4,20,42),D(5,40,18)]},you:'3',offense:true,target:[86,44],r:11,lesson:'Pénétration côté ligne de fond : le coin remonte à l’aile, le porteur garde son couloir et une passe arrière.'},
    {id:'pl-dunker',theme:'spacing',groups:[B],title:'Dunker spot',prompt:'Ton meneur pénètre du côté droit. Ton défenseur sort l’aider. Tu étais au poste bas droit. Où vas-tu ?',court:{o:[O(1,'nail',1,6,-6),O(2,'wingL'),O(3,'cornerL'),O(4,'wingR')],d:[D(1,58,46),D(5,58,26),D(2,20,42),D(3,12,14),D(4,82,44)]},you:'5',offense:true,target:[73,6],r:10,lesson:'Le dunker spot : sous le panier côté ligne de fond, hors de la raquette. Ton défenseur ne peut pas aider et te garder.'},
    {id:'pl-oreb',theme:'rebound',groups:[B,W],title:'Rebond offensif',prompt:'Tir à 3 points depuis l’aile droite. Tu es intérieur côté gauche. Où vas-tu chercher le rebond ?',court:{o:[O(2,'wingR',1),O(1,'top'),O(3,'wingL'),O(4,'blockR')],d:[D(2,80,46),D(1,50,58),D(3,22,42),D(4,60,18),D(5,40,20)]},you:'5',offense:true,target:[30,14],r:11,lesson:'Les tirs de côté ratés tombent souvent du côté opposé : c’est là que se prend le rebond offensif.'}
  ];

  // Fins de match et gestion du rythme. Chronomètre de possession FIBA : 24 s, remis à 14 s sur rebond offensif.
  const clutch = [
    {id:'cl-hold',theme:'tempo',title:'Garder l’avantage',situation:'+2 · 0:35 à jouer · balle à vous',prompt:'Chrono de possession : 24 s. Que faites-vous ?',choices:[['Utiliser tout le chrono de possession avant de tirer',1,'Il ne restera qu’environ 11 s à l’adversaire, et un tir raté ne suffit plus pour perdre.'],['Attaquer vite pour prendre +4',0,'Tu rends à l’adversaire le temps d’avoir deux possessions.'],['Faire tourner sans jamais tirer',0,'Violation des 24 s : balle perdue.'],['Tir à 3 points rapide',0,'Même raison : trop de temps rendu.']],lesson:'En tête en fin de match, le chrono est ton allié : chaque seconde que tu consommes est une seconde en moins pour eux.'},
    {id:'cl-last',theme:'tempo',title:'Dernière possession',situation:'Égalité · 0:18 à jouer · balle à vous',prompt:'Quand lancer l’attaque ?',choices:[['Attaquer vers 7-8 s pour tirer vers 3-4 s',1,'Assez tard pour que l’adversaire n’ait pas de vraie réponse, assez tôt pour une seconde chance.'],['Tout de suite',0,'L’adversaire aura le temps de répondre.'],['Tirer au buzzer exactement',0,'Aucune marge en cas de ballon perdu ou de contre.'],['Attendre un temps mort',0,'Le temps mort peut aider, mais la question est le moment du tir.']],lesson:'Dernier tir : on vise un tir de qualité en gardant un peu de temps pour le rebond.'},
    {id:'cl-2for1',theme:'tempo',title:'Deux pour un',situation:'Fin de quart-temps · 0:38 à jouer · balle à vous',prompt:'Quel est le plan ?',choices:[['Prendre un bon tir rapidement, avant 30 s environ, pour récupérer la dernière possession',1,'L’adversaire tire à son tour avant la fin de son chrono : vous aurez la balle une dernière fois.'],['Jouer lentement et tirer au buzzer',0,'Vous n’avez qu’une possession au lieu de deux.'],['Tirer tout de suite, peu importe le tir',0,'Deux pour un, oui, mais avec un bon tir.'],['Garder la balle jusqu’à la fin',0,'Violation des 24 s.']],lesson:'Deux pour un : dans les 35-40 dernières secondes, un bon tir tôt vaut deux possessions.'},
    {id:'cl-down3',theme:'tempo',title:'Menés de trois',situation:'−3 · 0:08 à jouer · attaque placée',prompt:'Quel tir cherchez-vous ?',choices:[['Un tir à 3 points propre, rapidement',1,'Un panier à 2 points ne suffit pas et il n’y a plus le temps pour deux possessions.'],['Un lay-up facile',0,'Il reste −1 et le temps est presque écoulé.'],['Attendre la faute',0,'L’adversaire ne la fera pas sur un tir à 2 points.'],['Un tir mi-distance',0,'Même problème : 2 points ne suffisent pas.']],lesson:'Compte les points et les secondes avant de choisir le tir.'},
    {id:'cl-down6',theme:'tempo',title:'Menés de six',situation:'−6 · 1:30 à jouer · balle à vous',prompt:'Quel rythme ?',choices:[['Jouer vite mais prendre de bons tirs, défendre fort ensuite',1,'Il reste assez de possessions : un mauvais tir précipité coûte plus cher qu’une possession rapide et propre.'],['Faire faute tout de suite en défense',0,'Trop tôt : 1:30 laisse encore plusieurs possessions.'],['Chercher uniquement des tirs à 3 points',0,'Pas encore nécessaire : les points faciles comptent aussi.'],['Prendre tout le chrono',0,'Vous perdez du temps quand vous êtes menés.']],lesson:'Mené, on accélère sans jeter la qualité du tir.'},
    {id:'cl-press',theme:'press-break',title:'Sous pression',situation:'+5 · 2:00 à jouer · l’adversaire presse tout terrain',prompt:'Ta priorité ?',choices:[['Sécuriser la balle : passes courtes, aller vers le ballon, éviter les coins',1,'Chaque balle perdue offre deux points faciles.'],['Chercher la passe longue pour marquer vite',0,'Passe la plus facile à intercepter.'],['Dribbler seul contre la presse',0,'La trappe arrive.'],['Tirer vite pour ne pas perdre la balle',0,'Un mauvais tir équivaut à une balle perdue.']],lesson:'En tête contre une presse : la possession avant le panier.'},
    {id:'cl-run',theme:'tempo',title:'Casser un run',situation:'L’adversaire vient de marquer 8 points d’affilée · pas de temps mort',prompt:'En tant que meneur, que fais-tu ?',choices:[['Ralentir : une possession longue, ton meilleur système ou la balle à l’intérieur',1,'Tu casses leur rythme et tu cherches un tir de qualité.'],['Accélérer pour répondre tout de suite',0,'Souvent un tir rapide raté qui prolonge la série.'],['Prendre le tir toi-même quoi qu’il arrive',0,'Le problème est collectif.'],['Attendre que ça passe',0,'Il faut agir sur le rythme.']],lesson:'Le meneur contrôle le tempo. Un run adverse se casse par une possession maîtrisée.'},
    {id:'cl-bonus',theme:'tempo',title:'Équipe en pénalité',situation:'L’adversaire a 5 fautes d’équipe dans le quart-temps',prompt:'Comment en profiter ?',choices:[['Attaquer le cercle : chaque faute défensive donne des lancers',1,'En FIBA, dès la 5e faute d’équipe du quart-temps, les fautes défensives donnent des lancers francs.'],['Tirer davantage à 3 points',0,'Moins de contacts, donc moins de lancers.'],['Ralentir sans attaquer',0,'Tu ne profites pas de l’avantage.'],['Rien ne change',0,'Tout change : chaque contact peut valoir deux points.']],lesson:'Connaître la situation de fautes change le plan d’attaque.'},
    {id:'cl-zone',theme:'tempo',title:'Contre une zone 2-3',situation:'L’adversaire passe en zone 2-3',prompt:'Où envoyer la balle pour la casser ?',choices:[['Au poste haut, au milieu de la ligne des lancers',1,'Le centre de la zone est son point faible : de là, on attaque le coin, le cercle et la ligne de fond.'],['Dribbler pour la traverser',0,'La zone se referme sur le dribble.'],['Tirer vite de loin',0,'C’est ce que la zone t’offre, pas ce qui la casse.'],['Passer uniquement autour',0,'Sans pénétrer la zone, tu ne la fais pas bouger.']],lesson:'Une zone se casse par le milieu et par des passes qui la font coulisser.'},
    {id:'cl-1s',theme:'tempo',title:'Une seconde et demie',situation:'−2 · 1,5 s à jouer · remise en jeu sur le côté',prompt:'Quel type d’action ?',choices:[['Réception et tir immédiat, ou passe lobée au cercle',1,'Pas le temps de dribbler : la balle doit partir dès la réception.'],['Réception, un dribble, tir',0,'Le dribble consomme le temps restant.'],['Deux passes puis tir',0,'Impossible en 1,5 s.'],['Isolation du meilleur joueur',0,'Pas le temps de créer.']],lesson:'Moins de deux secondes : tout se joue sur la réception.'}
  ];

  const vocab = [
    ['drop','Drop','pnr-handler','Le défenseur du poseur recule sous l’écran, vers la ligne des lancers, pour protéger le cercle.'],
    ['hedge','Hedge (show)','pnr-handler','Le défenseur du poseur sort fort devant le porteur pour le ralentir, puis revient sur son joueur.'],
    ['switch','Switch','pnr-handler','Les deux défenseurs échangent leurs joueurs sur l’écran.'],
    ['blitz','Blitz','pnr-handler','Les deux défenseurs prennent le porteur à deux au moment de l’écran.'],
    ['ice','ICE','pnr-handler','Sur un pick & roll de côté, la défense interdit l’écran et envoie le porteur vers la ligne de fond.'],
    ['reject','Refus d’écran','pnr-handler','Le porteur refuse l’écran et attaque du côté opposé.'],
    ['shortroll','Short roll','pnr-screener','Le poseur reçoit à mi-chemin, vers la ligne des lancers, et joue en surnombre après une prise à deux.'],
    ['slip','Slip','pnr-screener','Le poseur quitte l’écran avant le contact pour couper vers le cercle.'],
    ['pop','Pop','pnr-screener','Le poseur s’écarte vers l’extérieur pour tirer au lieu de rouler.'],
    ['rescreen','Re-screen','pnr-screener','Le poseur repose un écran quand le défenseur est passé dessous.'],
    ['tag','Tag','help-defense','Le défenseur côté faible touche le rouleur pour le ralentir, puis revient sur son joueur.'],
    ['nail','Nail','help-defense','Le milieu de la ligne des lancers : poste d’aide face à une pénétration axiale.'],
    ['lowman','Low man','help-defense','Le défenseur côté faible le plus proche du cercle, responsable de l’aide au panier.'],
    ['stunt','Stunt','help-defense','Feinte d’aide pour faire hésiter le porteur, puis retour sur son joueur.'],
    ['xout','X-out','help-defense','Rotation après passe transversale : le défenseur le plus proche sort, les autres se croisent derrière.'],
    ['helpside','Côté faible','help-defense','La moitié du terrain opposée au ballon, où les défenseurs se placent pour aider.'],
    ['closeout','Closeout','closeout','Sortie sur un tireur : sprint, puis petits pas, main haute, en équilibre.'],
    ['drift','Drift','offball','Sur une pénétration par le milieu, l’aile glisse vers le coin.'],
    ['lift','Lift','offball','Sur une pénétration côté ligne de fond, le joueur du coin remonte vers l’aile.'],
    ['curl','Curl','offball','Enroulement serré autour d’un écran vers le cercle, quand le défenseur suit derrière.'],
    ['fade','Fade','offball','Écartement vers le coin après un écran, quand le défenseur passe dessous.'],
    ['flare','Flare','offball','Écran posé dans le dos du tireur pour qu’il s’écarte loin du ballon.'],
    ['backdoor','Backdoor','cuts','Coupe dans le dos d’un défenseur qui surjoue la ligne de passe.'],
    ['gap','Gap','finishing-reads','L’espace entre deux défenseurs, là où une pénétration provoque l’aide.'],
    ['dunker','Dunker spot','spacing','Sous le panier côté ligne de fond, hors de la raquette : place de l’intérieur sur une pénétration.'],
    ['seal','Seal','post','Garder son défenseur dans son dos pour recevoir près du cercle.'],
    ['rimrun','Rim run','transition','Course de l’intérieur droit vers le cercle en contre-attaque.'],
    ['skip','Passe transversale','transition','Passe par-dessus la défense, d’un côté du terrain à l’autre.'],
    ['dho','Hand-off (DHO)','offball','Remise en main : le porteur donne la balle à un coéquipier qui passe tout près, en lui faisant écran.'],
    ['boxout','Box-out','rebound','Écran au rebond : contact, pivot, dos contre l’adversaire.'],
    ['vertical','Verticalité','rim-protection','Le défenseur peut sauter bras verticaux dans son cylindre sans commettre de faute.'],
    ['twoforone','Deux pour un','tempo','Prendre un bon tir rapide en fin de quart-temps pour récupérer la dernière possession.'],
    ['bonus','Pénalité d’équipe','tempo','En FIBA, dès la 5e faute d’équipe du quart-temps, chaque faute défensive donne des lancers francs.']
  ].map(([id,term,theme,def])=>({id,term,theme,def}));

  // Guide pick & roll : reconnaître la défense, puis les lectures du porteur et du poseur.
  const pnrGuide = [
    {id:'drop',name:'Drop',spot:'Défenseur du poseur bas, vers la ligne des lancers.',handler:'Mi-distance, floater, ou attaquer le grand pour le fixer.',screener:'Rouler fort pour occuper le grand ; s’écarter si tu tires.',trap:'Foncer au cercle sans regarder : le grand t’attend.',court:'pnr-drop'},
    {id:'hedge',name:'Hedge',spot:'Défenseur du poseur haut et à plat devant le porteur.',handler:'Reculer d’un dribble, créer l’angle, servir le roll.',screener:'Rouler tôt, dès que ton défenseur sort.',trap:'Forcer entre les deux défenseurs.',court:'pnr-hedge'},
    {id:'switch',name:'Switch',spot:'Les défenseurs annoncent et échangent.',handler:'Attaquer le grand en vitesse, ou donner au poseur qui scelle le petit.',screener:'Glisser tôt ou sceller le petit défenseur près du cercle.',trap:'Tirer sur la main du grand dès le switch.',court:'pnr-switch'},
    {id:'blitz',name:'Blitz',spot:'Deux défenseurs sur le porteur dès l’écran.',handler:'Lâcher la balle vite, vers le milieu.',screener:'Short roll : recevoir et jouer le 4 contre 3.',trap:'Dribbler à reculons dans la trappe.',court:'pnr-blitz'},
    {id:'ice',name:'ICE',spot:'Pick & roll de côté, défenseur du porteur au-dessus de l’écran.',handler:'Aller vers la ligne de fond et lire le grand, ou refuser tôt.',screener:'Pop ou slip : ton défenseur est parti vers la ligne de fond.',trap:'Forcer l’écran que la défense interdit.',court:'pnr-ice'},
    {id:'under',name:'Sous l’écran',spot:'Défenseur du porteur qui passe entre l’écran et le cercle.',handler:'Tirer derrière l’écran si tu tires bien.',screener:'Reposer l’écran plus haut.',trap:'Pénétrer dans une raquette regroupée.',court:'pnr-under'}
  ];

  // Analyse de match : grille courte, questions selon le poste.
  const review = [
    {id:'good',label:'Une lecture réussie : situation et décision',type:'text',groups:[G,W,B]},
    {id:'miss',label:'Une lecture ratée, et ce que tu ferais maintenant',type:'text',groups:[G,W,B]},
    {id:'pnrD',label:'Défense sur pick & roll vue le plus souvent',type:'choice',options:['Drop','Hedge','Switch','Blitz','ICE','Sous l’écran','Pas vu'],groups:[G,W,B]},
    {id:'tempo',label:'Après une série adverse, tu as su ralentir le jeu ?',type:'choice',options:['Oui','Non','Pas eu besoin'],groups:[G]},
    {id:'cuts',label:'Coupes au cercle réussies',type:'choice',options:['0','1','2','3 ou plus'],groups:[W]},
    {id:'boxout',label:'Box-out sur chaque tir ?',type:'choice',options:['Toujours','Souvent','Rarement'],groups:[B,W]},
    {id:'help',label:'Ta meilleure action défensive sans ballon',type:'text',groups:[G,W,B]},
    {id:'legs',label:'Quand tes jambes ont lâché ?',type:'choice',options:['Jamais','1er quart','2e quart','3e quart','4e quart'],groups:[G,W,B]},
    {id:'grade',label:'Ta lecture du jeu sur ce match',type:'choice',options:['1','2','3','4','5'],groups:[G,W,B]}
  ];

  // ---- Défense : lectures, placements, fins de match ----
  const START = {o:[[1,60,78,true],[5,44,50,false],O(2,'wingL'),O(3,'cornerR'),O(4,'cornerL')],d:[D(1,60,71),D(5,45,44),D(2,20,42),D(3,86,12),D(4,12,12)],a:[]};
  const SCREEN = {o:{5:[55,70]},d:{5:[52,62]},a:[['cut',44,50,55,70]]};
  quiz.push(
    Q('def-deadball','on-ball',[G,W],'Dribble arrêté','Le porteur que tu défends vient d’arrêter son dribble à l’aile. Que fais-tu ?',
      {o:[[2,86,56,true],O(1,'top'),O(3,'cornerL'),O(4,'blockL'),O(5,'elbowL')],d:[D(2,80,50),D(1,50,58),D(3,14,14),D(4,40,20),D(5,42,36)],a:[]},
      [['Le coller, mains actives sur le ballon, sans faute',1,'Il ne peut plus dribbler : ta pression gêne la passe et fait tourner le chrono.'],['Reculer pour éviter la pénétration',0,'Il n’a plus le droit de dribbler : il ne peut plus pénétrer.'],['Partir aider au cercle',0,'Tu lui laisses une passe facile, à l’arrêt.'],['Sauter pour intercepter la passe',0,'Une feinte et tu es hors du jeu.']],
      'Dribble arrêté = porteur vulnérable. On étouffe, on ne recule pas.'),
    Q('def-chase','pnr-defense',[G,W],'Passer l’écran (drop)','Consigne : drop. Tu défends le porteur (X1) et l’écran arrive sur toi. Comment le passes-tu ?',
      START,
      [['Par-dessus l’écran, collé au porteur, en le poursuivant par derrière',1,'Tu restes sur sa hanche pendant que X5, bas, le contient devant : il est pris entre vous deux.'],['Sous l’écran',0,'Contre un bon tireur, c’est un tir ouvert, et X5 n’est pas là pour le contester.'],['Changer de joueur avec X5',0,'Ce n’est pas la consigne : X5 est bas, pas au niveau de l’écran.'],['Attendre de l’autre côté de l’écran',0,'Le porteur tire ou pénètre pendant que tu attends.']],
      'Drop : le défenseur du porteur passe par-dessus et poursuit, le grand contient. Les deux ont un rôle.'),
    Q('def-hedge-x5','pnr-defense',[B],'Hedge : le rôle du grand','Consigne : hedge. Tu es X5, le défenseur du poseur. L’écran est posé. Que fais-tu ?',
      START,
      [['Sortir à plat devant le porteur pour le faire reculer, puis revenir sur ton joueur dès que X1 est revenu',1,'Le hedge ralentit le porteur une seconde, le temps que X1 revienne. Ensuite, retour immédiat sur le rouleur.'],['Rester bas sous l’écran',0,'C’est un drop, pas un hedge.'],['Prendre le porteur à deux jusqu’à ce qu’il passe',0,'C’est un blitz : le rouleur est seul.'],['Changer définitivement de joueur',0,'C’est un switch.']],
      'Chaque couverture a son rôle pour le grand. Hedge : sortir fort, revenir vite.'),
    Q('def-ice','pnr-defense',[G,W],'Défendre en ICE','Pick & roll sur le côté, consigne ICE. Le poseur arrive côté milieu. Tu défends le porteur. Où te places-tu ?',
      {o:[[1,86,46,true],[5,70,32,false],O(2,'wingL'),O(3,'top'),O(4,'cornerL')],d:[D(1,82,40),D(5,68,26),D(2,20,42),D(3,50,58),D(4,12,12)],a:[]},
      [['Au-dessus de l’écran, côté milieu, pour pousser le porteur vers la ligne de fond',1,'Tu lui interdis l’écran : il part vers la ligne de fond où X5 l’attend.'],['Sous l’écran, entre le poseur et le cercle',0,'Tu lui laisses l’écran et le milieu.'],['Côté ligne de fond',0,'Tu le pousses vers l’écran et le milieu : l’inverse de la consigne.'],['Le plus loin possible pour anticiper le tir',0,'Il pénètre sans opposition.']],
      'ICE : interdire le milieu, envoyer le porteur vers la ligne de fond et le grand.'),
    Q('def-switch-talk','pnr-defense',[G,W,B],'Switch : la clé','Consigne : switch sur tous les écrans. Qu’est-ce qui fait qu’un switch fonctionne ?',
      START,
      [['Annoncer « switch » tôt et fort, et prendre le nouveau joueur sans laisser d’espace',1,'Un switch silencieux crée un joueur libre. La voix d’abord, le contact ensuite.'],['Attendre de voir ce que fait le porteur',0,'Le temps d’hésiter, le poseur a glissé.'],['Laisser le grand reculer sous le cercle',0,'Le porteur prend le tir.'],['Changer seulement si le porteur pénètre',0,'Trop tard : il faut décider avant l’écran.']],
      'La défense se parle. Un switch, un écran, une aide : tout s’annonce.'),
    Q('def-pop','pnr-defense',[B],'Contre un poseur qui tire','Le poseur tire bien à 3 points et s’écarte après l’écran (pop). Tu es X5 en drop. Que fais-tu ?',
      START,
      [['Remonter tout de suite pour contester son tir',1,'Un drop contre un poseur qui tire, c’est un tir ouvert. X1 doit contenir le porteur un instant.'],['Rester en drop sous le cercle',0,'Il tire seul à 3 points.'],['Aller sur le porteur',0,'Tu laisses le tireur seul.'],['Rester dans la raquette pour le rebond',0,'Le rebond vient après le tir : il faut d’abord le gêner.']],
      'Adapte la couverture au poseur : un grand qui tire ne se défend pas comme un grand qui roule.'),
    Q('def-trail','off-ball-defense',[G,W],'Défendre la sortie d’écran','Ton joueur, un tireur, sort d’un écran vers l’aile. Tu es son défenseur. Comment le suis-tu ?',
      {o:[[2,36,15,false],[4,36,30,false],[1,14,56,true],O(3,'wingR'),O(5,'blockR')],d:[D(2,40,20),D(4,40,34),D(1,20,58),D(3,82,44),D(5,60,18)],a:[['screen',36,30,30,30]]},
      [['Collé dans son dos (trail) pour lui refuser le tir ; le défenseur du poseur aide sur la coupe',1,'Derrière lui, tu empêches la réception pour tirer. S’il enroule vers le cercle, le défenseur du poseur est là.'],['Passer sous l’écran',0,'Contre un tireur, il reçoit seul à 3 points.'],['Attendre à l’aile où il va recevoir',0,'Il change de direction et coupe au cercle.'],['Changer de joueur à chaque écran',0,'Possible en consigne d’équipe, mais pas ta décision seule.']],
      'Sur un tireur, on suit derrière. Sur un non-tireur, on peut couper sous l’écran.'),
    Q('def-deny','off-ball-defense',[G,W],'Refuser la passe','Ballon en tête. Ton joueur à l’aile est un bon tireur. Consigne : refuser. Quelle posture ?',
      {o:[O(1,'top',1),O(2,'wingL'),O(3,'wingR'),O(4,'cornerR'),O(5,'blockR')],d:[D(1,50,58),D(3,78,42),D(4,86,14),D(5,60,18)],a:[]},
      [['Main et pied avant dans la ligne de passe, tête tournée pour voir balle et joueur',1,'Tu gênes la passe sans perdre ton joueur de vue.'],['Dos au ballon, collé au joueur',0,'Tu ne vois plus la passe, ni l’aide dont tu pourrais avoir besoin.'],['Face au ballon, loin du joueur',0,'Il reçoit sans pression.'],['Sauter dans la ligne dès que le meneur arme',0,'Une feinte et il part en backdoor.']],
      'Refuser, c’est voir les deux : la balle et ton joueur. S’il coupe dans ton dos, le low man aide.'),
    Q('def-nail','help-defense',[G,W],'Aide au nail','Le porteur de l’aile gauche pénètre vers le milieu. Tu défends le meneur en tête, à une passe. Que fais-tu ?',
      {o:[[2,14,48,true],O(1,'top'),O(3,'wingR'),O(4,'cornerR'),O(5,'blockL')],d:[D(2,20,46),D(1,48,58),D(3,82,44),D(4,88,14),D(5,40,18)],a:[]},
      [['Faire un pas vers le nail pour le ralentir, puis revenir sur le meneur',1,'Au milieu de la ligne des lancers, un pas suffit à couper la pénétration axiale.'],['Rester sur le meneur quoi qu’il arrive',0,'Le porteur arrive au cercle sans être gêné.'],['Aller le prendre à deux jusqu’au bout',0,'Le meneur est seul pour tirer.'],['Reculer sous le cercle',0,'Trop loin : il tire à mi-distance.']],
      'Aide au nail : un pas pour ralentir, un pas pour revenir.'),
    Q('def-sink','help-defense',[W,B],'Aider l’aideur','Le porteur pénètre côté ligne de fond droite. X4, le low man, monte l’aider. Tu es X3 à l’aile gauche. Que fais-tu ?',
      {o:[[2,86,44,true],O(4,'cornerL'),O(3,'wingL'),O(1,'top'),O(5,'blockR')],d:[D(2,82,40),D(4,38,18),D(3,26,40),D(1,50,58),D(5,60,20)],a:[]},
      [['Descendre (sink) vers le joueur que X4 a laissé',1,'L’aideur a laissé quelqu’un : c’est toi qui le couvres, et le joueur le plus loin du ballon devient le moins dangereux.'],['Rester sur ton joueur à l’aile',0,'Le joueur du coin est seul sous le panier.'],['Aider aussi sur le porteur',0,'Trois défenseurs sur un joueur : deux attaquants libres.'],['Sortir sur le meneur',0,'Il est déjà défendu.']],
      'Une aide en appelle une autre : chaque défenseur couvre celui qui vient de quitter son joueur.'),
    Q('def-2v1','transition-defense',[G,W,B],'Seul contre deux','Contre-attaque : tu es seul contre deux. Que fais-tu ?',
      {o:[[1,50,80,true],[2,74,74,false],O(3,'deepL')],d:[D(1,50,50)],a:[]},
      [['Reculer entre les deux, feinter vers le porteur pour le faire hésiter, protéger le cercle',1,'Tu gagnes du temps pour que l’aide revienne, sans t’engager trop tôt sur un seul joueur.'],['Sauter sur le porteur tout de suite',0,'Une passe et c’est un lay-up.'],['Suivre le joueur sans ballon',0,'Le porteur va seul au panier.'],['Faire faute systématiquement',0,'Tu risques une faute antisportive, et ça ne règle rien.']],
      'Seul contre deux : gagner du temps, protéger le cercle, faire hésiter.'),
    Q('def-3v2','transition-defense',[G,W,B],'Défense en tandem','Trois contre deux, défense en tandem. Tu es le défenseur du haut. Ton rôle ?',
      {o:[[1,50,88,true],[2,80,80,false],[3,20,80,false]],d:[D(1,50,58),D(2,50,24)],a:[]},
      [['Arrêter la balle au-dessus de la raquette, puis redescendre vers le cercle quand elle part à l’aile',1,'Le défenseur du bas prend la première passe ; toi, tu redescends couvrir le côté opposé.'],['Rester sous le cercle avec ton coéquipier',0,'Le porteur tire seul à mi-distance.'],['Suivre la balle partout',0,'Tu laisses le cercle vide.'],['Prendre l’aile droite dès le départ',0,'Le porteur file au panier.']],
      'Tandem : le haut arrête la balle, le bas prend la passe, le haut redescend.'),
    Q('def-post-front','post-defense',[B],'Balle dans le coin','Balle dans le coin droit, ton joueur au poste bas du même côté. Comment le défends-tu ?',
      {o:[O(2,'cornerR',1),O(5,'blockR'),O(1,'top'),O(3,'wingL'),O(4,'cornerL')],d:[D(2,88,14),D(5,60,20),D(1,50,58),D(3,22,42),D(4,12,14)],a:[]},
      [['Trois-quarts devant, côté ligne de fond, pour couper la passe directe',1,'Depuis le coin, la passe vient de la ligne de fond : tu te places dans sa trajectoire.'],['Dans son dos, en attendant la réception',0,'Il reçoit au plus près du cercle.'],['Complètement devant, dos au coin',0,'Une passe lobée et il est seul sous le panier.'],['Loin de lui, dans la raquette',0,'Il reçoit sans pression.']],
      'Au poste, ta position dépend de l’endroit où est la balle.')
  );
  place.push(
    {id:'pl-postfront',theme:'post-defense',groups:[B],title:'Défendre le poste',prompt:'Balle dans le coin droit. Ton joueur est au poste bas droit. Touche l’endroit où tu te places.',court:{o:[O(2,'cornerR',1),O(5,'blockR'),O(1,'top'),O(3,'wingL')],d:[D(2,88,14),D(1,50,58),D(3,22,42)]},you:'X5',target:[70,12],r:7,lesson:'Trois-quarts devant côté ligne de fond : tu coupes la passe qui vient du coin.'},
    {id:'pl-gap-drive',theme:'help-defense',groups:[G,W],title:'Fermer l’espace',prompt:'Le meneur pénètre par le milieu. Tu défends l’aile gauche, à une passe. Où te places-tu ?',court:{o:[[1,50,50,true],O(2,'wingL'),O(3,'wingR'),O(4,'cornerR'),O(5,'blockR')],d:[D(1,50,56),D(3,78,42),D(4,86,14),D(5,60,18)]},you:'X2',target:[30,44],r:9,lesson:'Un pas dans l’espace entre le porteur et ton joueur : tu ralentis la pénétration et restes à portée de ton joueur.'},
    {id:'pl-tandem',theme:'transition-defense',groups:[G,W,B],title:'Tandem : le haut',prompt:'Trois contre deux. Tu es le défenseur du haut. Où arrêtes-tu la balle ?',court:{o:[[1,50,84,true],[2,82,74,false],[3,18,74,false]],d:[D(2,50,22)]},you:'X1',target:[50,58],r:9,lesson:'Le défenseur du haut arrête la balle au sommet de la raquette, avant la ligne à 3 points.'}
  );
  clutch.push(
    {id:'cl-def-last',theme:'transition-defense',title:'Dernière défense',situation:'Égalité · 0:06 · balle à l’adversaire',prompt:'Quelle est la priorité en défense ?',choices:[['Contester sans faute, forcer un tir difficile, puis box-out',1,'Une faute donne des lancers ou une nouvelle remise ; un tir difficile sans faute est le meilleur résultat.'],['Tenter l’interception à tout prix',0,'Si tu rates, c’est un tir ouvert.'],['Faire faute tout de suite',0,'À égalité, tu offres des lancers pour gagner.'],['Reculer dans la raquette',0,'Un tir ouvert à 3 points.']],lesson:'En fin de match à égalité : pas de faute, main haute, rebond.'},
    {id:'cl-def-foul',theme:'transition-defense',title:'Une faute à donner',situation:'+2 · 0:12 · balle à l’adversaire · 2 fautes d’équipe dans le quart',prompt:'L’adversaire installe un système. Que peut faire ta défense ?',choices:[['Faire une faute sur le porteur avant qu’il tire, pour casser le système',1,'Sans pénalité d’équipe en FIBA, la faute donne une remise en jeu, pas de lancers : l’adversaire doit tout recommencer avec moins de temps. La faute doit viser le ballon, sinon elle devient antisportive.'],['Faire faute sur un tireur à 3 points',0,'Trois lancers : la pire faute possible.'],['Ne rien changer',0,'Tu laisses passer un outil utile.'],['Laisser marquer pour reprendre vite la balle',0,'À +2, un panier égalise.']],lesson:'Compte les fautes d’équipe : sous la pénalité, une faute peut être un outil tactique.'}
  );
  vocab.push(
    {id:'trail',term:'Trail',theme:'off-ball-defense',def:'Suivre son joueur dans son dos sur un écran, pour lui refuser le tir à la sortie.'},
    {id:'sink',term:'Sink',theme:'help-defense',def:'Descendre couvrir le joueur laissé par un coéquipier parti aider.'},
    {id:'tandem',term:'Tandem',theme:'transition-defense',def:'Défense à deux l’un derrière l’autre sur un 3 contre 2 : le haut arrête la balle, le bas prend la première passe.'},
    {id:'deadball',term:'Dribble arrêté',theme:'on-ball',def:'Le porteur a arrêté son dribble : il ne peut plus pénétrer, on le colle.'},
    {id:'foultogive',term:'Faute à donner',theme:'transition-defense',def:'Faute commise sous la pénalité d’équipe pour casser une action : remise en jeu, pas de lancers.'}
  );

  // ---- Animations : l’action se joue, se fige au moment de décider, puis la bonne lecture peut être rejouée ----
  // Une image : o/d = nouvelles positions, ball = numéro du porteur ou [x, y] (tir), a = flèches affichées pendant l’image.
  const RIM = [50,11];
  const motion = {
    'pnr-drop':{court:START,anim:[SCREEN,{o:{1:[46,62]},d:{1:[54,68],5:[50,34]},a:[['dribble',60,78,46,62]]},{o:{1:[44,52],5:[54,48]},d:{1:[50,60]},a:[['cut',55,70,54,48]]}],solution:[{ball:RIM,a:[['pass',44,52,50,12]]}]},
    'pnr-hedge':{court:START,anim:[SCREEN,{o:{1:[50,72]},d:{5:[46,68],1:[58,74]},a:[['dribble',60,78,50,72]]},{o:{5:[53,56]},a:[['cut',55,70,53,56]]}],solution:[{o:{1:[54,80]},a:[['dribble',50,72,54,80]]},{o:{5:[52,24]},d:{5:[50,52]},a:[['cut',53,56,52,24]]},{ball:'5',a:[['pass',54,80,52,24]]},{ball:RIM}]},
    'pnr-switch':{court:START,anim:[SCREEN,{o:{1:[46,62]},d:{5:[44,56],1:[54,64]},a:[['dribble',60,78,46,62]]},{o:{5:[52,24]},d:{1:[53,32]},a:[['cut',55,70,52,24]]}],solution:[{ball:'5',a:[['pass',46,62,52,24]]},{ball:RIM}]},
    'pnr-blitz':{court:{...START,o:[[1,60,78,true],[5,44,50,false],O(2,'wingL'),O(3,'cornerR'),O(4,'dunkL')],d:[D(1,60,71),D(5,45,44),D(2,20,42),D(3,86,12),D(4,38,16)]},anim:[SCREEN,{o:{1:[58,78]},d:{1:[63,82],5:[53,76]}},{o:{5:[50,44]},a:[['cut',55,70,50,44]]}],solution:[{ball:'5',a:[['pass',58,78,50,44]]},{d:{4:[44,34]}},{ball:'4',a:[['pass',50,44,27,5]]},{ball:RIM}]},
    'scr-shortroll':{court:{...START,o:[[1,60,78,true],[5,44,50,false],O(2,'wingL'),O(3,'cornerR'),O(4,'dunkL')],d:[D(1,60,71),D(5,45,44),D(2,20,42),D(3,86,12),D(4,38,16)]},anim:[SCREEN,{o:{1:[58,78]},d:{1:[63,82],5:[53,76]}},{o:{5:[50,42]},ball:'5',a:[['pass',58,78,50,42]]},{d:{4:[44,34]}}],solution:[{ball:'4',a:[['pass',50,42,27,5]]},{ball:RIM}]},
    'pnr-under':{court:START,anim:[SCREEN,{o:{1:[44,72]},d:{1:[50,62],5:[54,62]},a:[['dribble',60,78,44,72]]}],solution:[{ball:RIM,a:[['pass',44,72,50,12]]}]},
    'pnr-tag':{court:{o:[[1,60,78,true],[5,44,50,false],O(2,'wingL'),O(3,'wingR'),O(4,'cornerR')],d:[D(1,60,71),D(5,45,44),D(2,20,42),D(3,82,44),D(4,88,12)],a:[]},anim:[SCREEN,{o:{1:[42,60],5:[54,40]},d:{1:[48,66],5:[48,40]},a:[['dribble',60,78,42,60],['cut',55,70,54,40]]},{o:{5:[54,20]},d:{4:[62,18]},a:[['cut',54,40,54,20]]}],solution:[{ball:'4',a:[['pass',42,60,95,7]]},{ball:RIM}]},
    'cut-backdoor':{court:{o:[O(2,'wingL'),O(1,'top',1),O(3,'wingR'),O(4,'cornerR'),O(5,'elbowR')],d:[D(2,22,48),D(1,50,58),D(3,82,44),D(4,88,14),D(5,62,40)],a:[]},anim:[{o:{2:[12,52]},d:{2:[18,54]},a:[['cut',14,44,12,52]]}],solution:[{o:{2:[40,14]},a:[['cut',12,52,40,14]]},{ball:'2',a:[['pass',50,66,40,14]]},{ball:RIM}]},
    'cut-drift':{court:{o:[O(1,'top',1),O(2,'wingL'),O(3,'wingR'),O(4,'cornerR'),O(5,'blockR')],d:[D(1,50,58),D(2,22,44),D(3,82,44),D(4,88,14),D(5,60,18)],a:[]},anim:[{o:{1:[50,46]},d:{1:[50,52],2:[34,44]},a:[['dribble',50,66,50,46]]}],solution:[{o:{2:[7,10]},a:[['cut',14,44,7,10]]},{ball:'2',a:[['pass',50,46,7,10]]},{ball:RIM}]},
    'cut-lift':{court:{o:[O(2,'wingR',1),O(3,'cornerR'),O(1,'top'),O(4,'wingL'),O(5,'blockL')],d:[D(2,82,40),D(3,88,14),D(1,50,58),D(4,20,42),D(5,40,18)],a:[]},anim:[{o:{2:[90,22]},d:{2:[86,30],3:[84,16]},a:[['dribble',86,44,90,22]]}],solution:[{o:{3:[84,46]},a:[['cut',95,7,84,46]]},{ball:'3',a:[['pass',90,22,84,46]]},{ball:RIM}]},
    'tr-3v2':{court:{o:[[1,50,88,true],[2,80,80,false],[3,20,80,false]],d:[D(1,50,60),D(2,50,24)],a:[]},anim:[{o:{1:[50,66],2:[82,40],3:[18,40]},d:{1:[50,56],2:[50,20]}},{ball:'2',d:{2:[74,30]},a:[['pass',50,66,82,40]]}],solution:[{o:{3:[38,14]},a:[['cut',18,40,38,14]]},{ball:'3',a:[['pass',82,40,38,14]]},{ball:RIM}]},
    'help-xout':{court:{o:[O(1,'wingR',1),O(2,'wingL'),O(3,'cornerR'),O(4,'cornerL'),O(5,'blockR')],d:[D(1,78,46),D(2,40,40),D(3,70,16),D(4,36,22),D(5,58,18)],a:[]},anim:[{ball:'2',a:[['pass',86,44,14,44]]}],solution:[{d:{2:[20,44]}},{d:{4:[12,14]}}]},
    'help-baseline':{court:{o:[O(2,'wingR',1),O(5,'blockL'),O(1,'top'),O(3,'wingL'),O(4,'cornerL')],d:[D(2,82,40),D(5,42,18),D(1,50,58),D(3,20,42),D(4,12,14)],a:[]},anim:[{o:{2:[90,20]},d:{2:[86,32]},a:[['dribble',86,44,90,20]]}],solution:[{d:{5:[62,12]}},{d:{4:[34,18]}}]},
    'close-shooter':{court:{o:[O(1,'top',1),O(3,'cornerL'),O(2,'wingR'),O(4,'blockR'),O(5,'elbowR')],d:[D(3,30,30),D(1,50,58),D(2,82,44),D(4,60,18),D(5,62,40)],a:[]},anim:[{ball:'3',a:[['pass',50,66,5,7]]}],solution:[{d:{3:[14,14]}},{d:{3:[10,10]}}]},
    'def-chase':{anim:[SCREEN],solution:[{o:{1:[46,62]},d:{1:[52,68],5:[50,36]},a:[['dribble',60,78,46,62]]},{o:{1:[44,52]},d:{1:[48,58],5:[46,44]}}]},
    'def-hedge-x5':{anim:[SCREEN],solution:[{o:{1:[56,78]},d:{5:[50,74]}},{d:{1:[56,72],5:[52,54]},o:{5:[53,50]},a:[['cut',55,70,53,50]]}]},
    'def-switch-talk':{anim:[SCREEN],solution:[{o:{1:[46,62]},d:{5:[44,56],1:[54,66]}},{o:{5:[52,30]},d:{1:[52,36]}}]},
    'def-pop':{anim:[SCREEN,{o:{1:[46,62],5:[68,64]},d:{1:[52,68],5:[50,34]},a:[['dribble',60,78,46,62],['cut',55,70,68,64]]}],solution:[{d:{5:[64,58]}}]},
    'def-deadball':{anim:[{o:{2:[86,46]},d:{2:[82,42]},a:[['dribble',86,56,86,46]]}],solution:[{d:{2:[84,43]}}]},
    'def-ice':{anim:[{o:{5:[78,52]},d:{5:[74,46]},a:[['cut',70,32,78,52]]}],solution:[{d:{1:[82,50],5:[84,30]}},{o:{1:[90,28]},d:{1:[88,34]},a:[['dribble',86,46,90,28]]}]},
    'def-trail':{anim:[{o:{2:[26,40]},a:[['cut',36,15,26,40]]}],solution:[{d:{2:[30,34],4:[32,38]}}]},
    'def-nail':{anim:[{o:{2:[32,42]},d:{2:[26,46]},a:[['dribble',14,48,32,42]]}],solution:[{d:{1:[42,44]}},{d:{1:[48,58]},ball:'1',a:[['pass',32,42,50,66]]}]},
    'def-sink':{anim:[{o:{2:[88,22]},d:{2:[84,30]},a:[['dribble',86,44,88,22]]},{d:{4:[62,14]}}],solution:[{d:{3:[22,20]}},{ball:'4',a:[['pass',88,22,5,7]]},{d:{3:[10,10]}}]},
    'def-2v1':{anim:[{o:{1:[50,62],2:[70,40]},d:{1:[54,44]}}],solution:[{d:{1:[52,52]}},{d:{1:[56,30]}}]},
    'def-3v2':{anim:[{o:{1:[50,68],2:[82,48],3:[18,48]}}],solution:[{d:{1:[50,60]}},{ball:'2',d:{2:[76,36]},a:[['pass',50,68,82,48]]},{d:{1:[46,24]}}]},
    'def-post-front':{solution:[{d:{5:[68,12]}}]},
    'pl-drift':{court:{o:[O(1,'top',1),O(3,'wingR'),O(4,'cornerR'),O(5,'blockR')],d:[D(1,50,58),D(2,30,40),D(3,82,44),D(4,88,14),D(5,60,18)]},anim:[{o:{1:[50,46]},d:{1:[50,52],2:[34,44]},a:[['dribble',50,66,50,46]]}]},
    'pl-lift':{court:{o:[O(2,'wingR',1),O(1,'top'),O(4,'wingL'),O(5,'blockL')],d:[D(2,82,40),D(3,86,14),D(1,50,58),D(4,20,42),D(5,40,18)]},anim:[{o:{2:[90,22]},d:{2:[86,30],3:[84,16]},a:[['dribble',86,44,90,22]]}]},
    'pl-gap-drive':{court:{o:[O(1,'top',1),O(2,'wingL'),O(3,'wingR'),O(4,'cornerR'),O(5,'blockR')],d:[D(1,50,58),D(3,78,42),D(4,86,14),D(5,60,18)]},anim:[{o:{1:[50,50]},d:{1:[50,56]},a:[['dribble',50,66,50,50]]}]},
    'pl-tandem':{court:{o:[[1,50,92,true],[2,82,86,false],[3,18,86,false]],d:[D(2,50,22)]},anim:[{o:{1:[50,72],2:[82,70],3:[18,70]}}]}
  };
  Object.entries(motion).forEach(([id,m])=>{const item=quiz.find(q=>q.id===id)||place.find(q=>q.id===id);if(item)Object.assign(item,m);});
  const sideOf = item => defenseThemes.includes(item.theme)?'def':'off';

  const group = position => ['meneur','arriere'].includes(position)?G:['ailier-fort','pivot'].includes(position)?B:W;
  const fits = (item,g) => !item.groups || item.groups.includes(g);
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const addDays = (key,n) => { const d=new Date(`${key}T12:00:00`); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

  // Vidéos de vrais matchs : lues dans le lecteur YouTube intégré, jamais copiées ni hébergées par l'app.
  // file : extrait découpé par scripts/cut-clip.cjs de start à end, lu par le lecteur natif (instants inchangés, décalage appliqué au lecteur).
  // Un extrait = début, instant de pause (la décision), fin (la suite de l'action), une question et ses choix.
  // Instants vérifiés image par image (début, pause juste avant la décision, fin après l'issue).
  const preston = 'Jason Preston, « Pick & Roll Reads Pros See That You Don’t » (NCAA, Ohio)';
  const videoClips = [
    {id:'v-preston-hedge',yt:'LdSe_auBuhg',file:'clips/v-preston-hedge.mp4',start:7,pause:21,end:28.8,theme:'pnr-handler',title:'Deux défenseurs sur toi',
      prompt:'Le grand monte sur toi avec ton défenseur. Que fais-tu ?',
      choices:[{text:'Sauter et ressortir vers le coéquipier libre en haut',ok:true,why:'Deux défenseurs sur le ballon : derrière, c’est 4 contre 3. Le défenseur d’aide n’est pas resté, la passe part vers le haut.'},
        {text:'Tirer en suspension au-dessus des deux',ok:false,why:'Tir contesté par deux joueurs : la pire option quand un coéquipier est libre.'},
        {text:'Dribbler entre les deux défenseurs',ok:false,why:'Pas d’espace entre eux : perte de balle quasi assurée.'}],
      lesson:'Prise à deux = un coéquipier libre. Regarde d’un côté, passe de l’autre.',source:preston},
    {id:'v-preston-roll',yt:'LdSe_auBuhg',file:'clips/v-preston-roll.mp4',start:64.5,pause:80,end:89,theme:'pnr-handler',title:'Le roll que personne ne surveille',
      prompt:'Ton grand roule vers le cercle. Que fais-tu ?',
      choices:[{text:'Passer au grand qui roule',ok:true,why:'Aucun défenseur ne regarde le roll et les autres sont occupés côté opposé : couloir ouvert jusqu’au cercle.'},
        {text:'Ressortir vers l’aile',ok:false,why:'Tu rends le ballon alors que l’avantage est déjà créé au cercle.'},
        {text:'Tirer à mi-distance',ok:false,why:'Tir moyen alors qu’un panier facile est ouvert.'}],
      lesson:'Avant de sortir de l’écran, regarde qui peut aider sur le roll. Personne ? Passe-lui.',source:preston},
    {id:'v-preston-drive',yt:'LdSe_auBuhg',file:'clips/v-preston-drive.mp4',start:103.5,pause:117,end:127,theme:'pnr-handler',title:'Le grand te tourne le dos',
      prompt:'Le grand adverse se replace après l’écran. Que fais-tu ?',
      choices:[{text:'Attaquer le cercle tout de suite',ok:true,why:'En se replaçant, le grand tourne le dos au porteur : il ne peut plus contester la pénétration.'},
        {text:'Passer au grand qui roule',ok:false,why:'Deux défenseurs sont entre vous : la passe peut être interceptée.'},
        {text:'Ressortir et relancer le jeu',ok:false,why:'Tu laisses passer l’avantage que la défense vient de t’offrir.'}],
      lesson:'Regarde les épaules du défenseur de l’écranteur : s’il te tourne le dos, attaque.',source:preston},
    {id:'v-preston-corner',yt:'LdSe_auBuhg',file:'clips/v-preston-corner.mp4',start:281.5,pause:324,end:329.2,theme:'pnr-handler',title:'L’aide vient du coin',
      prompt:'Tu as dépassé ton défenseur et ton grand est au cercle. Que fais-tu ?',
      choices:[{text:'Passer au shooteur du coin',ok:true,why:'Le défenseur du coin descend aider sur le grand : le coin est laissé seul.'},
        {text:'Lober le grand',ok:false,why:'L’aide est arrivée sur lui : le lob devient contesté.'},
        {text:'Finir seul au cercle',ok:false,why:'Deux défenseurs t’attendent près du cercle.'}],
      lesson:'Quand l’aide descend du coin, le coin est ouvert. Joue lentement pour voir qui aide.',source:preston},
    // Analyses The Film Room (NCAA), lues dans le lecteur YouTube. Pause posée juste avant que l'analyste fige l'image et dessine la réponse.
    {id:'v-tag-steal',yt:'wD-ZfgEeC3M',file:'clips/v-tag-steal.mp4',start:58.5,pause:62.5,end:69.3,theme:'pnr-defense',title:'Le grand roule, tu es côté faible',
      prompt:'Texas Tech en blanc. Tu défends côté opposé, près de la ligne de fond. Le grand adverse roule vers le cercle. Que fais-tu ?',
      choices:[{text:'Descendre gêner le rouleur, puis revenir sur ton joueur',ok:true,why:'Pendant l’écran, deux défenseurs sont sur le porteur : personne ne tient le rouleur. Tu le gênes le temps que ton grand revienne.'},
        {text:'Aller chercher l’interception sur le porteur',ok:false,why:'C’est ce qu’il a fait : il arrive en retard, le rouleur est seul et marque.'},
        {text:'Rester collé à ton joueur',ok:false,why:'Le rouleur a un couloir libre jusqu’au cercle.'}],
      lesson:'Côté faible pendant un pick & roll : ton travail, c’est le rouleur. Gêne-le, puis reviens.',source:'The Film Room, « Tagging: A Key to Ballscreen Defense »'},
    {id:'v-tag-lift',yt:'wD-ZfgEeC3M',file:'clips/v-tag-lift.mp4',start:184.2,pause:188.6,end:196.5,theme:'pnr-defense',title:'Ton joueur s’écarte',
      prompt:'Indiana en blanc. Tu es le grand dans la raquette. Pendant le pick & roll, ton joueur s’écarte vers l’extérieur. Que fais-tu ?',
      choices:[{text:'Rester dans la raquette pour gêner le rouleur',ok:true,why:'Le rouleur est le danger immédiat. Ton joueur s’éloigne du cercle : tu as le temps de revenir sur lui.'},
        {text:'Suivre ton joueur',ok:false,why:'C’est ce qu’il a fait : plus personne dans la raquette, panier facile.'},
        {text:'Sortir sur le porteur',ok:false,why:'Il est déjà pris par deux défenseurs.'}],
      lesson:'Sache avant l’action qui doit gêner le rouleur. Si c’est toi, ne suis pas ton joueur qui s’écarte.',source:'The Film Room, « Tagging: A Key to Ballscreen Defense »'},
    {id:'v-stunt',yt:'k3xLsmeQ8Qk',file:'clips/v-stunt.mp4',start:44.5,pause:56.6,end:67.5,theme:'help-defense',title:'Deux défenseurs sur un',
      prompt:'Duke en blanc. Deux défenseurs sont sur le même joueur, donc un attaquant est libre. Tu es le défenseur le plus proche quand le ballon ressort. Que fais-tu ?',
      choices:[{text:'Feinter vers le ballon, puis revenir sur ton joueur',ok:true,why:'La feinte fait hésiter le receveur le temps que ton coéquipier revienne sur lui.'},
        {text:'Rester collé à ton joueur',ok:false,why:'Le receveur a le temps de tirer ou d’attaquer.'},
        {text:'Sortir complètement sur le receveur',ok:false,why:'Ton joueur se retrouve seul : tu déplaces juste le problème.'}],
      lesson:'Quand un coéquipier revient sur son joueur, fais-lui gagner une seconde : feinte, puis retour.',source:'The Film Room, « Breaking Down the Defensive Stunt »'},
    {id:'v-drive-kick',yt:'00yI9CC024o',file:'clips/v-drive-kick.mp4',start:135.2,pause:142.6,end:148.5,theme:'finishing-reads',title:'L’aide du premier défenseur',
      prompt:'Caroline du Nord en bleu clair. Tu pénètres et le défenseur le plus proche quitte son joueur pour t’aider. Que fais-tu ?',
      choices:[{text:'T’arrêter et ressortir vers son joueur',ok:true,why:'Il ne peut pas aider et revenir à temps : ton coéquipier a un tir en rythme.'},
        {text:'Continuer jusqu’au cercle',ok:false,why:'Le deuxième rideau t’attend sous le panier.'},
        {text:'Tirer en déséquilibre dans la raquette',ok:false,why:'Tir difficile alors qu’un coéquipier est libre.'}],
      lesson:'En pénétration, regarde le premier défenseur : s’il aide, ressors vers son joueur.',source:'The Film Room, « Are You Reading Defenders When You Drive? »'},
    {id:'v-drive-dump',yt:'00yI9CC024o',file:'clips/v-drive-dump.mp4',start:244,pause:258.5,end:262.5,theme:'finishing-reads',title:'Le grand vient contrer',
      prompt:'Caroline du Nord en bleu clair. Le défenseur du coin a aidé et le grand vient contrer. Que fais-tu ?',
      choices:[{text:'Lâcher le ballon : au grand près du cercle ou au coin',ok:true,why:'Deux défenseurs sont sur toi : le grand et le coin sont libres.'},
        {text:'Monter quand même au panier',ok:false,why:'C’est ce qu’il a fait : contré.'},
        {text:'Ressortir vers le haut pour relancer',ok:false,why:'Tu laisses passer deux passes faciles.'}],
      lesson:'Les grands veulent contrer : anticipe la passe à leur joueur.',source:'The Film Room, « Are You Reading Defenders When You Drive? »'}
  ];
  const ytId = /^[A-Za-z0-9_-]{11}$/;
  // Accepte un identifiant, youtu.be, watch?v=, shorts/, embed/ et live/. Le paramètre t= ou start= sert de début proposé.
  function parseYouTube(input) {
    const s=String(input||'').trim();
    if(ytId.test(s)) return {id:s,start:0};
    let url;try{url=new URL(s);}catch(e){return null;}
    if(!/(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/.test(url.hostname)) return null;
    const path=url.pathname.split('/').filter(Boolean);
    const id=url.hostname.endsWith('youtu.be')?path[0]:url.searchParams.get('v')||(['shorts','embed','live'].includes(path[0])?path[1]:null);
    if(!ytId.test(id||'')) return null;
    const t=url.searchParams.get('t')||url.searchParams.get('start')||'';
    const m=String(t).match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
    const start=m?(Number(m[1]||0)*3600+Number(m[2]||0)*60+Number(m[3]||0)):0;
    return {id,start};
  }
  const sec = x => Number.isFinite(Number(x))&&Number(x)>=0&&Number(x)<36000;
  function validateClip(v) {
    if(!v||typeof v!=='object'||typeof v.id!=='string'||!ytId.test(v.yt||'')) return null;
    if(!sec(v.start)||!sec(v.pause)||!sec(v.end)||!(Number(v.start)<Number(v.pause)&&Number(v.pause)<Number(v.end))) return null;
    const choices=Array.isArray(v.choices)?v.choices.filter(x=>x&&typeof x.text==='string'&&x.text.trim()).slice(0,4).map(x=>({text:x.text.trim().slice(0,120),ok:!!x.ok,why:typeof x.why==='string'?x.why.slice(0,400):''})):[];
    if(choices.length<2||choices.filter(x=>x.ok).length!==1) return null;
    const str=(x,n)=>typeof x==='string'?x.trim().slice(0,n):'';
    return {id:v.id.slice(0,40),yt:v.yt,start:Number(v.start),pause:Number(v.pause),end:Number(v.end),theme:themes[v.theme]?v.theme:'pnr-handler',title:str(v.title,80)||'Extrait de match',prompt:str(v.prompt,200)||'Que doit faire le porteur ?',choices,lesson:str(v.lesson,400),source:str(v.source,120),own:v.own!==false};
  }
  function clipError(v) {
    if(!ytId.test(v.yt||'')) return 'Colle un lien YouTube valide.';
    if(!(Number(v.start)<Number(v.pause)&&Number(v.pause)<Number(v.end))) return 'Marque le début, puis la pause, puis la fin, dans cet ordre.';
    const filled=(v.choices||[]).filter(x=>x.text&&x.text.trim());
    if(filled.length<2) return 'Écris au moins deux réponses.';
    if(filled.filter(x=>x.ok).length!==1) return 'Coche une seule bonne réponse.';
    return '';
  }
  function videoPool(qi,theme=null) {
    const all=videoClips.map(x=>({...x,own:false})).concat(qi.clips||[]).filter(x=>!theme||x.theme===theme);
    return order(all,qi,[]);
  }
  function saveClip(qi,clip) {
    const clean=validateClip({...clip,own:true});if(!clean) return qi;
    const list=(qi.clips||[]).filter(x=>x.id!==clean.id);
    return {...qi,clips:[...list,clean].slice(-200)};
  }
  function removeClip(qi,id) { return {...qi,clips:(qi.clips||[]).filter(x=>x.id!==id)}; }

  function initialQi() { return {answers:[],cards:{},reviews:[],clips:[],rest:true}; }
  function validateQi(v) {
    if(!v||typeof v!=='object'||Array.isArray(v)) return initialQi();
    const answers=Array.isArray(v.answers)?v.answers.filter(a=>a&&typeof a.id==='string'&&typeof a.correct==='boolean').slice(-3000):[];
    const cards=v.cards&&typeof v.cards==='object'&&!Array.isArray(v.cards)?Object.fromEntries(Object.entries(v.cards).filter(([k,c])=>vocab.some(x=>x.id===k)&&c&&Number(c.box)>=1&&Number(c.box)<=5)):{};
    const reviews=Array.isArray(v.reviews)?v.reviews.filter(r=>r&&typeof r.id==='string'&&typeof r.date==='string').slice(-300):[];
    const clips=Array.isArray(v.clips)?v.clips.map(validateClip).filter(Boolean).slice(-200):[];
    return {answers,cards,reviews,clips,rest:v.rest!==false};
  }
  function record(qi,{id,mode,theme,correct},now=today()) {
    return {...qi,answers:[...qi.answers,{id,mode,theme,correct:!!correct,date:now}].slice(-3000)};
  }
  // Maîtrise par thème : part de bonnes réponses sur les 10 dernières.
  function mastery(qi,theme) {
    const list=qi.answers.filter(a=>a.theme===theme).slice(-10);
    return {count:qi.answers.filter(a=>a.theme===theme).length,ratio:list.length?list.filter(a=>a.correct).length/list.length:null};
  }
  // Priorité : jamais vu, puis raté récemment, puis le plus ancien.
  function order(items,qi,themeRank) {
    const last={};qi.answers.forEach((a,i)=>{last[a.id]={i,correct:a.correct};});
    return items.map(item=>{
      const seen=last[item.id];
      let score=seen?(seen.correct?seen.i:seen.i-5000):-10000;
      const rank=themeRank.indexOf(item.theme);
      score+=(rank<0?8:rank)*40;
      return {item,score};
    }).sort((a,b)=>a.score-b.score).map(x=>x.item);
  }
  function dailySet(qi,player={},themeRank=[]) {
    const g=group(player.position);
    // Une lecture en attaque, une en défense : la lecture de jeu se travaille des deux côtés.
    const fitting=quiz.filter(x=>fits(x,g));
    const q=[order(fitting.filter(x=>sideOf(x)==='off'),qi,themeRank)[0],order(fitting.filter(x=>sideOf(x)==='def'),qi,themeRank)[0]].filter(Boolean).map(item=>({mode:'quiz',item}));
    const c=order(clutch,qi,themeRank)[0];
    const p=order(place.filter(x=>fits(x,g)),qi,themeRank)[0];
    const third=g===G?{mode:'clutch',item:c}:{mode:'place',item:p};
    const doneToday=qi.answers.filter(a=>a.date===today()&&a.mode!=='rest').map(a=>a.id);
    return {items:[...q,third],done:[...q,third].filter(x=>doneToday.includes(x.item.id)).length};
  }
  function pool(mode,qi,player={},themeRank=[],theme=null,side=null) {
    const g=group(player.position);
    const src=mode==='place'?place:mode==='clutch'?clutch:quiz;
    return order(src.filter(x=>fits(x,g)&&(!theme||x.theme===theme)&&(!side||sideOf(x)===side)),qi,themeRank);
  }
  // Cartes en répétition espacée : boîte 1 à 5, intervalles 0, 1, 3, 7, 14 jours.
  const intervals=[0,1,3,7,14];
  function dueCards(qi,now=today(),limit=10) {
    const unseen=vocab.filter(c=>!qi.cards[c.id]);
    const due=vocab.filter(c=>qi.cards[c.id]&&qi.cards[c.id].due<=now).sort((a,b)=>qi.cards[a.id].box-qi.cards[b.id].box);
    return due.concat(unseen).slice(0,limit);
  }
  function gradeCard(qi,id,known,now=today()) {
    const box=known?Math.min(5,((qi.cards[id]||{}).box||1)+1):1;
    return {...qi,cards:{...qi.cards,[id]:{box,due:addDays(now,intervals[box-1])}}};
  }
  // Question de repos : texte seul, lisible en quelques secondes.
  function restQuestion(qi,random=Math.random) {
    if(random()<0.5){
      const c=order(clutch,qi,[])[0];
      return {mode:'rest',id:c.id,theme:c.theme,title:c.title,prompt:`${c.situation}. ${c.prompt}`,choices:c.choices.map(([text,ok,why])=>({text,ok:!!ok,why})),lesson:c.lesson};
    }
    const card=order(vocab,qi,[])[0];
    const others=vocab.filter(v=>v.id!==card.id).sort(()=>random()-0.5).slice(0,2);
    const choices=[card,...others].sort(()=>random()-0.5).map(v=>({text:v.term,ok:v.id===card.id,why:v.id===card.id?card.def:`${v.term} : ${v.def}`}));
    return {mode:'rest',id:card.id,theme:card.theme,title:'Vocabulaire',prompt:card.def,choices,lesson:`${card.term} : ${card.def}`};
  }
  function hitTarget(item,x,y) { return Math.hypot(x-item.target[0],y-item.target[1])<=item.r; }
  function addReview(qi,{eventId,answers},now=today()) {
    const id=`rv-${Date.now().toString(36)}`;
    return {...qi,reviews:[...qi.reviews,{id,date:now,eventId:eventId||null,answers}].slice(-300)};
  }
  function streak(qi,now=today()) {
    const days=new Set(qi.answers.map(a=>a.date));let n=0,key=now;
    if(!days.has(key)) key=addDays(key,-1);
    while(days.has(key)){n++;key=addDays(key,-1);}
    return n;
  }

  return {videoClips,parseYouTube,validateClip,clipError,videoPool,saveClip,removeClip,themes,defenseThemes,sideOf,spots,quiz,place,clutch,vocab,pnrGuide,review,group,fits,initialQi,validateQi,record,mastery,dailySet,pool,dueCards,gradeCard,restQuestion,hitTarget,addReview,streak};
});

/* Rehaab: parcours « Retour au jeu » basket. Étapes validées par critères, pas par le calendrier. Pur, sans DOM, pas d'autorisation médicale. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BasketPathway = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Un créneau : [rôle, candidats par ordre de préférence, doses par semaine d'étape, doses en secondes si l'exercice est chronométré].
  // Les variantes de poste remplacent les candidats : guard = meneur/arrière, wing = ailier, big = ailier fort/pivot.
  const S = (role,ids,doses,secs,pos) => ({role,ids,doses,secs,pos});
  const steps = [
    {id:1,name:'Fondations',short:'Fondations',minWeeks:3,
      goal:'Redonner de la capacité aux tendons, aux chevilles et aux hanches avant de charger. Après une longue pause, les muscles reviennent vite, les tendons plus lentement : c’est là que se jouent les blessures de reprise.',
      rules:['Aucun sprint, aucun saut maximal.','Tempo lent (3 s à la descente) sur les mouvements de force.','Douleur tolérée pendant l’effort : 2/10 au maximum, revenue à la normale le lendemain.'],
      days:[
        {key:'A',name:'Jambes & tendons',slots:[
          S('tendon',['spanish-squat','wall-sit'],['3x1','3x1','4x1','4x1'],[30,40,40,45]),
          S('force',['goblet','goblet-db','box-squat','squat'],['3x10','3x10','3x10-12','3x8-10']),
          S('force',['db-hip-thrust','hip-thrust','single-bridge','bridge'],['3x12','3x12','3x10','3x10']),
          S('tendon',['single-calf','calf'],['3x12','3x15','4x12','4x15']),
          S('gainage',['copenhagen','side-plank'],['3x1','3x1','3x1','3x1'],[20,25,30,30]),
          S('tendon',['tibialis'],['2x15','2x20','3x15','3x20'])]},
        {key:'B',name:'Haut du corps & gainage',slots:[
          S('force',['db-press','floor-press','pushup'],['3x10-12','3x10-12','3x8-10','3x8-10']),
          S('force',['chest-supported-row','db-row','band-row','inverted-row'],['3x10-12','3x10-12','3x8-10','3x8-10']),
          S('force',['kb-press','db-shoulder','band-ohp'],['3x10','3x10','3x8','3x8']),
          S('force',['pulldown','neutral-pullup','band-pulldown'],['3x8-10','3x8-10','3x8','3x8']),
          S('épaule',['facepull','band-pullapart'],['2x15','2x15','3x15','3x15']),
          S('gainage',['pallof','deadbug'],['3x10','3x10','3x12','3x12'])]},
        {key:'C',name:'Appuis & cardio',slots:[
          S('mobilité',['ankle-mob'],['2x1','2x1','2x1','2x1'],[40,40,40,40]),
          S('équilibre',['single-leg-stand','single-leg-eyes'],['3x1','3x1','3x1','3x1'],[30,30,40,40]),
          S('réception',['landing'],['2x5','3x5','3x6','3x6']),
          S('rebond',['pogo','calf'],['2x10','2x12','3x12','3x15']),
          S('hanche',['monster-walk','hip-abduction','clamshell'],['3x1','3x1','3x1','3x1'],[30,30,40,40]),
          S('cardio',['bike','march','walk'],['1x1','1x1','1x1','1x1'],[900,1080,1200,1200])]}
      ],
      tests:['calf','bridge','balance','sideplank','kneewall','pain']},
    {id:2,name:'Force',short:'Force',minWeeks:4,base:'Bloc 1 · Armure & Volume',
      goal:'Construire la force qui protège : c’est elle qui encaisse les réceptions et les freinages. Les sauts arrivent, en petites quantités et bien réceptionnés.',
      rules:['Garde 2 répétitions en réserve : jamais d’échec en solo.','Sauts : faible amplitude, réception silencieuse.','Semaine 4 allégée pour assimiler.'],
      days:[
        {key:'A',name:'Force jambes & rebond',slots:[
          S('force',['bb-squat','db-squat','goblet','squat'],['3x8','4x6-8','4x6','3x6']),
          S('force',['deadlift','kb-deadlift','rdl','single-rdl'],['3x8','4x8','4x6','3x6']),
          S('unilatéral',['db-bulgarian','bulgarian','split-squat'],['3x8','3x8','3x10','2x8'],null,{big:['db-step-up','step-up','split-squat']}),
          S('rebond',['pogo'],['3x15','3x20','4x20','2x15']),
          S('gainage',['copenhagen','side-plank'],['3x1','3x1','3x1','2x1'],[30,30,35,30])]},
        {key:'B',name:'Haut du corps & armure',slots:[
          S('force',['bb-press','db-press','floor-press','pushup'],['4x8','4x6-8','5x5-6','3x6']),
          S('force',['bb-row','db-row','chest-supported-row','band-row'],['4x8','4x6-8','5x6','3x8']),
          S('force',['db-shoulder','kb-press','band-ohp'],['3x8','3x8','4x6-8','3x8']),
          S('force',['pullup','chinup','pulldown','band-pulldown'],['3x6-8','3x6-8','4x5-6','3x6']),
          S('gainage',['carry','suitcase-carry'],['3x1','3x1','4x1','3x1'],[40,45,45,40]),
          S('épaule',['facepull','rear-delt-fly','band-pullapart'],['3x15','3x15','3x15','2x15'])]},
        {key:'C',name:'Déplacements & souffle',slots:[
          S('unilatéral',['db-lunge','reverse-lunge'],['3x8','3x10','4x10','2x8']),
          S('réception',['box-jump-step','landing'],['3x5','3x5','4x5','2x5']),
          S('puissance',['kb-swing','db-hip-thrust','hip-thrust'],['3x12','4x12','4x15','3x12']),
          S('latéral',['band-shuffle','monster-walk','lateral-lunge'],['3x1','3x1','4x1','2x1'],[30,40,45,30],{guard:['lateral-lunge','band-shuffle','monster-walk'],big:['monster-walk','band-shuffle','lateral-lunge']}),
          S('cheville',['lateral-hop','pogo'],['2x8','3x8','3x10','2x8']),
          S('cardio',['bike-interval','rower-interval','bike'],['1x1','1x1','1x1','1x1'],[600,720,840,600])]}
      ],
      tests:['calf25','bridge20','splitsquat','landingq','pain']},
    {id:3,name:'Puissance & élasticité',short:'Puissance',minWeeks:4,base:'Bloc 2 · Force & Explosivité',
      goal:'Retrouver la vitesse : transformer la force en détente, en premier pas et en freinage. C’est ici que tu récupères ce que la pause t’a pris en explosivité.',
      rules:['Qualité avant quantité : chaque saut est tenu à la réception.','Accélérations à 80-90 %, jamais fatigué.','Arrête un sprint dès que l’arrière de cuisse tire.'],
      days:[
        {key:'A',name:'Force & détente',slots:[
          S('force',['bb-squat','front-squat','db-squat','goblet'],['4x5','4x5','5x4','3x4']),
          S('détente',['box-jump-step','broad-jump'],['4x4','4x5','5x5','3x4'],null,{big:['box-jump-step','split-jump','broad-jump']}),
          S('force',['bb-rdl','rdl','kb-rdl'],['3x8','3x6','4x6','3x6']),
          S('unilatéral',['single-hop-stick','lateral-bound-stick'],['3x3','3x4','4x4','2x4']),
          S('gainage',['copenhagen','side-plank-full'],['3x1','3x1','3x1','2x1'],[35,40,40,30])]},
        {key:'B',name:'Haut du corps · puissance',slots:[
          S('puissance',['push-press','kb-press','db-shoulder'],['4x5','4x5','5x4','3x5']),
          S('force',['bb-press','db-press','floor-press'],['4x5','4x5','5x4','3x5']),
          S('force',['pullup','chinup','pulldown','band-pulldown'],['4x5-6','4x5-6','5x5','3x5']),
          S('force',['bb-row','db-row','band-row'],['3x8','3x8','4x8','3x8']),
          S('gainage',['pallof','pallof-cable','halo'],['3x10','3x10','3x12','2x10'])]},
        {key:'C',name:'Accélération & freinage',slots:[
          S('vitesse',['wall-drill'],['3x1','3x1','3x1','2x1'],[20,20,20,20]),
          S('vitesse',['accel-10','run-interval','bike-interval'],['1x4','1x5','1x6','1x4']),
          S('freinage',['decel-stick','lateral-bound-stick'],['3x4','3x5','4x5','2x4'],null,{guard:['decel-stick','crossover-start'],big:['box-jump-step','decel-stick']}),
          S('latéral',['lateral-bound-stick','lateral-hop'],['3x4','3x5','3x6','2x4'],null,{big:['split-jump','landing']}),
          S('puissance',['kb-swing','db-hip-thrust'],['4x10','4x10','5x10','3x10']),
          S('tendon',['single-calf','db-calf'],['3x15','3x15','3x20','2x15'])]}
      ],
      tests:['hop','hopquality','sprint10','pain']},
    {id:4,name:'Vitesse & changements de direction',short:'Vitesse',minWeeks:3,base:'Bloc 3 · Pré-saison',
      goal:'Vitesse maximale, changements de direction et efforts répétés : le basket est une suite de sprints courts. Tu prépares ton corps à ce que le terrain va lui demander.',
      rules:['Sprints en début de séance, frais.','Récupération complète entre les sprints : la vitesse ne se travaille pas fatigué.','Le conditionnement vient après la vitesse, jamais avant.'],
      days:[
        {key:'A',name:'Puissance jambes',slots:[
          S('puissance',['db-squat','bb-squat','goblet'],['4x4','4x4','5x3','3x3']),
          S('détente',['broad-jump','box-jump-step'],['4x4','4x4','5x4','3x3'],null,{big:['box-jump-step','split-jump']}),
          S('unilatéral',['db-single-rdl','single-rdl'],['3x8','3x8','3x6','2x6']),
          S('unilatéral',['single-hop-stick','lateral-bound-stick'],['3x4','3x5','3x5','2x4']),
          S('gainage',['copenhagen','side-plank'],['3x1','3x1','3x1','2x1'],[35,40,40,30])]},
        {key:'B',name:'Haut du corps & gainage',slots:[
          S('force',['db-press','incline','bb-press'],['4x6','4x6','4x5','3x6']),
          S('force',['db-row','bb-row','band-row'],['4x8','4x8','4x6','3x8']),
          S('puissance',['push-press','db-shoulder','kb-press'],['3x6','3x6','4x5','3x5']),
          S('gainage',['pallof','halo','pallof-cable'],['3x12','3x12','3x12','2x10']),
          S('épaule',['facepull','band-pullapart'],['3x15','3x15','3x15','2x15'])]},
        {key:'C',name:'Vitesse & condition match',slots:[
          S('vitesse',['wall-drill'],['2x1','2x1','2x1','2x1'],[20,20,20,20]),
          S('vitesse',['sprint-20','accel-10','run-interval'],['1x3','1x4','1x5','1x3']),
          S('appuis',['shuttle-5105','decel-stick'],['1x3','1x3','1x4','1x2'],null,{guard:['shuttle-5105','crossover-start','decel-stick'],big:['decel-stick','box-jump-step']}),
          S('appuis',['crossover-start','lateral-bound-stick'],['3x4','3x5','3x5','2x4'],null,{big:['split-jump','lateral-bound-stick']}),
          S('cardio',['run-interval','bike-interval','rower-interval'],['1x1','1x1','1x1','1x1'],[600,720,840,600])]}
      ],
      tests:['shuttle','rsa','sprint10','pain']},
    {id:5,name:'Retour au jeu',short:'Retour au jeu',minWeeks:4,
      goal:'Rejouer par paliers, en gardant deux séances de renforcement par semaine. La blessure de reprise arrive souvent quand on arrête la musculation au moment où l’on rejoue.',
      rules:['Deux séances par semaine, jamais la veille d’un match.','Un palier de jeu à la fois, et seulement si le lendemain est calme.','Une gêne qui revient : redescends d’un palier.'],
      days:[
        {key:'A',name:'Force entretien',slots:[
          S('force',['bb-squat','db-squat','goblet'],['3x5','3x4','3x4','2x4']),
          S('force',['bb-rdl','rdl','kb-rdl'],['3x6','3x5','3x5','2x5']),
          S('force',['bb-press','db-press','pushup'],['3x5','3x5','3x5','2x5']),
          S('force',['pullup','chinup','pulldown','db-row'],['3x5','3x5','3x5','2x5']),
          S('gainage',['copenhagen','side-plank'],['2x1','2x1','2x1','2x1'],[30,30,30,30]),
          S('tendon',['single-calf','db-calf'],['2x15','2x15','2x15','2x12'])]},
        {key:'C',name:'Vitesse & réactivité',slots:[
          S('vitesse',['wall-drill'],['2x1','2x1','2x1','2x1'],[20,20,20,20]),
          S('vitesse',['sprint-20','accel-10'],['1x3','1x3','1x4','1x3']),
          S('appuis',['shuttle-5105','decel-stick'],['1x2','1x3','1x3','1x2'],null,{big:['decel-stick','box-jump-step']}),
          S('unilatéral',['single-hop-stick','lateral-bound-stick'],['2x4','2x4','2x4','2x3']),
          S('rebond',['pogo'],['2x15','2x15','2x20','2x15'])]}
      ],
      tests:['ladder','pain']}
  ];

  // Critères de passage. Repères d'entraînement courants, pas des normes médicales.
  const tests = {
    calf:{target:'20 répétitions par jambe, écart de 15 % au plus',label:'Montées sur pointes une jambe',unit:'rép.',sides:true,min:20,gap:15,how:['Sur une marche, une jambe, un doigt contre le mur pour l’équilibre.','Monte le plus haut possible, redescends sous l’horizontale, rythme régulier.','Compte jusqu’à ce que l’amplitude baisse.'],why:'Le mollet et le tendon d’Achille encaissent chaque appui.'},
    calf25:{target:'25 répétitions par jambe, écart de 10 % au plus',label:'Montées sur pointes une jambe',unit:'rép.',sides:true,min:25,gap:10,how:['Même protocole qu’à l’étape 1.'],why:'Capacité attendue avant les sauts répétés.'},
    bridge:{target:'15 répétitions par jambe, écart de 15 % au plus',label:'Pont fessier une jambe',unit:'rép.',sides:true,min:15,gap:15,how:['Dos au sol, un talon près des fesses, l’autre jambe tendue en l’air.','Monte jusqu’à l’alignement épaule-hanche-genou, redescends toucher le sol.','Compte jusqu’à ce que le bassin tourne ou que l’arrière de cuisse crampe.'],why:'Les fessiers et les ischios protègent le genou et l’arrière de cuisse.'},
    bridge20:{target:'20 répétitions par jambe, écart de 10 % au plus',label:'Pont fessier une jambe',unit:'rép.',sides:true,min:20,gap:10,how:['Même protocole qu’à l’étape 1.'],why:'Capacité attendue avant la puissance.'},
    balance:{target:'30 s par jambe',label:'Équilibre sur une jambe',unit:'s',sides:true,min:30,gap:25,how:['Pieds nus, mains sur les hanches.','Tiens sur une jambe sans poser l’autre pied ni sautiller.','Arrête le chrono au premier appui.'],why:'La stabilité de cheville est la première défense contre l’entorse.'},
    sideplank:{target:'45 s par côté, écart de 15 % au plus',label:'Planche latérale',unit:'s',sides:true,min:45,gap:15,how:['Sur l’avant-bras, corps aligné, hanches hautes.','Chrono jusqu’à ce que la hanche descende.'],why:'Le tronc stable transmet la force des jambes et protège le dos.'},
    kneewall:{target:'9 cm par côté',label:'Genou au mur (cheville)',unit:'cm',sides:true,min:9,gap:20,how:['Face au mur, un pied devant, talon au sol.','Avance le pied tant que le genou touche encore le mur sans que le talon décolle.','Mesure la distance orteil-mur.'],why:'Une cheville raide renvoie les contraintes vers le genou.'},
    splitsquat:{target:'réussi des deux côtés',label:'Fente bulgare au poids du corps',unit:'check',sides:true,how:['Pied arrière sur le banc.','10 répétitions par jambe, genou dans l’axe du pied, sans douleur.'],why:'Contrôle unilatéral avant les appuis rapides.'},
    landingq:{target:'10 réceptions propres',label:'Réceptions contrôlées',unit:'check',sides:false,how:['10 petits sauts sur place avec réception tenue 2 s.','Réception silencieuse, genoux au-dessus des pieds, sans qu’ils rentrent.','Filme-toi de face si possible.'],why:'Une bonne réception est la base de tous les sauts.'},
    hop:{target:'écart entre les jambes de 10 % au plus',label:'Saut une jambe en longueur',unit:'cm',sides:true,min:1,gap:10,how:['Départ et réception sur la même jambe, réception tenue 2 s.','Mesure du bout du pied de départ au talon de réception.','Meilleur de trois essais par jambe.'],why:'Un écart de plus de 10 % entre les jambes signale un côté pas encore prêt.'},
    hopquality:{target:'réussi des deux côtés',label:'Réceptions sur une jambe',unit:'check',sides:true,how:['5 sauts une jambe vers l’avant, réception tenue 2 s.','Genou au-dessus du pied, bassin horizontal.'],why:'Contrôle attendu avant les changements de direction.'},
    sprint10:{target:'pas de seuil : c’est ta référence de vitesse',label:'Sprint 10 m chronométré',unit:'s',sides:false,track:true,how:['Départ arrêté, deux appuis.','Chrono par un partenaire ou vidéo au ralenti.','Meilleur de trois essais, récupération complète.'],why:'Ta référence de vitesse : on suit sa progression d’une étape à l’autre.'},
    shuttle:{target:'écart entre les deux sens de 5 % au plus',label:'Navette 5-10-5',unit:'s',sides:true,lower:true,gap:5,how:['Trois plots espacés de 5 m.','Chrono en partant vers la gauche, puis vers la droite.','Meilleur de deux essais par sens.'],why:'Changer de direction aussi vite des deux côtés.'},
    rsa:{target:'dernier sprint 10 % plus lent que le meilleur, au plus',label:'Sprints répétés 6 × 20 m',unit:'rsa',sides:false,how:['Un départ toutes les 30 s.','Note le temps du meilleur sprint et du dernier.'],why:'La vitesse doit tenir quand la fatigue arrive. Écart visé : 10 % au plus.'},
    ladder:{target:'six paliers validés',label:'Paliers de retour au jeu',unit:'ladder',sides:false,how:['Valide les six paliers de jeu ci-dessous.'],why:'Réexposer le corps au jeu progressivement.'},
    pain:{target:'aucune douleur à 3/10 ou plus',label:'Pas de douleur qui bloque',unit:'auto',sides:false,how:['Aucune douleur active à 3/10 ou plus aux chevilles, genoux ou hanches.','Aucun lendemain de séance signalé « pire » récemment.'],why:'On n’avance jamais sur une douleur.'}
  };
  const ladder = [
    {id:1,label:'Terrain en solo, sans opposition',hint:'30-45 min de jeu libre : courses, arrêts, sauts sans adversaire.'},
    {id:2,label:'Opposition légère 1 contre 1',hint:'Contact limité, séquences courtes, récupération entre les séquences.'},
    {id:3,label:'Petits matchs 3 contre 3',hint:'Intensité de match sur des séquences de 3-4 min.'},
    {id:4,label:'Entraînement collectif complet',hint:'Toute la séance, 5 contre 5 compris.'},
    {id:5,label:'Match amical, temps limité',hint:'10-15 min de jeu, découpées en entrées courtes.'},
    {id:6,label:'Match officiel',hint:'Temps de jeu progressif sur 2-3 matchs.'}
  ];

  const painFallback = {
    vitesse:['bike-interval','wall-drill','bike'],cardio:['bike','bike-interval','march'],
    freinage:['hip-abduction','monster-walk','single-leg-stand'],latéral:['monster-walk','hip-abduction','clamshell'],appuis:['single-leg-eyes','single-leg-stand','calf-hold'],
    détente:['kb-swing','db-hip-thrust','hip-thrust'],puissance:['kb-swing','db-hip-thrust','hip-thrust'],unilatéral:['single-bridge','step-down','single-rdl'],
    réception:['single-leg-stand','calf-hold'],rebond:['calf-hold','tibialis'],cheville:['single-leg-eyes','calf-hold'],force:['glute-kickback','single-bridge','bridge','db-hip-thrust','hip-thrust']
  };
  // Sans le matériel prévu : même type de mouvement, au poids du corps.
  const patternFallback = {push:['tempo-pushup','pushup','knee-pushup'],squat:['split-squat','squat','reverse-lunge'],hinge:['single-rdl','single-bridge','bridge'],calf:['single-calf','calf'],
    core:['side-plank','plank','deadbug','bird-dog'],jump:['split-jump','pogo','landing'],footwork:['wall-drill'],cardio:['march','stepjack','mountain-climber'],mobility:['ankle-mob','hip-circles'],arms:['diamond-pushup','pushup']};
  const group = position => ['meneur','arriere'].includes(position)?'guard':['ailier-fort','pivot'].includes(position)?'big':'wing';
  const stepById = id => steps.find(s=>s.id===Number(id));
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const uid = () => typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;

  function create({startStep=1,now=today()}={}) {
    return {id:uid(),startedAt:now,step:stepById(startStep)?Number(startStep):1,stepStartedAt:now,completed:[],tests:{},ladder:[],history:[{step:Number(startStep)||1,date:now}]};
  }
  function sessionsInStep(p,step=p.step) { return p.completed.filter(c=>c.step===step); }
  function weekOf(p,step=p.step) {
    const s=stepById(step); return Math.floor(sessionsInStep(p,step).length/s.days.length)+1;
  }
  function doseIndex(week,length) {
    if(week<=length) return week-1;
    return Math.min(length-1,week%4===0?3:2);
  }
  function parseDose(text) {
    const m=String(text).match(/^(\d+)x(\d+)(?:-(\d+))?$/);
    return m?{sets:Number(m[1]),min:Number(m[2]),max:Number(m[3]||m[2])}:{sets:3,min:8,max:12};
  }

  // Module du bilan athlétique, facultatif : sans lui (ou sans bilan), les séances restent celles d'avant.
  function athleticLib() {const g=typeof globalThis!=='undefined'?globalThis:{};if(g.AthleticProfile) return g.AthleticProfile;try{return typeof require==='function'?require('./athletic-profile.js'):null;}catch(e){return null;}}

  // Résout une séance du parcours contre le catalogue réel : matériel, niveau, douleurs, poste, bilan athlétique.
  function sessionPlan(PT,PP,state,p,dayKey,{minutes}={}) {
    const step=stepById(p.step),day=step&&step.days.find(d=>d.key===dayKey);
    if(!day) return {error:'Séance introuvable dans cette étape.'};
    const safety=PT.safety(state);
    if(safety.blocked) return {error:'Douleur importante ou signe inhabituel : pas de séance. Demande un avis médical avant de reprendre.'};
    const pains=safety.active, player=state.player||{}, g=group(player.position);
    const AP=state.athletic?athleticLib():null, athletic=AP?state.athletic:null;
    const week=weekOf(p);
    // guided : le moteur laisse le parcours doser les impacts et la reprise, étape par étape. Le même contrôle s'applique pendant la séance.
    const check={...state.checkIn,equipment:state.owned,focus:'muscle',format:'classic',minutes:minutes||60,date:today(),guided:p.step};
    const ctx=PT.context(state,check);
    const usable=e=>e&&PT.allowed(e,state,check,ctx)&&(!PP||PP.tolerates(e,pains));
    const all=PT.allExercises(state), find=id=>all.find(e=>e.id===id);
    const exercises=[],changes=[];
    // Un créneau facultatif (point faible du bilan) disparaît sans repli ni message s'il n'a aucun candidat compatible.
    const resolve=(slot,key)=>{
      const ids=(slot.pos&&slot.pos[g])||slot.ids;
      let chosen=ids.map(find).find(e=>usable(e)&&!exercises.some(x=>x.id===e.id));
      if(!chosen&&slot.optional) return null;
      // Zone douloureuse : un créneau d'impact devient du travail de hanche ou de cheville toléré.
      if(!chosen&&pains.length){chosen=painFallback[slot.role]?.map(find).find(e=>usable(e)&&!exercises.some(x=>x.id===e.id));if(chosen){chosen={...chosen,fallback:true};changes.push(`${slot.role} : ${chosen.name} à la place des impacts, le temps que la zone se calme.`);}}
      if(!chosen&&find(ids[0])){chosen=(patternFallback[find(ids[0]).pattern]||[]).map(find).find(e=>usable(e)&&!exercises.some(x=>x.id===e.id));if(chosen)changes.push(`${find(ids[0]).name} → ${chosen.name} (sans le matériel prévu).`);}
      else if(chosen&&!chosen.fallback&&!slot.optional&&chosen.id!==ids[0]&&find(ids[0]))changes.push(`${find(ids[0]).name} → ${chosen.name}.`);
      if(!chosen){changes.push(find(ids[0])?.pattern==='pull'&&!state.owned.some(id=>['bands','pullup','cable','dumbbells','kettlebell','barbell'].includes(id))?'Tirage : un élastique ou une barre de traction est nécessaire, rien ne le remplace au poids du corps.':`${slot.role} : aucun mouvement compatible aujourd’hui (matériel, douleur ou contexte).`);return null;}
      const {fallback,...base}=chosen;
      const d=slot.dosesFor?slot.dosesFor(base):slot;
      const idx=doseIndex(week,d.doses.length),dose=parseDose(d.doses[idx]);
      const e={...PT.makePrescription(base,'classic',check.minutes,ctx),sets:dose.sets,pathwayRole:slot.role,key};
      if(fallback){e.sets=Math.min(3,dose.sets);if(chosen.kind==='cardio'){e.sets=1;e.seconds=Math.min(e.seconds,480);}}
      else if(chosen.measure==='seconds') e.seconds=d.secs?d.secs[idx]:chosen.seconds;
      else if(slot.dosesFor&&chosen.kind==='cardio'&&d.secs) e.seconds=d.secs[idx];
      else if(dose.max>1){e.targetMin=dose.min;e.targetMax=dose.max;}
      if(ctx.upcoming.length&&chosen.impact){if(!slot.optional)changes.push(`${chosen.name} : écarté, un match ou un entraînement approche.`);return null;}
      return e;
    };
    day.slots.forEach((slot,i)=>{const e=resolve(slot,i<3);if(e)exercises.push(e);});
    // Point faible du bilan : un créneau de plus, adapté à l'étape, juste après les mouvements clés.
    let focusNote=null;
    if(athletic){
      const planned=day.slots.flatMap(s=>s.ids.concat(...Object.values(s.pos||{})));
      for(const focus of AP.focusSlots(athletic,player,step.id,day.key,planned)){
        const e=resolve(focus,true);
        if(e){exercises.splice(Math.min(3,exercises.length),0,e);focusNote=`${focus.level===0?'Point faible':'Priorité'} de ton bilan · ${focus.label.toLowerCase()} : ${e.name}.`;break;}
      }
    }
    // Bloc kiné en tête. Sans bilan : renforcement de la zone douloureuse seul, comme avant.
    let kineNote=null;
    if(athletic){
      const items=AP.kineBlock(state,{step:step.id,day:day.key,pains,count:AP.kineCount(state,minutes),available:id=>usable(find(id))&&!exercises.some(x=>x.id===id),present:id=>exercises.some(x=>x.id===id)});
      items.slice().reverse().forEach(x=>exercises.unshift({...PT.makePrescription(find(x.id),'classic',check.minutes,ctx),sets:x.source==='mobility'?2:3,pathwayRole:'kiné',kineSource:x.source,key:x.source==='pain'||x===items[0]}));
      if(items.length) kineNote=`Bloc kiné (${items.length} mouvement${items.length>1?'s':''}) : ${[...new Set(items.map(x=>x.why))].join(', ')}. Il ne remplace pas l’avis d’un kiné.`;
    } else if(PP&&pains.length){
      const rehabIds=PP.rehabBlock(pains,id=>usable(find(id))&&!exercises.some(x=>x.id===id),1);
      rehabIds.forEach(id=>{exercises.unshift({...PT.makePrescription(find(id),'classic',check.minutes,ctx),pathwayRole:'kiné',kineSource:'pain',key:true});changes.unshift(`${find(id).name} ajouté pour la zone signalée.`);});
    }
    if(!exercises.length) return {error:'Aucun mouvement de cette séance n’est compatible aujourd’hui. Adapte ton matériel ou choisis une autre séance.'};
    const budget=minutes?minutes*60-360:Infinity;
    while(PT.estimateSeconds(exercises,'classic')>budget&&exercises.some(e=>!e.key)) exercises.splice(exercises.map(e=>e.key).lastIndexOf(false),1);
    while(PT.estimateSeconds(exercises,'classic')>budget&&exercises.some(e=>e.sets>2)) {const e=[...exercises].reverse().find(x=>x.sets>2);e.sets--;}
    const deload=doseIndex(week,4)===3;
    const reasons=[`Étape ${step.id} · ${step.name}, semaine ${week}${week>step.minWeeks?' (consolidation)':''}.`];
    if(deload) reasons.push('Semaine allégée : moins de séries pour assimiler le travail.');
    if(player.position) reasons.push(`Variantes choisies pour ton poste (${PP?PP.positions[player.position]?.label:player.position}).`);
    if(kineNote&&exercises.some(e=>e.pathwayRole==='kiné')) reasons.push(kineNote);
    if(focusNote&&exercises.some(e=>['point faible','priorité'].includes(e.pathwayRole))) reasons.push(focusNote);
    if(pains.length) reasons.push('Zones signalées : seuls les mouvements qu’elles tolèrent sont gardés.');
    reasons.push(...step.rules);
    return {id:uid(),title:`${step.short} · ${day.name}`,source:'pathway',pathwayId:p.id,pathwayStep:step.id,pathwayWeek:week,pathwayDay:day.key,focus:'muscle',format:'classic',exercises,check,reasons:reasons.concat(changes),warmupSeconds:300,estimatedMinutes:Math.ceil((PT.estimateSeconds(exercises,'classic')+360)/60),status:'preview',entries:{},createdAt:new Date().toISOString()};
  }

  function markCompleted(p,{step,week,day,sessionId,date,partial}) {
    if(p.completed.some(c=>c.sessionId===sessionId)) return p;
    return {...p,completed:[...p.completed,{step,week,day,sessionId,date,partial:!!partial}]};
  }
  function weekStatus(p) {
    const step=stepById(p.step),week=weekOf(p),inStep=sessionsInStep(p);
    const doneThisWeek=inStep.slice(Math.floor(inStep.length/step.days.length)*step.days.length).map(c=>c.day);
    const next=step.days.find(d=>!doneThisWeek.includes(d.key))||step.days[0];
    return {week,minWeeks:step.minWeeks,done:doneThisWeek,next:next.key,sessions:inStep.length,needed:step.minWeeks*step.days.length};
  }

  function latest(p,id) { const list=p.tests[id]||[]; return list[list.length-1]||null; }
  function evaluate(id,record,p) {
    const t=tests[id];
    if(!record) return {ok:false,detail:'Pas encore mesuré.'};
    if(t.unit==='check') return {ok:t.sides?record.left===true&&record.right===true:record.value===true,detail:t.sides?`G ${record.left?'✓':'✗'} · D ${record.right?'✓':'✗'}`:record.value?'Validé':'Pas encore'};
    if(t.unit==='rsa') { const ok=Number(record.last)<=Number(record.best)*1.1; return {ok,detail:`${record.best} s → ${record.last} s (${Math.round((record.last/record.best-1)*100)} %)`}; }
    if(t.track) { const prev=(p.tests[id]||[]).slice(0,-1).pop(); return {ok:true,detail:`${record.value} s${prev?` (avant : ${prev.value} s)`:''}`}; }
    if(!t.sides) return {ok:Number(record.value)>=(t.min||0),detail:`${record.value} ${t.unit}`};
    const l=Number(record.left),r=Number(record.right),hi=Math.max(l,r),lo=Math.min(l,r);
    const gap=hi?Math.round((hi-lo)/hi*100):0;
    const enough=t.lower?true:lo>=(t.min||0);
    return {ok:enough&&gap<=t.gap,gap,detail:`G ${l} · D ${r} ${t.unit==='check'?'':t.unit} · écart ${gap} %`};
  }
  function ladderLevel(p) {
    // Un palier compte quand il est fait ET que le lendemain est calme.
    let level=0;
    for(const rung of ladder){ const entry=p.ladder.filter(x=>x.rung===rung.id).pop(); if(entry&&entry.nextDay==='ok') level=rung.id; else break; }
    return level;
  }
  function gate(PT,state,p) {
    const step=stepById(p.step),status=weekStatus(p);
    const criteria=[{id:'volume',label:`Au moins ${step.minWeeks} semaines de séances (${status.needed} séances)`,ok:status.sessions>=status.needed,detail:`${status.sessions} / ${status.needed}`}];
    step.tests.forEach(id=>{
      if(id==='pain'){
        const active=PT.activeSymptoms(state).filter(s=>['knee','ankle','hip','back'].includes(s.region)&&Number(s.severity)>=3);
        const recentWorse=state.sessions.filter(s=>s.pathwayId===p.id).slice(-3).some(s=>s.nextDay==='worse');
        criteria.push({id,label:tests.pain.label,ok:!active.length&&!recentWorse&&!PT.safety(state).blocked,detail:active.length?active.map(s=>`${PT.regions[s.region]} ${s.severity}/10`).join(', '):recentWorse?'Lendemain difficile récent':'Rien de signalé'});
      } else if(id==='ladder'){
        const level=ladderLevel(p);
        criteria.push({id,label:tests.ladder.label,ok:level>=ladder.length,detail:`${level} / ${ladder.length}`});
      } else {
        const r=evaluate(id,latest(p,id),p);
        criteria.push({id,label:tests[id].label,ok:r.ok,detail:r.detail});
      }
    });
    return {criteria,ready:criteria.every(c=>c.ok),last:p.step===steps.length};
  }
  function advance(p,now=today()) {
    if(p.step>=steps.length) return p;
    return {...p,step:p.step+1,stepStartedAt:now,history:[...p.history,{step:p.step+1,date:now}]};
  }
  function stepBack(p,now=today()) {
    if(p.step<=1) return p;
    return {...p,step:p.step-1,stepStartedAt:now,history:[...p.history,{step:p.step-1,date:now,back:true}]};
  }
  function recordTest(p,id,values,now=today()) {
    if(!tests[id]) return p;
    return {...p,tests:{...p.tests,[id]:[...(p.tests[id]||[]),{...values,date:now}].slice(-30)}};
  }
  function recordRung(p,rung,now=today()) {
    return {...p,ladder:[...p.ladder,{rung,date:now,nextDay:null}].slice(-60)};
  }
  function rungFeedback(p,index,nextDay) {
    return {...p,ladder:p.ladder.map((x,i)=>i===index?{...x,nextDay}:x)};
  }

  function validatePathway(v) {
    if(!v) return null;
    if(typeof v!=='object'||typeof v.id!=='string'||!stepById(v.step)) throw new Error('Parcours basket invalide.');
    const arr=x=>Array.isArray(x)?x:[];
    return {id:v.id,startedAt:String(v.startedAt||today()),step:Number(v.step),stepStartedAt:String(v.stepStartedAt||today()),
      completed:arr(v.completed).filter(c=>c&&stepById(c.step)&&typeof c.sessionId==='string').slice(-2000),
      tests:Object.fromEntries(Object.entries(v.tests&&typeof v.tests==='object'?v.tests:{}).filter(([k,list])=>tests[k]&&Array.isArray(list))),
      ladder:arr(v.ladder).filter(x=>x&&ladder.some(r=>r.id===x.rung)),history:arr(v.history)};
  }

  // Séances courtes à la carte : listes fixes, filtrées au lancement par le matériel et les douleurs.
  const quick = [
    {id:'knee-prev',title:'Prévention genoux',minutes:15,icon:'body',ids:[['spanish-squat','wall-sit'],['tke','hip-abduction'],['step-down','split-squat'],['single-bridge','bridge'],['tibialis']]},
    {id:'hips',title:'Mobilité du bassin',minutes:10,icon:'body',ids:[['hip-90-90'],['hip-flexor'],['worlds-greatest'],['pigeon','hip-circles'],['deep-squat-hold','cat']]},
    {id:'ankles',title:'Chevilles réactives',minutes:8,icon:'spark',ids:[['ankle-mob'],['single-leg-eyes','single-leg-stand'],['calf-hold'],['pogo','calf']]},
    {id:'antirot',title:'Gainage anti-rotation',minutes:10,icon:'weight',ids:[['pallof','pallof-cable'],['side-plank'],['bird-dog'],['suitcase-carry','deadbug']]},
    {id:'prematch',title:'Activation avant match',minutes:12,icon:'spark',ids:[['hip-circles'],['monster-walk','hip-abduction'],['wall-drill'],['pogo','calf'],['landing']]},
    {id:'recovery',title:'Récup lendemain de match',minutes:15,icon:'heart',ids:[['bike','march','walk'],['cat'],['hip-flexor'],['hamstring'],['calf-stretch'],['breath']]},
    // Départs chronométrés seulement à partir de l'étape 3 du parcours : avant, le premier pas se prépare sans sprint.
    {id:'first-step',title:'Premier pas',minutes:12,icon:'spark',impactFromStep:3,ids:[['wall-drill'],['a-march'],['knee-drive-iso'],['falling-start','split-start','psoas-march'],['psoas-march','single-bridge']]},
    // Construite depuis le bilan athlétique et les douleurs ; liste générique sans bilan.
    {id:'kine',title:'Mon bloc kiné',minutes:15,icon:'heart',ids:[['ankle-mob'],['couch-stretch','hip-flexor'],['spanish-squat','wall-sit'],['calf-hold'],['foot-doming','tibialis'],['active-slr','hamstring']]}
  ];
  function quickPlan(PT,PP,state,id) {
    const q=quick.find(x=>x.id===id); if(!q) return {error:'Séance introuvable.'};
    const safety=PT.safety(state);
    if(safety.blocked) return {error:'Douleur importante ou signe inhabituel : pas de séance. Demande un avis médical.'};
    const check={...state.checkIn,equipment:state.owned,focus:'mobility',format:'classic',minutes:q.minutes,date:today(),guided:1};
    const ctx=PT.context(state,check), all=PT.allExercises(state);
    const noImpact=q.impactFromStep&&(state.pathway?.step||1)<q.impactFromStep;
    const ok=x=>x&&PT.allowed(x,state,check,ctx)&&(!PP||PP.tolerates(x,safety.active))&&!(noImpact&&x.impact);
    const AP=q.id==='kine'?athleticLib():null;
    const kine=AP?AP.kineBlock(state,{day:'all',count:6,pains:safety.active,available:id=>ok(all.find(y=>y.id===id))}):[];
    const exercises=[];
    kine.map(x=>[x.id]).concat(q.ids).forEach(options=>{
      const e=options.map(x=>all.find(y=>y.id===x)).find(x=>ok(x)&&!exercises.some(y=>y.id===x.id));
      if(e) exercises.push({...PT.makePrescription(e,'classic',q.minutes,ctx),sets:2,rest:Math.min(e.rest,40)});
    });
    if(exercises[0]&&exercises[0].kind==='cardio'){exercises[0].sets=1;exercises[0].seconds=300;}
    while(PT.estimateSeconds(exercises,'classic')>q.minutes*60&&exercises.length>2) exercises.pop();
    if(!exercises.length) return {error:'Aucun mouvement compatible avec ton matériel et tes douleurs actuelles.'};
    const reasons=['Séance courte à la carte, hors parcours : elle ne fait pas avancer ton programme.'];
    if(kine.length) reasons.push(`Construite depuis ton bilan : ${[...new Set(kine.map(x=>x.why))].join(', ')}. Elle ne remplace pas l’avis d’un kiné.`);
    if(noImpact) reasons.push('Pas de départ chronométré avant l’étape 3 du parcours : on prépare le premier pas sans sprint.');
    return {id:uid(),title:q.title,source:'quick',focus:'mobility',format:'classic',exercises,check,reasons,warmupSeconds:q.id==='recovery'?0:120,estimatedMinutes:q.minutes,status:'preview',entries:{},createdAt:new Date().toISOString()};
  }

  return {steps,tests,ladder,quick,group,stepById,create,weekOf,weekStatus,sessionPlan,markCompleted,latest,evaluate,gate,advance,stepBack,recordTest,recordRung,rungFeedback,ladderLevel,validatePathway,quickPlan,parseDose};
});

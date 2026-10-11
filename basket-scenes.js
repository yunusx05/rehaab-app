/* Rehaab : QI « Lis ton défenseur » (lot 16). Scènes 1 contre 1 vues à la place du porteur de balle. Pur, sans DOM.
   Une scène décrit le défenseur (pied avant, mains, hanches, distance, closeout), l'aide éventuelle et la bonne action.
   Lectures écrites pour l'app à partir des principes courants du jeu 1 contre 1 (attaquer le pied avant, punir la main haute
   en drive, punir l'espace laissé par un tir, punir le closeout incontrôlé par une feinte, servir le joueur laissé par l'aide). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BasketScenes = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const today = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const LEVELS = [
    {id:1,label:'Un indice',hint:'Un seul détail du défenseur décide.'},
    {id:2,label:'Deux indices',hint:'Deux détails à combiner.'},
    {id:3,label:'Avec l’aide',hint:'Un deuxième défenseur peut venir.'},
    {id:4,label:'Vitesse et feintes',hint:'3 secondes pour décider.'}
  ];
  // Actions possibles, du point de vue du porteur. side : sens du déplacement (-1 gauche, 1 droite, 0 sur place).
  const ACTIONS = {
    'drive-left':{label:'Déborder à gauche',side:-1},
    'drive-right':{label:'Déborder à droite',side:1},
    'cross-left':{label:'Crossover, attaque à gauche',side:-1},
    'cross-right':{label:'Crossover, attaque à droite',side:1},
    shoot:{label:'Tir direct',side:0},
    'fake-drive':{label:'Feinte de tir, puis drive',side:0},
    'hesi-go':{label:'Hesi, puis accélère',side:0},
    'pass-left':{label:'Passe au joueur à gauche',side:-1},
    'pass-right':{label:'Passe au joueur à droite',side:1},
    finish:{label:'Finir au cercle',side:0}
  };
  const flip = s => s==='left'?'right':'left';
  const dir = s => s==='left'?-1:1;

  // Modèles de scène. side = côté du pied avant (vu par le porteur) ; chaque modèle existe en miroir.
  // defender : distance en mètres, foot ('left'|'right'|'square'), hands ('high'|'low'|'mid'), hips ('square'|'left'|'right'),
  // move ('static'|'closeout-fast'|'closeout-late'|'retreat'). help : côté d'où vient l'aide, ou null.
  const TEMPLATES = [
    {id:'lead-foot',level:1,build:side=>({defender:{distance:1.3,foot:side,hands:'mid',hips:'square',move:'static'},answer:`drive-${side}`,
      cues:[`Son pied avancé est de ton côté ${side==='left'?'gauche':'droit'}.`],
      why:`Attaque le côté de son pied avant : pour te suivre, il doit d’abord reculer ce pied et ouvrir les hanches. Ce temps perdu, c’est ton premier pas.`,
      distract:[`drive-${flip(side)}`,'shoot']})},
    {id:'sag',level:1,build:()=>({defender:{distance:3.2,foot:'square',hands:'low',hips:'square',move:'static'},answer:'shoot',
      cues:['Il reste loin, mains basses.'],
      why:'Il te laisse de l’espace et ne conteste pas : prends le tir. Le drive irait droit dans son placement.',
      distract:['drive-left','drive-right']})},
    {id:'overplay',level:1,build:side=>({defender:{distance:1.2,foot:'square',hands:'mid',hips:side,move:'static',shade:side},answer:`cross-${flip(side)}`,
      cues:[`Il se décale vers ta ${side==='left'?'gauche':'droite'} pour fermer ce côté.`],
      why:`Il ferme ta ${side==='left'?'gauche':'droite'} : ne force pas dedans. Un crossover t’emmène du côté qu’il a lâché.`,
      distract:[`drive-${side}`,'shoot']})},
    {id:'closeout-fast',level:1,build:()=>({defender:{distance:0.9,foot:'square',hands:'high',hips:'square',move:'closeout-fast'},answer:'fake-drive',
      cues:['Il arrive en courant, mains en l’air.'],
      why:'Il arrive trop vite pour s’arrêter : une feinte de tir le fait décoller ou se figer, et tu le passes dans la foulée.',
      distract:['shoot','hesi-go']})},
    {id:'closeout-late',level:1,build:()=>({defender:{distance:3.6,foot:'square',hands:'high',hips:'square',move:'closeout-late'},answer:'shoot',
      cues:['Il est encore loin quand tu reçois.'],
      why:'Le ballon arrive avant lui : tire dans le rythme. Attendre lui donne le temps de fermer.',
      distract:['fake-drive','drive-right']})},
    {id:'foot-hands-high',level:2,build:side=>({defender:{distance:1.0,foot:side,hands:'high',hips:'square',move:'static'},answer:`drive-${side}`,
      cues:[`Pied avancé de ton côté ${side==='left'?'gauche':'droit'}.`,'Mains hautes pour contester le tir.'],
      why:`Mains hautes : il pense au tir, pas au drive. Et son pied avancé est de ton côté ${side==='left'?'gauche':'droit'} : déborde par là, il ne peut pas pivoter à temps.`,
      distract:['shoot',`drive-${flip(side)}`]})},
    {id:'sag-foot',level:2,build:side=>({defender:{distance:3.0,foot:side,hands:'low',hips:'square',move:'static'},answer:'shoot',
      cues:[`Pied avancé de ton côté ${side==='left'?'gauche':'droit'}.`,'Mais il reste à 3 mètres, mains basses.'],
      why:'Le pied avant compte quand il est proche. À 3 mètres, mains basses, l’espace est le vrai cadeau : tire.',
      distract:[`drive-${side}`,'hesi-go']})},
    {id:'retreat',level:2,build:()=>({defender:{distance:2.0,foot:'square',hands:'low',hips:'square',move:'retreat'},answer:'hesi-go',
      cues:['Il recule en même temps que toi.','Poids sur les talons.'],
      why:'Il recule sur les talons : une hésitation le fait s’arrêter et se relever, puis tu repars avant qu’il reprenne ses appuis.',
      distract:['shoot','drive-left']})},
    {id:'fast-foot',level:2,build:side=>({defender:{distance:0.8,foot:side,hands:'high',hips:'square',move:'closeout-fast'},answer:'fake-drive',
      cues:['Il arrive en courant, mains hautes.',`En freinant, il avance le pied de ton côté ${side==='left'?'gauche':'droit'}.`],
      why:`Un closeout incontrôlé se punit par une feinte : il saute ou se fige. Pars ensuite du côté de son pied avancé, à ta ${side==='left'?'gauche':'droite'}.`,
      distract:['shoot',`drive-${flip(side)}`]})},
    {id:'help-comes',level:3,build:side=>({defender:{distance:1.2,foot:side,hands:'mid',hips:'square',move:'static'},help:flip(side),teammate:flip(side),answer:`pass-${flip(side)}`,
      cues:[`Pied avancé de ton côté ${side==='left'?'gauche':'droit'} : le drive est là.`,`Mais l’aide arrive de ta ${flip(side)==='left'?'gauche':'droite'}.`],
      why:`Tu as battu ton défenseur, l’aide quitte son joueur pour t’arrêter : ce joueur est maintenant seul. La passe vaut mieux que le contact.`,
      distract:['finish',`drive-${side}`]})},
    {id:'help-stays',level:3,build:side=>({defender:{distance:1.2,foot:side,hands:'mid',hips:'square',move:'static'},help:null,teammate:flip(side),answer:`drive-${side}`,
      cues:[`Pied avancé de ton côté ${side==='left'?'gauche':'droit'}.`,'L’aide reste collée à son joueur.'],
      why:`Personne ne vient aider : attaque le pied avant et va jusqu’au cercle. La passe ne crée rien si l’aide ne bouge pas.`,
      distract:[`pass-${flip(side)}`,'shoot']})},
    {id:'help-high',level:3,build:side=>({defender:{distance:3.0,foot:'square',hands:'low',hips:'square',move:'static'},help:side,teammate:side,answer:'shoot',
      cues:['Ton défenseur reste loin.',`L’aide fait un pas vers toi de ta ${side==='left'?'gauche':'droite'}.`],
      why:'L’aide montre seulement, ton défenseur te laisse de l’espace : le tir est ouvert maintenant. La passe arriverait trop tard.',
      distract:[`pass-${side}`,'drive-left']})}
  ];

  // Toutes les scènes : modèle × miroir × niveau (le niveau 4 reprend les niveaux 2 et 3 en temps limité).
  function all() {
    const out=[];
    TEMPLATES.forEach(t=>{
      const sides=t.build.length?['left','right']:['center'];
      sides.forEach(side=>{
        const s=t.build(side==='center'?undefined:side);
        const options=[s.answer,...s.distract].filter((v,i,a)=>a.indexOf(v)===i).slice(0,3);
        const base={...s,template:t.id,mirror:side,options,timed:false};
        out.push({...base,id:`${t.id}-${side}`,level:t.level});
        if(t.level>=2) out.push({...base,id:`${t.id}-${side}-v`,level:4,timed:true});
      });
    });
    return out;
  }
  const SCENES = all();
  const byId = id => SCENES.find(s=>s.id===id)||null;
  const actionLabel = id => (ACTIONS[id]||{}).label||id;

  // Mélange déterministe des options (même ordre à chaque affichage d'une scène).
  function optionOrder(scene) {
    let h=0;for(const c of scene.id)h=(h*31+c.charCodeAt(0))>>>0;
    return [...scene.options].sort((a,b)=>((h^a.length*7919)%7)-((h^b.length*7919)%7)||a.localeCompare(b));
  }

  // Historique : réponses du journal QI, mode « scene ».
  const answers = qi => ((qi&&qi.answers)||[]).filter(a=>a.mode==='scene');
  // Niveau atteint : 8 bonnes réponses sur les 10 dernières du niveau débloquent le suivant.
  function level(qi) {
    let lvl=1;
    for(const L of LEVELS.slice(0,3)){
      const list=answers(qi).filter(a=>(byId(a.id)||{}).level===L.id).slice(-10);
      if(list.length>=10&&list.filter(a=>a.correct).length>=8) lvl=L.id+1; else break;
    }
    return lvl;
  }
  // À revoir : scène ratée dont la dernière réponse est fausse, revue au plus tôt le lendemain.
  function due(qi,now=today()) {
    const last={};answers(qi).forEach(a=>{last[a.id]=a;});
    return Object.values(last).filter(a=>!a.correct&&a.date<now&&byId(a.id)).map(a=>byId(a.id));
  }
  // Série du jour : d'abord les scènes à revoir, puis le niveau atteint (et un peu du précédent), jamais deux fois le même modèle.
  function nextSet(qi,{count=5,now=today(),random=Math.random}={}) {
    const lvl=level(qi),seen=new Set(answers(qi).filter(a=>a.date===now).map(a=>a.id));
    const pick=[],templates=new Set();
    const take=list=>{for(const s of list){if(pick.length>=count)return;if(templates.has(s.template)||seen.has(s.id))continue;pick.push(s);templates.add(s.template);}};
    take(due(qi,now));
    const pool=SCENES.filter(s=>s.level===lvl||s.level===lvl-1&&random()<0.3).map(s=>({s,r:random()})).sort((a,b)=>a.r-b.r).map(x=>x.s);
    take(pool);
    if(pick.length<count) take(SCENES.filter(s=>s.level<=lvl).map(s=>({s,r:random()})).sort((a,b)=>a.r-b.r).map(x=>x.s));
    return {level:lvl,scenes:pick};
  }
  function record(qi,scene,choice,{ms=null,now=today()}={}) {
    const correct=choice===scene.answer;
    return {qi:{...qi,answers:[...((qi&&qi.answers)||[]),{id:scene.id,mode:'scene',theme:'on-ball',correct,date:now,...(ms!==null?{ms:Math.round(ms)}:{})}].slice(-3000)},correct};
  }
  function stats(qi) {
    const list=answers(qi);
    return {count:list.length,correct:list.filter(a=>a.correct).length,level:level(qi),due:due(qi).length};
  }

  return {LEVELS,ACTIONS,TEMPLATES,SCENES,byId,actionLabel,optionOrder,answers,level,due,nextSet,record,stats,dir};
});

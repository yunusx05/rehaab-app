/* Rehaab : sangle abdominale (lot 31). Pur, sans DOM.
   Le joueur la signale comme un de ses plus gros points faibles. Deux usages :
   - workout : un « core workout » de 10 à 20 min en circuit (abdos, gainage, rotation), lançable à tout moment ;
   - withFinisher : un finisher abdos de ~6 min ajouté à la fin des séances du parcours et de la muscu.
   Trois familles, pour travailler le tronc dans tous les sens : enrouler (flexion), résister à la cambrure (anti-extension),
   tourner ou résister à la rotation (obliques). Le niveau monte avec le nombre de séances abdos faites. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BasketCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const today = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const uid = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
  const hash = s => [...String(s)].reduce((n,c)=>(n*31+c.charCodeAt(0))%9973,7);

  const FAMILIES = {
    flexion:{label:'Abdos',why:'enrouler le buste et le bassin',ids:['crunch','band-crunch','reverse-crunch','bicycle-crunch','leg-raise','curl-up','heel-touch','cable-crunch','hanging-knee-raise','v-up','hanging-leg-raise']},
    anti:{label:'Gainage',why:'résister à la cambrure',ids:['plank','deadbug','band-deadbug','hollow-hold','plank-reach','plank-shoulder-tap','bear-hold','slider-climber','slider-bodysaw','hollow-rock']},
    rotation:{label:'Obliques & rotation',why:'tourner ou résister à la rotation',ids:['side-plank','pallof','band-woodchop','plank-hip-dip','russian-twist','side-plank-full','side-plank-lift','pallof-cable','suitcase-carry','landmine-rotation','plank-drag','side-plank-reach']}
  };
  const ALL = Object.values(FAMILIES).flatMap(f=>f.ids);
  const ORDER = ['flexion','anti','rotation'];

  // Séances abdos faites (core workout ou finisher terminé).
  function count(state) {
    return (state.sessions||[]).filter(s=>s&&(s.source==='core'||(s.exercises||[]).some(e=>e&&e.coreBlock))).length;
  }
  // Niveau 1 à 3 : 1 au départ, 2 après 6 séances abdos, 3 après 15.
  function level(state) {const n=count(state);return n>=15?3:n>=6?2:1;}

  function context(PT,state,check) {
    const c={...(state.checkIn||{}),equipment:state.owned||['bodyweight'],date:today(),guided:2,constraints:(state.checkIn&&state.checkIn.constraints)||[],...(check||{})};
    return {check:c,ctx:{...PT.context(state,c),low:false}};
  }
  // Candidats d'une famille, compatibles (matériel, douleurs, niveau), dans un ordre qui change chaque jour.
  function candidates(PT,state,fam,{check,ctx,lvl,date,exclude=[]}) {
    const all=PT.allExercises(state);
    return FAMILIES[fam].ids.map(id=>all.find(e=>e.id===id)).filter(e=>e&&!exclude.includes(e.id)&&(e.level||1)<=Math.max(1,lvl)&&PT.allowed(e,state,check,ctx))
      .sort((a,b)=>hash(a.id+date)-hash(b.id+date));
  }
  function dose(PT,e,{sets,ctx,format}) {
    const rx=PT.makePrescription(e,format,20,ctx),cap=v=>v?Math.min(v,15):v;
    // Circuit : on enchaîne (20 s pour changer de poste), séries de 15 répétitions au plus.
    return {...rx,sets,rest:format==='circuit'?20:Math.min(e.rest,35),targetMax:cap(rx.targetMax),max:cap(rx.max),targetMin:rx.targetMin?Math.min(rx.targetMin,cap(rx.targetMax||rx.max)||rx.targetMin):rx.targetMin,
      coreFamily:ORDER.find(f=>FAMILIES[f].ids.includes(e.id))};
  }

  // Core workout : deux exercices par famille (trois à 20 min), en circuit.
  function workout(PT,state,{minutes=12,date=today()}={}) {
    const safety=PT.safety(state);
    if(safety.blocked) return {error:'Douleur importante ou signe inhabituel : pas de séance. Demande un avis médical.'};
    const lvl=level(state),{check,ctx}=context(PT,state,{focus:'muscle',format:'circuit',minutes,date});
    const per=minutes>=20?3:2,rounds=lvl>=2?3:2,list=[];
    for(let i=0;i<per;i++) ORDER.forEach(f=>{const e=candidates(PT,state,f,{check,ctx,lvl,date,exclude:list.map(x=>x.id)})[0];if(e)list.push(e);});
    if(list.length<3) return {error:'Pas assez d’exercices d’abdos compatibles aujourd’hui (douleur au dos ou matériel).'};
    const exercises=list.map(e=>dose(PT,e,{sets:rounds,ctx,format:'circuit'}));
    const over=()=>PT.estimateSeconds(exercises,'circuit')>(minutes+2)*60;
    while(over()&&exercises.some(e=>e.sets>2)) exercises.forEach(e=>{if(e.sets>2)e.sets--;});
    while(over()&&exercises.length>3) exercises.pop();
    const reasons=[`Core workout niveau ${lvl} sur 3 : ${rounds} tours du circuit, une famille après l’autre.`,
      'Abdos (enrouler), gainage (ne pas cambrer), obliques (tourner) : un tronc fort dans tous les sens, celui qui tient au contact et en l’air.',
      'Souffle en contractant, le bas du dos ne se creuse jamais. Si la forme casse, arrête la série.'];
    if(lvl<3) reasons.push(`Encore ${(lvl===1?6:15)-count(state)} séance${(lvl===1?6:15)-count(state)>1?'s':''} abdos avant le niveau suivant.`);
    return {id:uid(),title:'Core workout',source:'core',focus:'muscle',format:'circuit',exercises,check,reasons,warmupSeconds:120,
      estimatedMinutes:Math.ceil((PT.estimateSeconds(exercises,'circuit')+120)/60),status:'preview',entries:{},createdAt:new Date().toISOString()};
  }

  // Finisher abdos : un exercice par famille, deux séries, à la fin de la séance.
  // Pas de finisher si la séance travaille déjà le tronc (deux exercices abdos ou plus), ni sur une séance courte.
  function finisher(PT,state,plan,{date=today()}={}) {
    if(!plan||plan.error||!Array.isArray(plan.exercises)) return null;
    if(['skills','cardio','core','match-intensity'].includes(plan.source)) return null;
    if(plan.exercises.some(e=>e.coreBlock)) return null;
    // Jour de soin (zone douloureuse) : la séance est déjà plus longue, on n'ajoute rien.
    // Lot 32 : une gêne n'a que deux mouvements de soin, le finisher reste (le gainage est un point faible).
    if(plan.exercises.filter(e=>e.pathwayRole==='soin').length>2) return null;
    if(plan.exercises.filter(e=>ALL.includes(e.id)).length>=2) return null;
    if(state.preferences&&state.preferences.coreFinisher===false) return null;
    const lvl=level(state),{check,ctx}=context(PT,state,{...(plan.check||{}),date});
    const used=plan.exercises.map(e=>e.id),list=[];
    ORDER.forEach(f=>{const e=candidates(PT,state,f,{check,ctx,lvl,date,exclude:used.concat(list.map(x=>x.id))})[0];if(e)list.push(e);});
    if(list.length<2) return null;
    const exercises=list.map(e=>({...dose(PT,e,{sets:2,ctx,format:'classic'}),coreBlock:true}));
    // Séance déjà longue : on garde deux exercices plutôt que de dépasser ta durée maximale de plus de 10 minutes.
    const max=Number(state.dossier&&state.dossier.answers&&state.dossier.answers.maxMinutes)||75;
    const est=()=>Math.ceil(PT.estimateSeconds(exercises,'classic')/60);
    if((plan.estimatedMinutes||0)+est()>max+10&&exercises.length>2) exercises.pop();
    if((plan.estimatedMinutes||0)+est()>max+15) return null;
    return {exercises,minutes:est()};
  }
  function withFinisher(PT,state,plan,opts={}) {
    const f=finisher(PT,state,plan,opts);
    if(!f) return plan;
    // Le soin de fin de séance (renforcement de la zone sensible) reste le dernier : le finisher passe juste avant.
    let at=plan.exercises.length;while(at>0&&plan.exercises[at-1].pathwayRole==='soin')at--;
    return {...plan,exercises:[...plan.exercises.slice(0,at),...f.exercises,...plan.exercises.slice(at)],reasons:[...(plan.reasons||[]),`Finisher abdos (~${f.minutes} min) : ta sangle abdominale, ton point faible, un peu à chaque séance.`],
      estimatedMinutes:(plan.estimatedMinutes||0)+f.minutes};
  }

  return {FAMILIES,ALL,count,level,workout,finisher,withFinisher};
});

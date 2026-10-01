/* Rehaab: profil joueur basket. Poste + profil de jeu + douleurs -> séance du jour et thèmes QI. Pur, sans DOM, pas de diagnostic. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PlayerProfile = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Qualités athlétiques visées, par poste puis par profil de jeu. Les poids s'additionnent.
  const positions = {
    meneur:{label:'Meneur',number:1,qualities:{decel:3,lateral:3,speed:2,ankle:2,unilateral:2,reactive:2,antirot:1,firststep:1},qi:['pnr-handler','tempo','on-ball','pnr-defense','transition','press-break']},
    arriere:{label:'Arrière',number:2,qualities:{speed:2,decel:2,lateral:2,unilateral:2,endurance:2,vertical:1,firststep:1},qi:['offball','on-ball','closeout','off-ball-defense','transition','pnr-handler']},
    ailier:{label:'Ailier',number:3,qualities:{vertical:2,lateral:2,unilateral:2,antirot:2,decel:1},qi:['cuts','help-defense','off-ball-defense','closeout','transition']},
    'ailier-fort':{label:'Ailier fort',number:4,qualities:{strength:3,vertical:2,contact:2,antirot:1,hip:1},qi:['pnr-screener','pnr-defense','help-defense','rebound','post-defense','spacing']},
    pivot:{label:'Pivot',number:5,qualities:{strength:3,contact:3,vertical:2,hip:1},qi:['pnr-screener','pnr-defense','rim-protection','rebound','post-defense','post']}
  };
  const archetypes = {
    shooter:{label:'Shooteur',hint:'Sorties d’écran, jambes qui tiennent jusqu’au 4e quart-temps.',qualities:{endurance:2,antirot:1,shoulder:1,ankle:1},qi:['offball']},
    slasher:{label:'Slasher',hint:'Premier pas, freinage, finir au contact.',qualities:{firststep:3,decel:3,unilateral:2,antirot:2,contact:1},qi:['cuts','finishing-reads']},
    createur:{label:'Créateur',hint:'Porte le ballon, fixe, décale.',qualities:{decel:2,lateral:1,reactive:1,firststep:1},qi:['pnr-handler','tempo']},
    defenseur:{label:'Défenseur',hint:'Glissements, contestation, aides.',qualities:{lateral:3,hip:2,endurance:1},qi:['on-ball','help-defense','closeout','off-ball-defense']},
    athlete:{label:'Athlète / finisseur',hint:'Détente, transition, jeu au-dessus du cercle.',qualities:{vertical:3,reactive:2},qi:['transition']},
    rebondeur:{label:'Rebondeur',hint:'Box-out, second effort, contacts.',qualities:{vertical:2,contact:2,strength:1},qi:['rebound']},
    stretch:{label:'Intérieur shooteur',hint:'Pick & pop, espace pour les autres.',qualities:{endurance:1,strength:1},qi:['pnr-screener','spacing']}
  };
  const qualityLabels = {decel:'Freinage',lateral:'Déplacements latéraux',ankle:'Chevilles réactives',unilateral:'Force sur une jambe',reactive:'Réactivité',speed:'Vitesse',antirot:'Gainage anti-rotation',endurance:'Tenir l’effort',vertical:'Détente',strength:'Force de base',contact:'Solidité au contact',hip:'Stabilité de hanche',shoulder:'Stabilité d’épaule',firststep:'Premier pas',mobility:'Mobilité',core:'Gainage'};

  // Étiquettes posées sur les exercices existants du catalogue (aucun identifiant modifié).
  const tags = {
    lateral:['band-shuffle','lateral-lunge','cossack','monster-walk','lateral-hop','skater','copenhagen','hip-abduction','lateral-bound-stick','lateral-decel','drop-step-start'],
    decel:['landing','depth-drop','reverse-lunge','split-squat','bulgarian','db-bulgarian','walking-lunge','single-rdl','step-down','decel-stick','snap-down','lateral-decel'],
    unilateral:['split-squat','bulgarian','db-bulgarian','step-up','db-step-up','single-rdl','db-single-rdl','single-bridge','assisted-pistol','legpress-single','single-calf','airplane','step-down','iso-split'],
    ankle:['calf','single-calf','db-calf','seated-calf','calf-hold','tibialis','pogo','ankle-mob','single-leg-stand','single-leg-eyes','single-pogo','foot-doming'],
    reactive:['pogo','lateral-hop','rope','split-jump','lateral-bound-stick','single-pogo','drop-jump','a-skip'],
    vertical:['box-jump-step','broad-jump','split-jump','kb-swing','hip-thrust','db-hip-thrust','bb-hip-thrust','front-squat','push-press','vertical-jump','approach-jump','single-leg-vertical','db-jump','drop-jump'],
    strength:['bb-squat','front-squat','deadlift','sumo-deadlift','bb-rdl','legpress','bb-hip-thrust','bb-press','bb-row','pullup','goblet'],
    antirot:['pallof','pallof-cable','suitcase-carry','side-plank','side-plank-lift','bird-dog','deadbug','plank-shoulder-tap','halo'],
    contact:['carry','bear-hold','copenhagen','bb-row','pullup','side-plank-full','suitcase-carry'],
    hip:['hip-abduction','clamshell','monster-walk','copenhagen','airplane','hip-90-90'],
    shoulder:['facepull','facepull-cable','band-pullapart','rear-delt-fly','scap-pushup','band-dislocate'],
    speed:['accel-10','sprint-20','wall-drill','crossover-start','shuttle-5105','falling-start','split-start','band-resisted-start'],
    firststep:['a-march','a-skip','knee-drive-iso','psoas-march','wall-drill','falling-start','split-start','drop-step-start','band-resisted-start','accel-10','crossover-start'],
    mobility:['ankle-mob','calf-stretch','hip-90-90','hip-flexor','couch-stretch','active-slr','hamstring','worlds-greatest','thoracic','deep-squat-hold'],
    core:['plank','deadbug','hollow-hold','bird-dog','bear-hold','plank-reach','pallof','side-plank'],
    endurance:['bike-interval','rower-interval','skater','run-interval','stepjack','wall-sit']
  };
  const qualitiesOf = id => Object.keys(tags).filter(q => tags[q].includes(id));

  // Charge sur le genou : low = toléré même douloureux, moderate = seulement si gêne légère, high = écarté.
  const kneeHigh = ['reverse-nordic','couch-stretch','bulgarian','db-bulgarian','cossack','curtsy-lunge','assisted-pistol','walking-lunge','legextension','nordic-assisted','deep-squat-hold','pigeon','bb-squat','front-squat','lateral-lunge','decel-stick'];
  const kneeModerate = ['copenhagen','slant-squat'];
  const kneeLow = ['foot-doming','psoas-march','active-slr','knee-drive-iso','a-march','bridge','single-bridge','hip-thrust','db-hip-thrust','bb-hip-thrust','clamshell','hip-abduction','glute-kickback','back-extension','kb-swing','rdl','kb-deadlift','kb-rdl','db-single-rdl','single-rdl','band-hinge','airplane','wall-sit','tke','spanish-squat','iso-split','calf','single-calf','db-calf','seated-calf','calf-hold','tibialis','side-plank','side-plank-lift','bird-dog','bear-hold','single-leg-stand','single-leg-eyes','tandem-stand','bike','march','monster-walk'];
  const ankleHigh = ['pogo','rope','lateral-hop','skater','run','run-interval','stair','high-knees','jumping-jack','cossack','deep-squat-hold','single-calf','db-calf'];
  const ankleModerate = ['a-march','knee-drive-iso','slant-squat'];
  const ankleLow = ['foot-doming','psoas-march','active-slr','couch-stretch','calf-hold','tibialis','seated-calf','ankle-mob','single-leg-stand','tandem-stand','bridge','hip-thrust','db-hip-thrust','bb-hip-thrust','clamshell','hip-abduction','legcurl','bike','spanish-squat','tke'];
  // Hanche / aine : rotation, grande flexion, écart et impacts chargent la zone ; fessiers, gainage et isométrie la protègent.
  const hipHigh = ['psoas-march','couch-stretch','deep-squat-hold','pigeon','hip-90-90','hip-circles','cossack','curtsy-lunge','lateral-lunge','assisted-pistol','bb-squat','front-squat','bulgarian','db-bulgarian','walking-lunge','sumo-deadlift','good-morning','deadlift','nordic-assisted','airplane','worlds-greatest','hip-flexor','leg-raise','hanging-knee-raise','russian-twist','band-shuffle','skater','mountain-climber','squat-thrust','burpee-nojump','rower','rower-interval','stair','walk-hill','wall-drill','crossover-start'];
  const hipModerate = ['knee-drive-iso','active-slr','slant-squat','reverse-nordic','a-march','copenhagen','kb-swing','legpress','legpress-single','goblet','goblet-db','db-squat','kb-front-squat','box-squat','split-squat','reverse-lunge','db-lunge','step-up','db-step-up','step-down','iso-split','rdl','kb-rdl','bb-rdl','kb-deadlift','single-rdl','db-single-rdl','band-hinge','back-extension','side-plank-lift','bear-crawl','reverse-crunch','cable-crunch','single-leg-reach','monster-walk','wall-sit','spanish-squat','band-squat','squat','legcurl','legextension','hamstring','downdog','quad-rotation'];
  const hipLow = ['foot-doming','adductor-squeeze','bridge','single-bridge','hip-thrust','db-hip-thrust','bb-hip-thrust','glute-kickback','clamshell','hip-abduction','bike','march','walk','deadbug','plank','side-plank','side-plank-full','bird-dog','bear-hold','pallof','pallof-cable','hollow-hold','plank-shoulder-tap','plank-reach','carry','suitcase-carry','overhead-carry','single-leg-stand','single-leg-eyes','tandem-stand','heel-toe-walk','cat','childs-pose','thoracic','shadow-box'];
  function load(e,region) {
    if(region==='hip') {
      if(hipLow.includes(e.id)) return 'low';
      if(hipHigh.includes(e.id) || e.impact || e.pattern==='jump') return 'high';
      if(hipModerate.includes(e.id)) return 'moderate';
      return ['squat','hinge','cardio','mobility'].includes(e.pattern)?'moderate':'low';
    }
    if(region==='knee') {
      if(kneeModerate.includes(e.id)) return 'moderate';
      if(kneeLow.includes(e.id)) return 'low';
      if(kneeHigh.includes(e.id) || e.impact || e.pattern==='jump') return 'high';
      return ['squat','cardio'].includes(e.pattern)?'moderate':'low';
    }
    if(region==='ankle') {
      if(ankleLow.includes(e.id)) return 'low';
      if(ankleHigh.includes(e.id) || e.impact || e.pattern==='jump') return 'high';
      if(ankleModerate.includes(e.id)) return 'moderate';
      return ['squat','calf','cardio'].includes(e.pattern)?'moderate':'low';
    }
    return null; // autres zones : on garde la règle actuelle du moteur (exclusion).
  }
  // Renforcement ciblé, par ordre de priorité. Douleur modérée : isométrie et hanche. Gêne légère : contrôle dynamique.
  const rehab = {
    knee:{moderate:['spanish-squat','hip-abduction','wall-sit','single-bridge','tibialis','single-leg-stand'],light:['tke','step-down','spanish-squat','hip-abduction','single-bridge','tibialis']},
    ankle:{moderate:['calf-hold','single-leg-stand','seated-calf','tibialis'],light:['tibialis','single-leg-eyes','seated-calf','calf-hold','ankle-mob']},
    hip:{moderate:['adductor-squeeze','bridge','hip-abduction','side-plank','deadbug'],light:['adductor-squeeze','copenhagen','single-bridge','hip-abduction','clamshell','hip-thrust']}
  };
  // Explosivité sans impact quand les sauts sont écartés : intention de vitesse sur la hanche.
  const hipPower = ['kb-swing','bb-hip-thrust','db-hip-thrust','hip-thrust'];

  function tier(severity) { return Number(severity)<=3?'light':'moderate'; }
  // Un exercice est-il compatible avec toutes les douleurs actives ?
  function tolerates(e,pains) {
    return pains.every(p=>{
      if(!e.regions.includes(p.region)) return true;
      const level=load(e,p.region);
      if(level===null) return false;
      return level==='low' || (level==='moderate' && tier(p.severity)==='light');
    });
  }
  // Bilan athlétique facultatif : ses points faibles s'ajoutent aux qualités du poste et du profil de jeu.
  function athleticLib() {const g=typeof globalThis!=='undefined'?globalThis:{};if(g.AthleticProfile) return g.AthleticProfile;try{return typeof require==='function'?require('./athletic-profile.js'):null;}catch(e){return null;}}
  function priorities(player,athletic) {
    const total={};
    const add=q=>Object.entries(q||{}).forEach(([k,v])=>total[k]=(total[k]||0)+v);
    add(positions[player.position]?.qualities);
    (player.archetypes||[]).forEach(a=>add(archetypes[a]?.qualities));
    const AP=athletic&&athleticLib();
    if(AP) add(AP.weights(athletic));
    return Object.entries(total).sort((a,b)=>b[1]-a[1]).map(([id,weight])=>({id,weight,label:qualityLabels[id]}));
  }
  function bonus(e,player,athletic) {
    const weights=Object.fromEntries(priorities(player,athletic).map(p=>[p.id,p.weight]));
    return qualitiesOf(e.id).reduce((n,q)=>n+(weights[q]||0),0);
  }
  function rehabBlock(pains,available,count=2) {
    const out=[];
    pains.filter(p=>rehab[p.region]).forEach(p=>{
      rehab[p.region][tier(p.severity)].forEach(id=>{ if(out.length<count && !out.includes(id) && available(id)) out.push(id); });
    });
    return out;
  }

  // Séance « Corps » du jour : réutilise PT.generate sans le modifier.
  // - les exercices non tolérés passent en « avoids »,
  // - les plus utiles pour le poste passent en « anchors » (+4) et « likes » (+2),
  // - le renforcement de la zone douloureuse est épinglé en tête (« pinned »).
  function dailyBody(PT,state,{minutes,random}={}) {
    const safety=PT.safety(state);
    if(safety.blocked) return {error:'Douleur importante ou signe inhabituel : pas de séance générée. Demande un avis médical avant de reprendre.'};
    const player=state.player||{};
    const pains=safety.active;
    const check={...state.checkIn,focus:'muscle',minutes:minutes||state.checkIn.minutes};
    const shadow={...state,symptoms:[],preferences:{likes:[],avoids:[],anchors:[]}};
    const ctx=PT.context(shadow,check);
    const usable=e=>PT.allowed(e,shadow,check,ctx) && tolerates(e,pains) && !state.preferences.avoids.includes(e.id);
    const pool=PT.allExercises(state).filter(usable);
    const athletic=state.athletic||null, AP=athletic&&athleticLib();
    const ranked=pool.filter(e=>e.kind==='strength').map(e=>({id:e.id,score:bonus(e,player,athletic)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    // Avec un bilan : bloc kiné complet (douleur, mobilité qui manque, tendons). Sans bilan : renforcement de la zone douloureuse seul.
    const kine=AP?AP.kineBlock(state,{day:'all',available:id=>pool.some(e=>e.id===id),count:minutes>=30||!minutes?2:1,pains}):null;
    const rehabIds=kine?kine.map(x=>x.id):rehabBlock(pains,id=>pool.some(e=>e.id===id),minutes>=30||!minutes?2:1);
    const wantsPower=['meneur','ailier','pivot'].includes(player.position)||(player.archetypes||[]).some(a=>['athlete','slasher','rebondeur'].includes(a));
    const power=pains.some(p=>['knee','ankle'].includes(p.region)) && wantsPower?hipPower.filter(id=>pool.some(e=>e.id===id)).slice(0,1):[];
    const pinned=rehabIds.concat(power).map(id=>PT.makePrescription(pool.find(e=>e.id===id),'classic',check.minutes,ctx));
    shadow.preferences={
      likes:state.preferences.likes.concat(ranked.slice(4,10).map(x=>x.id)),
      avoids:state.preferences.avoids.concat(PT.allExercises(state).filter(e=>!tolerates(e,pains)).map(e=>e.id)),
      anchors:state.preferences.anchors.concat(ranked.slice(0,4).map(x=>x.id))
    };
    const plan=PT.generate(shadow,check,{pinned,random});
    if(plan.error) return plan;
    const top=priorities(player,athletic).slice(0,3).map(p=>p.label.toLowerCase());
    const reasons=[];
    if(positions[player.position]) reasons.push(`${positions[player.position].label} : priorité ${top.join(', ')}.`);
    pains.forEach(p=>{
      const label=PT.regions[p.region].toLowerCase();
      if(load({id:'',pattern:'',regions:[]},p.region)===null) reasons.push(`Douleur ${label} : mouvements qui sollicitent la zone écartés.`);
      else reasons.push(tier(p.severity)==='moderate'
        ?`Douleur ${label} ${p.severity}/10 : seulement des mouvements peu chargés pour la zone, renforcement isométrique en tête.`
        :`Gêne ${label} ${p.severity}/10 : impacts et flexions profondes écartés, renforcement ciblé en tête.`);
    });
    if(kine&&kine.some(x=>x.source!=='pain')) reasons.push(`Bloc kiné : ${[...new Set(kine.map(x=>x.why))].join(', ')}.`);
    if(plan.exercises.some(e=>power.includes(e.id)))
      reasons.push('Explosivité sans impact : montée rapide des hanches (swing, hip thrust) plutôt que des sauts, le temps que la zone se calme.');
    reasons.push('Arrête un mouvement qui réveille la douleur. Ce plan ne remplace pas l’avis d’un kiné.');
    return {...plan,title:'Le corps',exercises:plan.exercises.map(e=>({...e,role:rehabIds.includes(e.id)?(kine&&kine.find(x=>x.id===e.id).source!=='pain'?'kine':'rehab'):'performance'})),reasons};
  }

  // Côté « Esprit » : thèmes de QI basket du jour, pondérés par poste puis profil.
  function qiThemes(player) {
    const weight={};
    (positions[player.position]?.qi||[]).forEach((t,i)=>weight[t]=(weight[t]||0)+(4-i));
    (player.archetypes||[]).forEach(a=>(archetypes[a]?.qi||[]).forEach(t=>weight[t]=(weight[t]||0)+2));
    return Object.entries(weight).sort((a,b)=>b[1]-a[1]).map(([id])=>id);
  }

  function validatePlayer(p) {
    if(!p || typeof p!=='object') return null;
    return {
      position:positions[p.position]?p.position:'',
      archetypes:Array.isArray(p.archetypes)?p.archetypes.filter(a=>archetypes[a]).slice(0,3):[],
      level:['loisir','club','regional','national'].includes(p.level)?p.level:'club',
      season:['off','pre','in'].includes(p.season)?p.season:'in',
      layoff:['none','months','long'].includes(p.layoff)?p.layoff:'none',
      goals:Array.isArray(p.goals)?p.goals.filter(g=>['speed','vertical','injury','strength','endurance'].includes(g)).slice(0,3):[]
    };
  }

  return {positions,archetypes,qualityLabels,tags,load,tolerates,priorities,bonus,rehabBlock,dailyBody,qiThemes,validatePlayer};
});

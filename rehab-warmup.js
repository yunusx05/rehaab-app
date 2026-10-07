/* Quick Rehab et Warm Up basket : protocoles publiés, ciblés par un questionnaire. Pas de diagnostic médical. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RehabWarmup = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const uid = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
  const today = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const LEVELS = ['Calmer','Renforcer','Retour terrain'];
  const levelHints = [
    'Isométrique et charges légères : on calme la douleur sans arrêter de bouger.',
    'On recharge le tendon ou l’articulation de façon progressive.',
    'Vitesse, appuis et réceptions : on prépare le retour sur le terrain.'
  ];

  // Références : affichées dans l'app, listées en entier dans REHAB-SOURCES.md.
  const S = {
    rio:{label:'Rio et al. 2019 · isométriques et tendon rotulien en saison',url:'https://pubmed.ncbi.nlm.nih.gov/31033611/'},
    patLoad:{label:'Progression de charge du tendon rotulien (2024)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10925836/'},
    decline:{label:'Kongsgaard et al. 2006 · squat sur plan incliné',url:'https://pubmed.ncbi.nlm.nih.gov/16675081/'},
    pfp:{label:'Recommandations JOSPT 2019 · douleur fémoro-patellaire',url:'https://www.jospt.org/doi/10.2519/jospt.2019.0302'},
    fifaBasket:{label:'Longo et al. 2012 · FIFA 11+ chez des basketteurs élites',url:'https://pubmed.ncbi.nlm.nih.gov/22415208/'},
    shred:{label:'SHRed Injuries Basketball · JOSPT 2022 (−36 % de blessures genou et cheville)',url:'https://www.jospt.org/doi/10.2519/jospt.2022.10959'},
    fifa:{label:'FIFA 11+ · BJSM 2015',url:'https://bjsm.bmj.com/content/49/9/577'},
    ankleWarm:{label:'Échauffement neuromusculaire de la cheville en basket élite (Apunts 2021)',url:'https://revista-apunts.com/en/a-specific-neuromuscular-warm-up-focusing-on-ankle-sprain-injuries-in-elite-basketball/'},
    mckeon:{label:'McKeon et al. 2008 · équilibre et instabilité de cheville',url:'https://pubmed.ncbi.nlm.nih.gov/18799992/'},
    eils:{label:'Eils et al. 2010 · proprioception et entorses en basket',url:'https://doi.org/10.1249/MSS.0b013e3181e03667'},
    plisky:{label:'Plisky et al. 2006 · Star Excursion et risque de blessure en basket',url:'https://doi.org/10.2519/jospt.2006.2244'},
    backman:{label:'Backman et Danielson 2011 · cheville raide et genou du sauteur en basket',url:'https://doi.org/10.1177/0363546511420552'},
    alfredson:{label:'Alfredson et al. 1998 · excentrique du mollet et tendon d’Achille',url:'https://pubmed.ncbi.nlm.nih.gov/9617396/'},
    silbernagel:{label:'Silbernagel et al. 2007 · sport poursuivi avec suivi de la douleur',url:'https://pubmed.ncbi.nlm.nih.gov/17307888/'},
    rathleff:{label:'Rathleff et al. 2015 · montées sur pointes lourdes et fasciite plantaire',url:'https://pubmed.ncbi.nlm.nih.gov/25145882/'},
    holmich:{label:'Hölmich et al. 1999 · entraînement actif et douleur de l’aine',url:'https://pubmed.ncbi.nlm.nih.gov/9989713/'},
    copenhagen:{label:'Exercice de Copenhague · effets neuromusculaires',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8486394/'},
    nordic:{label:'van Dyk et al. 2019 · le Nordic divise par deux les blessures des ischios',url:'https://pubmed.ncbi.nlm.nih.gov/30808663/'},
    mcgill:{label:'McGill · « Big 3 » (curl-up, gainage latéral, bird-dog)',url:'https://north40pt.com/mcgill-big-3/'},
    kuhn:{label:'Kuhn 2009 · protocole d’exercices pour la coiffe des rotateurs',url:'https://pubmed.ncbi.nlm.nih.gov/18835532/'},
    cuffIso:{label:'Isométrique ou isotonique pour la coiffe (protocole 2023)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10642785/'},
    orthoShoulder:{label:'OrthoInfo (AAOS) · programme coiffe et épaule',url:'https://www.orthoinfo.org/recovery/rotator-cuff-and-shoulder-conditioning-program/'},
    tyler:{label:'Tyler et al. 2010 · excentrique des extenseurs du poignet et coude',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2971639/'},
    neck:{label:'Recommandations JOSPT 2017 · douleur du cou',url:'https://www.jospt.org/doi/10.2519/jospt.2017.0302'}
  };

  // Un créneau : liste d'ids par ordre de préférence, ou {ids, sets, seconds, min, max, rest}.
  const protocols = [
    {id:'knee-patellar',zone:'knee',region:'knee',title:'Tendon rotulien (genou du sauteur)',short:'Sous la rotule, en sautant ou en atterrissant',sources:['rio','patLoad','decline','backman'],
      levels:[
        [{ids:['spanish-squat','wall-sit'],sets:5,seconds:45,rest:60},['single-bridge','bridge'],['hip-abduction','clamshell'],{ids:['calf-hold','calf'],sets:3},['ankle-mob']],
        [{ids:['spanish-squat','wall-sit'],sets:4,seconds:45,rest:60},{ids:['slant-squat','box-squat'],sets:3},['step-down','split-squat'],['single-bridge'],['calf','single-calf']],
        [{ids:['slant-squat','spanish-squat'],sets:3},['vest-split-squat','split-squat','step-down'],['snap-down','iso-split'],['pogo','calf'],['decel-stick','single-leg-reach']]
      ]},
    {id:'knee-pfp',zone:'knee',region:'knee',title:'Devant du genou, autour de la rotule',short:'Escaliers, assis longtemps, squats',sources:['pfp','fifaBasket'],
      levels:[
        [['tke','wall-sit'],['clamshell','hip-abduction'],['single-bridge','bridge'],{ids:['wall-sit','iso-split'],sets:3,seconds:30},['side-plank']],
        [['hip-abduction','monster-walk','clamshell'],['step-down','box-squat'],['box-squat','squat'],['tke'],['side-plank-full','side-plank']],
        [['split-squat','slider-reverse-lunge','step-down'],['step-down'],['single-leg-reach','single-leg-stand'],['lateral-bound-stick','single-leg-reach'],['monster-walk','hip-abduction']]
      ]},
    {id:'knee-control',zone:'knee',region:'knee',title:'Genou qui rentre à la réception',short:'Prévention des entorses du genou et du LCA',sources:['fifaBasket','fifa','shred'],
      levels:[
        [['monster-walk','hip-abduction','clamshell'],['single-leg-stand'],['single-bridge'],['nordic-assisted','slider-ham-curl','bridge'],['side-plank']],
        [['single-leg-reach','single-leg-stand'],['step-down'],['nordic-assisted','slider-ham-curl','single-bridge'],['snap-down','iso-split'],['monster-walk','hip-abduction']],
        [['snap-down','squat'],['lateral-bound-stick','single-leg-reach'],['single-hop-stick','step-down'],['decel-stick','lateral-shuffle'],['nordic-assisted','slider-ham-curl']]
      ]},
    {id:'ankle-sprain',zone:'foot',region:'ankle',title:'Entorse de cheville (récente ou à répétition)',short:'Torsion sur un pied, cheville qui lâche',sources:['mckeon','eils','plisky','ankleWarm'],
      levels:[
        [['ankle-alphabet','ankle-mob'],['seated-calf','calf-hold'],['tibialis'],['single-leg-stand','tandem-stand'],['foot-doming']],
        [['single-leg-eyes','single-leg-stand'],['calf','single-calf'],['single-leg-reach'],['heel-toe-walk'],['tibialis']],
        [['single-calf','calf'],['pogo','single-leg-reach'],['lateral-bound-stick','single-leg-eyes'],['single-hop-stick','heel-toe-walk'],['defensive-slide','lateral-shuffle']]
      ]},
    {id:'ankle-stiff',zone:'foot',region:'ankle',title:'Cheville raide',short:'Genou qui n’avance pas au-dessus du pied',sources:['backman','ankleWarm'],
      levels:[
        [['ankle-mob'],['calf-stretch'],['ankle-alphabet'],['tibialis']],
        [['ankle-mob'],['slant-squat','squat'],['calf','seated-calf'],['deep-squat-hold','calf-stretch']],
        [['ankle-mob'],['single-calf','calf'],['pogo','calf'],['deep-squat-hold','calf-stretch']]
      ]},
    {id:'achilles',zone:'foot',region:'ankle',title:'Tendon d’Achille et mollet',short:'Derrière le talon, raide le matin',sources:['alfredson','silbernagel'],
      levels:[
        [{ids:['calf-hold','seated-calf'],sets:5,seconds:45,rest:60},['seated-calf'],['foot-doming','tibialis'],['tibialis']],
        [{ids:['calf','seated-calf'],sets:3,min:12,max:15},{ids:['heel-drop-ecc','calf'],sets:3,min:12,max:15},['seated-calf'],['tibialis']],
        [['single-calf','vest-calf','calf'],['heel-drop-ecc'],['pogo','calf'],['single-pogo','single-calf']]
      ]},
    {id:'plantar',zone:'foot',region:'ankle',title:'Dessous du pied et talon',short:'Douleur au premier pas du matin',sources:['rathleff','silbernagel'],
      levels:[
        [['foot-doming'],['seated-calf'],['calf-stretch'],['ankle-alphabet']],
        [{ids:['single-calf','calf'],sets:3,min:8,max:12,rest:90},['foot-doming'],['calf-stretch'],['tibialis']],
        [{ids:['vest-calf','single-calf','calf'],sets:4,min:6,max:10,rest:90},['foot-doming'],['pogo','heel-toe-walk'],['calf-stretch']]
      ]},
    {id:'shin',zone:'foot',region:'ankle',title:'Tibia (périostite)',short:'Long de l’intérieur du tibia, en courant',sources:['ankleWarm','silbernagel'],
      levels:[
        [['tibialis'],['seated-calf'],['foot-doming'],['calf-hold']],
        [['calf'],['tibialis'],['heel-toe-walk'],['single-leg-stand']],
        [['single-calf','calf'],['tibialis'],['pogo','heel-toe-walk'],['single-leg-reach']]
      ]},
    {id:'groin',zone:'hip',region:'hip',title:'Aine et adducteurs',short:'Intérieur de cuisse, en changeant de direction',sources:['holmich','copenhagen'],
      levels:[
        [{ids:['adductor-squeeze'],sets:5,seconds:20,rest:30},['bridge'],['side-plank'],['deadbug']],
        [['adductor-squeeze'],['copenhagen','side-plank'],['single-bridge'],['slider-adductor','side-plank-full'],['deadbug','bird-dog']],
        [['copenhagen','side-plank-full'],['slider-lateral-lunge','lateral-lunge'],['lateral-shuffle','monster-walk'],['lateral-bound-stick','single-leg-reach'],['crossover-start','defensive-slide']]
      ]},
    {id:'hip-flexor',zone:'hip',region:'hip',title:'Avant de la hanche',short:'Pli de l’aine, en montant le genou',sources:['holmich','fifa'],
      levels:[
        [['bridge'],['deadbug'],['knee-drive-iso'],['hip-flexor']],
        [['psoas-march','knee-drive-iso'],['single-bridge'],['couch-stretch','hip-flexor'],['deadbug']],
        [['a-march'],['psoas-march'],['wall-drill'],['skip-a','a-march']]
      ]},
    {id:'hip-lateral',zone:'hip',region:'hip',title:'Côté de la hanche',short:'Couché sur le côté, monter les escaliers',sources:['pfp','fifa'],
      levels:[
        [['side-plank'],['single-bridge','bridge'],['clamshell'],['hip-abduction']],
        [['monster-walk','hip-abduction'],['side-plank-full','side-plank'],['single-rdl','single-bridge'],['step-down']],
        [['airplane','single-rdl'],['single-leg-reach'],['lateral-shuffle','monster-walk'],['lateral-bound-stick','single-leg-reach']]
      ]},
    {id:'hamstring',zone:'hip',region:'hip',title:'Arrière de cuisse (ischios)',short:'Tiraillement en sprintant ou en se penchant',sources:['nordic','fifaBasket'],
      levels:[
        [{ids:['bridge','single-bridge'],sets:3,seconds:30},['active-slr'],['slider-ham-curl','single-bridge'],['bird-dog']],
        [['nordic-assisted','slider-ham-curl','single-bridge'],['single-rdl','band-hinge'],['slider-ham-curl','single-bridge'],['active-slr']],
        [['nordic-assisted','slider-ham-curl'],['single-rdl'],['skip-a','a-march'],['accel-10','wall-drill']]
      ]},
    {id:'low-back',zone:'back',region:'back',title:'Bas du dos',short:'Après les contacts, les sauts ou assis longtemps',sources:['mcgill','fifa'],
      levels:[
        [['cat'],{ids:['curl-up'],sets:3},{ids:['side-plank'],sets:3,seconds:15},{ids:['bird-dog'],sets:3},['breath']],
        [{ids:['curl-up'],sets:3},['side-plank-full','side-plank'],['bird-dog'],['pallof','pallof-cable','deadbug'],['single-bridge']],
        [['suitcase-carry','pallof'],['side-plank-full','side-plank'],['pallof','deadbug'],['single-rdl','band-hinge'],['bird-dog']]
      ]},
    {id:'shoulder',zone:'shoulder',region:'shoulder',title:'Épaule (coiffe des rotateurs)',short:'En tirant, en levant le bras, après un contact',sources:['kuhn','cuffIso','orthoShoulder'],
      levels:[
        [{ids:['er-iso'],sets:3,seconds:30},['scap-pushup','wall-pushup'],['wall-slide'],['thoracic','quad-rotation']],
        [['band-er','er-iso'],['facepull','band-pullapart','rear-delt-fly'],['scap-pushup'],['band-row','wall-slide'],['wall-slide']],
        [['band-er','er-iso'],['facepull','band-pullapart'],['pushup','wall-pushup'],['plank-shoulder-tap','scap-pushup'],['band-dislocate','shoulder-mob']]
      ]},
    {id:'hand',zone:'hand',region:'wrist',title:'Poignet et doigts',short:'Doigt retourné, poignet sur un appui ou un dribble',sources:['tyler','orthoShoulder'],
      levels:[
        [['wrist-mob'],{ids:['wrist-iso'],sets:3,seconds:30},['finger-ext','towel-grip'],{ids:['grip-hold','towel-grip'],sets:3,seconds:20}],
        [['wrist-curl','wrist-iso'],['wrist-extension','towel-grip'],['finger-ext','wrist-mob'],['grip-hold','towel-grip']],
        [['wrist-extension','wrist-iso'],['wrist-curl','towel-grip'],['finger-ext','wrist-mob'],['wall-pushup','pushup']]
      ]},
    {id:'elbow',zone:'hand',region:'elbow',title:'Coude (tendons de l’avant-bras)',short:'Extérieur ou intérieur du coude, en serrant',sources:['tyler'],
      levels:[
        [{ids:['wrist-iso'],sets:4,seconds:30},['wrist-mob'],['towel-grip','grip-hold','finger-ext'],['er-iso','band-er']],
        [['wrist-extension','wrist-iso'],['wrist-curl','towel-grip'],['grip-hold','finger-ext','towel-grip'],['band-er','er-iso']],
        [['wrist-extension','wrist-iso'],['wrist-curl','towel-grip'],['band-row','facepull','scap-pushup'],['pushup','wall-pushup']]
      ]},
    {id:'neck',zone:'neck',region:'neck',title:'Cou et haut du dos',short:'Raideur, après un contact ou une mauvaise nuit',sources:['neck'],
      levels:[
        [['chin-tuck'],['neck-mob'],['thoracic'],['band-pullapart','wall-slide']],
        [['chin-tuck'],['facepull','band-pullapart'],['quad-rotation','thoracic'],['wall-slide']],
        [['chin-tuck'],['facepull','band-row'],['quad-rotation'],['band-dislocate','wall-slide']]
      ]}
  ];

  const zones = [
    {id:'knee',label:'Genou',icon:'knee',thumb:'spanish-squat'},
    {id:'foot',label:'Cheville, pied, mollet',icon:'ankle',thumb:'calf-hold'},
    {id:'hip',label:'Hanche, aine, cuisse',icon:'hip',thumb:'hip-abduction'},
    {id:'back',label:'Dos',icon:'spine',thumb:'bird-dog'},
    {id:'shoulder',label:'Épaule',icon:'shoulder',thumb:'er-iso'},
    {id:'hand',label:'Poignet, doigts, coude',icon:'wrist',thumb:'wrist-mob'},
    {id:'neck',label:'Cou',icon:'neck',thumb:'chin-tuck'}
  ];
  const zoneOfRegion = {knee:'knee',ankle:'foot',hip:'hip',back:'back',shoulder:'shoulder',wrist:'hand',elbow:'hand',neck:'neck'};
  // Endroit précis : chaque réponse renvoie vers un protocole.
  const where = {
    knee:[['knee-patellar','Juste sous la rotule, sur le tendon'],['knee-pfp','Autour ou derrière la rotule'],['knee-control','Pas de douleur nette : le genou rentre, je veux le protéger'],['unknown','Je ne sais pas']],
    foot:[['ankle-sprain','Cheville, après une ou plusieurs entorses'],['ankle-stiff','Cheville raide, sans vraie douleur'],['achilles','Tendon d’Achille, derrière le talon'],['plantar','Sous le talon ou la voûte'],['shin','Long du tibia'],['unknown','Je ne sais pas']],
    hip:[['groin','Aine, intérieur de cuisse'],['hip-flexor','Pli de l’aine, devant la hanche'],['hip-lateral','Côté de la hanche'],['hamstring','Arrière de cuisse'],['unknown','Je ne sais pas']],
    back:[['low-back','Bas du dos'],['neck','Haut du dos, entre les omoplates']],
    shoulder:[['shoulder','Épaule']],
    hand:[['hand','Doigts ou poignet'],['elbow','Coude']],
    neck:[['neck','Cou']]
  };
  const triggers = [['jump','Sauter'],['land','Atterrir'],['run','Courir, sprinter'],['cut','Freiner, changer de direction'],['stairs','Escaliers'],['sit','Assis longtemps'],['morning','Au réveil'],['arm','Lever le bras, tirer'],['ball','Attraper, dribbler'],['contact','Contacts']];
  const redFlags = [['swelling','Gonflement important ou qui augmente'],['lock','Blocage, le genou ou la cheville se coince'],['giveway','Instabilité franche, l’articulation lâche'],['trauma','Choc ou chute récente avec douleur vive'],['numb','Fourmillements, engourdissement, perte de force'],['night','Douleur la nuit ou au repos qui ne passe pas'],['fever','Fièvre, rougeur ou chaleur locale']];
  const onsets = [['acute','Moins de 2 semaines'],['sub','2 à 6 semaines'],['chronic','Plus de 6 semaines'],['prevention','Pas de douleur : je préviens']];

  function guessProtocol(zone,trig=[]) {
    const has=t=>trig.includes(t);
    if(zone==='knee') return has('jump')||has('land')?'knee-patellar':has('stairs')||has('sit')?'knee-pfp':'knee-control';
    if(zone==='foot') return has('morning')&&has('run')?'achilles':has('morning')?'plantar':has('run')?'shin':'ankle-sprain';
    if(zone==='hip') return has('cut')?'groin':has('run')?'hamstring':has('stairs')?'hip-lateral':'hip-flexor';
    return (where[zone]||[])[0]?.[0]||null;
  }
  function byId(id) {return protocols.find(p=>p.id===id)||null;}
  // Pré-remplissage : douleur active déclarée, sinon indices du bilan athlétique.
  function prefill(state) {
    const pains=(state.symptoms||[]).filter(s=>s.active).sort((a,b)=>Number(b.severity)-Number(a.severity));
    if(pains[0]) {const p=pains[0];return {zone:zoneOfRegion[p.region]||null,side:p.side||'both',severity:Number(p.severity),onset:p.onset==='new'?'acute':'chronic',fromSymptom:p.id,known:true};}
    const a=state.athletic&&state.athletic.answers||{};
    const stiff=Array.isArray(a.stiff)?a.stiff:[];
    if(a.brake==='knee') return {zone:'knee',where:'knee-control',known:false};
    if(a.contact==='back') return {zone:'back',where:'low-back',known:false};
    if(stiff.includes('ankle')) return {zone:'foot',where:'ankle-stiff',known:false};
    if(stiff.includes('hamstring')) return {zone:'hip',where:'hamstring',known:false};
    if(stiff.includes('hip')) return {zone:'hip',where:'hip-flexor',known:false};
    if(stiff.includes('shoulder')) return {zone:'shoulder',where:'shoulder',known:false};
    return {known:false};
  }
  function activeZones(state) {return [...new Set((state.symptoms||[]).filter(s=>s.active).map(s=>zoneOfRegion[s.region]).filter(Boolean))];}
  // Réponses -> protocole et niveau, ou arrêt « avis médical ».
  function pick(answers,state) {
    const severity=Number(answers.severity)||0;
    if((answers.flags||[]).length) return {stop:true,reason:'Un signe inhabituel demande un avis médical avant tout exercice ciblé. L’app ne propose rien sur cette zone.'};
    if(severity>=7) return {stop:true,reason:'Une douleur à 7/10 ou plus demande un avis médical avant de reprendre. L’app ne propose pas d’exercice ciblé.'};
    const id=answers.where&&answers.where!=='unknown'?answers.where:guessProtocol(answers.zone,answers.triggers);
    const protocol=byId(id);
    if(!protocol) return {error:'Choisis une zone pour trouver ton protocole.'};
    const saved=Number(state.rehab&&state.rehab.levels&&state.rehab.levels[protocol.id]);
    let level=Number.isFinite(saved)?saved:answers.onset==='prevention'&&severity<=2?1:0;
    if(severity>=4||answers.onset==='acute'&&severity>=2) level=0;
    else if(severity===3) level=Math.min(level,1);
    return {protocol,level,minutes:Number(answers.minutes)||10};
  }
  // Construit la séance : même schéma que les Quick Workout, sans filtrer la zone ciblée par sa propre douleur.
  function rehabPlan(PT,JP,state,protocolId,level=0,minutes=10,{targetPain=true}={}) {
    const protocol=byId(protocolId);if(!protocol) return {error:'Protocole introuvable.'};
    const safety=PT.safety(state);
    if(safety.blocked) return {error:'Douleur importante ou signe inhabituel : pas de séance. Demande un avis médical.'};
    level=Math.max(0,Math.min(2,Number(level)||0));
    const check={...state.checkIn,equipment:state.owned,focus:'mobility',format:'classic',minutes,date:today(),guided:level+1,rehabRegion:targetPain?protocol.region:undefined};
    const ctx=PT.context(state,check),all=PT.allExercises(state);
    const others=safety.active.filter(p=>p.region!==protocol.region);
    const ok=x=>x&&PT.allowed(x,state,check,ctx)&&(!JP||JP.tolerates(x,others));
    const exercises=[];
    protocol.levels[level].forEach(slot=>{
      const s=Array.isArray(slot)?{ids:slot}:slot;
      const e=s.ids.map(id=>all.find(y=>y.id===id)).find(x=>ok(x)&&!exercises.some(y=>y.id===x.id));
      if(!e) return;
      const p={...PT.makePrescription(e,'classic',minutes,ctx),sets:s.sets||3,rest:s.rest||Math.min(e.rest,45),role:'rehab'};
      if(s.seconds) p.seconds=s.seconds;
      if(s.min) {p.min=p.targetMin=s.min;p.max=p.targetMax=s.max||s.min;}
      exercises.push(p);
    });
    // Trop long : on garde le mouvement principal, on réduit d'abord les séries, puis on retire la fin du protocole. Jamais moins de 2 séries.
    const over=()=>PT.estimateSeconds(exercises,'classic')>minutes*60;
    const trim=(min,skipFirst)=>{const e=[...exercises].reverse().find(x=>x.sets>min&&!(skipFirst&&x===exercises[0]));if(e)e.sets-=1;return !!e;};
    while(over()&&trim(2,true));
    while(over()&&exercises[0]&&exercises[0].sets>3) exercises[0].sets-=1;
    while(over()&&exercises.some(e=>e.rest>30)) exercises.forEach(e=>{e.rest=Math.max(30,e.rest-15);});
    while(over()&&exercises.length>3) exercises.pop();
    while(over()&&trim(2,false));
    if(exercises.length<2) return {error:'Pas assez de mouvements compatibles avec ton matériel et tes douleurs. Ajoute du matériel dans ton profil ou demande l’avis d’un kiné.'};
    const reasons=[
      `${LEVELS[level]} : ${levelHints[level]}`,
      'Douleur tolérée pendant l’effort : 2/10 au maximum, revenue à la normale le lendemain. Au-delà, arrête le mouvement.',
      'Protocole issu de travaux publiés, adapté à ton matériel. Il ne remplace pas l’avis d’un kiné.'
    ];
    return {id:uid(),title:`Rehab · ${protocol.title}`,source:'rehab',protocolId:protocol.id,rehabLevel:level,focus:'mobility',format:'classic',exercises,check,reasons,warmupSeconds:0,estimatedMinutes:Math.ceil((PT.estimateSeconds(exercises,'classic')+60)/60),status:'preview',entries:{},createdAt:new Date().toISOString()};
  }

  // Protocole suivi pour une zone : l'endroit précisé dans le signalement, sinon le dernier fait dans l'app,
  // sinon les déclencheurs. Genou sans précision : devant du genou (isométriques), la douleur la plus fréquente en sport de saut.
  function protocolFor(state,pain) {
    const zone=zoneOfRegion[pain.region];if(!zone) return null;
    if(pain.protocol&&byId(pain.protocol)&&byId(pain.protocol).zone===zone) return byId(pain.protocol);
    const log=(state.rehab&&state.rehab.log)||[];
    const last=[...log].reverse().find(x=>byId(x.protocolId)&&byId(x.protocolId).zone===zone);
    if(last) return byId(last.protocolId);
    if(zone==='knee'&&!(pain.triggers||[]).length) return byId('knee-pfp');
    return byId(guessProtocol(zone,pain.triggers||[]));
  }
  // Même règle que pick() : douleur 4+ = Calmer, 3 = Renforcer au plus, sinon le niveau atteint dans le protocole.
  function careLevel(state,protocolId,severity) {
    const saved=Number(state.rehab&&state.rehab.levels&&state.rehab.levels[protocolId]);
    let level=Number.isFinite(saved)?saved:0;
    if(severity>=4) level=0; else if(severity===3) level=Math.min(level,1);
    return level;
  }
  // Soin intégré à une séance (parcours, séance du joueur, programme, coach) : on ne se contente plus d'écarter la zone.
  // Calmer en tête (isométriques, charge légère), renforcer en fin. Rien au-delà de 6/10 ni avec un signe inhabituel.
  // pains : [{region, severity, triggers?, redFlags?}] ; check : le check-in de la séance hôte ; exclude : ids déjà dans la séance.
  function careBlock(PT,JP,state,{pains,check,minutes=45,exclude=[]}={}) {
    const list=(pains||(state.symptoms||[]).filter(s=>s.active)).filter(p=>p&&zoneOfRegion[p.region]&&Number(p.severity)<7&&!p.redFlags)
      .sort((a,b)=>Number(b.severity)-Number(a.severity));
    const head=[],tail=[],used=new Set(exclude),done=new Set(),notes=[];
    const cap=minutes&&minutes<=20?2:minutes&&minutes<=35?3:4;
    const all=PT.allExercises(state);
    for(const pain of list) {
      if(head.length+tail.length>=cap) break;
      const protocol=protocolFor(state,pain);
      if(!protocol||done.has(protocol.id)) continue;
      done.add(protocol.id);
      const severity=Number(pain.severity)||0,level=careLevel(state,protocol.id,severity);
      const hostCheck={...(check||state.checkIn),equipment:state.owned,focus:'mobility',format:'classic',date:today(),guided:level+1,rehabRegion:protocol.region};
      const ctx=PT.context(state,hostCheck);
      const others=list.filter(p=>p.region!==protocol.region);
      const ok=x=>x&&!used.has(x.id)&&PT.allowed(x,state,hostCheck,ctx)&&(!JP||JP.tolerates(x,others));
      const take=(slot,phase)=>{
        if(head.length+tail.length>=cap) return false;
        const s=Array.isArray(slot)?{ids:slot}:slot;
        const e=s.ids.map(id=>all.find(y=>y.id===id)).find(ok);
        if(!e) return false;
        used.add(e.id);
        const p={...PT.makePrescription(e,'classic',minutes||45,ctx),sets:Math.min(s.sets||3,phase==='calm'?5:3),rest:s.rest||Math.min(e.rest,45),role:'rehab',pathwayRole:'soin',carePhase:phase,careProtocol:protocol.id,careLevel:level,careRegion:protocol.region,key:true};
        if(s.seconds) p.seconds=s.seconds;
        if(s.min) {p.min=p.targetMin=s.min;p.max=p.targetMax=s.max||s.min;}
        (phase==='calm'?head:tail).push(p);
        return true;
      };
      // Calmer : le début du niveau 1 (2 mouvements si la douleur est encore vive, 1 sinon).
      const calm=protocol.levels[0];
      let n=0;for(const slot of calm){if(n>=(level===0?2:1))break;if(take(slot,'calm'))n++;}
      // Renforcer : la suite du niveau atteint (au moins le niveau 1 « Calmer » quand la douleur est vive).
      const strong=level===0?calm.slice(2):protocol.levels[level];
      let m=0;for(const slot of strong){if(m>=2)break;if(take(slot,'strength'))m++;}
      if(n||m) notes.push(`${protocol.title} · ${LEVELS[level].toLowerCase()}`);
    }
    return {head,tail,protocols:[...done],note:notes.length?`Soin intégré (${notes.join(' ; ')}) : on calme la zone en début de séance et on la renforce en fin. Douleur tolérée pendant l’effort : 2/10 au maximum. Ça ne remplace pas l’avis d’un kiné.`:null};
  }
  // Place le soin dans une liste d'exercices : calmer devant, renforcer derrière, sans doublon.
  function withCare(exercises,care) {
    if(!care||(!care.head.length&&!care.tail.length)) return exercises;
    const ids=new Set([...care.head,...care.tail].map(e=>e.id));
    return [...care.head,...exercises.filter(e=>!ids.has(e.id)),...care.tail];
  }

  // Échauffements basket : structure SHRed / FIFA 11+ / RAMP (élever, mobiliser, activer, potentialiser).
  const warmups = [
    {id:'practice',title:'Avant entraînement',minutes:10,thumb:'lateral-shuffle',sources:['shred','fifaBasket','ankleWarm'],
      blocks:[['jog-court',90],['carioca',20],['skip-a',20],['worlds-greatest',30],['monster-walk',30],['single-leg-reach',30],['snap-down',20],['pogo',20],['defensive-slide',20]]},
    {id:'match',title:'Avant match',minutes:15,thumb:'carioca',sources:['shred','fifaBasket','ankleWarm'],
      blocks:[['jog-court',120],['carioca',20],['backpedal',20],['skip-a',20],['worlds-greatest',30],['ankle-mob',30],['monster-walk',30],['single-bridge',30],['single-leg-reach',30],['pogo',20],['snap-down',20],['defensive-slide',20],['accel-10',20],['crossover-start',20],['approach-jump',20]]},
    {id:'express',title:'Express',minutes:6,thumb:'worlds-greatest',sources:['shred','fifa'],
      blocks:[['jog-court',60],['worlds-greatest',30],['lateral-shuffle',20],['skip-a',20],['pogo',20],['defensive-slide',20]]},
    {id:'legs',title:'Avant jambes ou sauts',minutes:8,thumb:'monster-walk',sources:['fifa','backman'],
      blocks:[['jog-court',90],['hip-circles',30],['ankle-mob',30],['monster-walk',30],['single-bridge',30],['squat',30],['snap-down',20],['pogo',20]]},
    {id:'shoot',title:'Avant shoot',minutes:6,thumb:'band-dislocate',sources:['kuhn','orthoShoulder'],
      blocks:[['thoracic',30],['wall-slide',30],['band-er',30],['band-pullapart',30],['scap-pushup',30],['wrist-mob',30],['finger-ext',20]]}
  ];
  // Repli quand un mouvement n'est pas possible (matériel, douleur, impacts).
  const warmFallback = {'carioca':['lateral-shuffle','march'],'skip-a':['a-march','high-knees','march'],'backpedal':['march'],'jog-court':['march','bike'],'pogo':['calf'],'snap-down':['squat'],'defensive-slide':['lateral-shuffle','monster-walk'],'lateral-shuffle':['monster-walk'],'accel-10':['wall-drill','a-march'],'crossover-start':['lateral-shuffle','monster-walk'],'approach-jump':['calf'],'monster-walk':['hip-abduction','clamshell'],'single-leg-reach':['single-leg-stand'],'band-er':['er-iso'],'band-pullapart':['wall-slide'],'finger-ext':['wrist-mob'],'worlds-greatest':['hip-circles','cat'],'squat':['box-squat','wall-sit']};
  function warmupPlan(PT,JP,state,id) {
    const w=warmups.find(x=>x.id===id);if(!w) return {error:'Échauffement introuvable.'};
    const safety=PT.safety(state);
    if(safety.blocked) return {error:'Douleur importante ou signe inhabituel : pas de séance. Demande un avis médical.'};
    const check={...state.checkIn,equipment:state.owned,focus:'mobility',format:'classic',minutes:w.minutes,date:today(),guided:2,warmup:true};
    const ctx=PT.context(state,check),all=PT.allExercises(state);
    const ok=x=>x&&PT.allowed(x,state,check,ctx)&&(!JP||JP.tolerates(x,safety.active));
    const exercises=[];let removed=0;
    w.blocks.forEach(([first,seconds])=>{
      const e=[first,...(warmFallback[first]||[])].map(i=>all.find(y=>y.id===i)).find(x=>ok(x)&&!exercises.some(y=>y.id===x.id));
      if(!e){removed++;return;}
      const timed=e.measure==='seconds'||e.kind==='cardio';
      exercises.push({...PT.makePrescription(e,'classic',w.minutes,ctx),sets:1,rest:15,measure:timed?'seconds':e.measure,seconds:timed?seconds:e.seconds,min:Math.min(e.min,8),max:Math.min(e.max,10),targetMin:Math.min(e.min,8),targetMax:Math.min(e.max,10),role:'warmup'});
    });
    // Trop long : durées raccourcies, l'ordre (élever, mobiliser, activer, potentialiser) ne bouge pas.
    while(PT.estimateSeconds(exercises,'classic')>w.minutes*60&&exercises.some(e=>e.measure==='seconds'&&e.seconds>20)) exercises.forEach(e=>{if(e.measure==='seconds'&&e.seconds>20)e.seconds=Math.max(20,e.seconds-10);});
    if(exercises.length<3) return {error:'Pas assez de mouvements compatibles aujourd’hui. Vérifie tes douleurs et ton matériel.'};
    const reasons=['Échauffement basket : on monte en température, on mobilise, on active, puis on finit par des appuis et des sauts.','Les échauffements neuromusculaires de ce type réduisent les blessures de genou et de cheville chez les basketteurs.'];
    if(removed) reasons.push('Certains sauts ou mouvements ont été remplacés à cause de ton matériel ou de tes douleurs.');
    return {id:uid(),title:`Warm Up · ${w.title}`,source:'warmup',warmupId:w.id,focus:'mobility',format:'classic',exercises,check,reasons,warmupSeconds:0,estimatedMinutes:Math.ceil((PT.estimateSeconds(exercises,'classic')+60)/60),status:'preview',entries:{},createdAt:new Date().toISOString()};
  }

  // Temps déjà fait aujourd'hui en rehab ou en warm-up, pas encore déduit ni refusé.
  function pendingCredit(state,now=today()) {
    const items=(state.sessions||[]).filter(s=>s.date===now&&['rehab','warmup'].includes(s.source)&&!s.creditHandled&&Number(s.minutes)>=1);
    if(!items.length) return null;
    return {
      minutes:Math.round(items.reduce((n,s)=>n+Number(s.minutes),0)),
      labels:items.map(s=>s.title.replace(/^(Rehab|Warm Up) · /,'')),
      exerciseIds:[...new Set(items.filter(s=>s.source==='rehab').flatMap(s=>s.exercises.map(e=>e.id)))],
      warmup:items.some(s=>s.source==='warmup'),
      sessionIds:items.map(s=>s.id)
    };
  }
  const CREDIT_SOURCES = ['generated','program','program-plan','pathway'];
  function canCredit(plan) {return !!plan&&CREDIT_SOURCES.includes(plan.source)&&!plan.creditApplied&&!plan.creditDeclined;}
  // Retire le temps déjà fait : l'échauffement d'abord, les doublons de rehab, puis séries et mouvements non essentiels.
  function applyCredit(PT,plan,credit,floorMinutes=10) {
    const p=JSON.parse(JSON.stringify(plan));
    const total=()=>p.warmupSeconds+60+(p.blockSeconds||PT.estimateSeconds(p.exercises,p.format));
    const before=total();
    const target=Math.max(floorMinutes*60,before-credit.minutes*60);
    const kept=e=>e.slotRole==='anchor'||e.key===true||e.pinned;
    const notes=[];
    if(credit.warmup&&p.warmupSeconds) {p.warmupSeconds=0;notes.push('échauffement déjà fait');}
    const dup=p.exercises.filter(e=>credit.exerciseIds.includes(e.id)&&!kept(e));
    if(dup.length&&p.exercises.length-dup.length>=2) {p.exercises=p.exercises.filter(e=>!dup.includes(e));notes.push(`${dup.map(e=>e.name).join(', ')} déjà fait en rehab`);}
    if(p.blockSeconds) p.blockSeconds=Math.max(300,Math.floor((p.blockSeconds-Math.max(0,total()-target))/60)*60);
    const over=()=>total()>target;
    while(over()&&p.exercises.some(e=>!kept(e)&&e.sets>2)) {const e=[...p.exercises].reverse().find(x=>!kept(x)&&x.sets>2);e.sets-=1;}
    while(over()&&p.exercises.length>2&&p.exercises.some(e=>!kept(e))) {const i=p.exercises.map(e=>!kept(e)).lastIndexOf(true);p.exercises.splice(i,1);}
    while(over()&&p.exercises.some(e=>e.sets>1)) {const e=[...p.exercises].reverse().find(x=>x.sets>1);e.sets-=1;}
    const saved=Math.max(0,Math.round((before-total())/60));
    p.creditApplied={minutes:credit.minutes,saved,labels:credit.labels};
    p.estimatedMinutes=Math.ceil(total()/60);
    p.reasons=[...(p.reasons||[]),`Ajustée après ${credit.labels.join(' + ')} (${credit.minutes} min) : ${saved} min retirées${notes.length?` (${notes.join(' ; ')})`:''}.`];
    return p;
  }

  // Progression de niveau : 2 séances à 2/10 ou moins, sans lendemain « pire », font monter ; au-delà de 5/10 on redescend.
  function validateRehab(v) {
    const base={levels:{},log:[]};
    if(!v||typeof v!=='object'||Array.isArray(v)) return base;
    const levels={};Object.entries(v.levels&&typeof v.levels==='object'?v.levels:{}).forEach(([k,n])=>{if(byId(k)&&[0,1,2].includes(Number(n)))levels[k]=Number(n);});
    const log=(Array.isArray(v.log)?v.log:[]).filter(x=>x&&byId(x.protocolId)&&typeof x.date==='string'&&Number(x.painAfter)>=0&&Number(x.painAfter)<=10).slice(-300);
    return {levels,log};
  }
  function record(rehab,{protocolId,level,painAfter,sessionId,date=today()},sessions=[]) {
    const r=validateRehab(rehab);
    const log=[...r.log,{protocolId,level:Number(level)||0,painAfter:Number(painAfter),sessionId,date}];
    const mine=log.filter(x=>x.protocolId===protocolId);
    const last2=mine.slice(-2);
    const worse=last2.some(x=>(sessions.find(s=>s.id===x.sessionId)||{}).nextDay==='worse');
    let next=Number(level)||0,change=0;
    if(Number(painAfter)>5&&next>0) {next-=1;change=-1;}
    else if(last2.length===2&&last2.every(x=>x.painAfter<=2&&x.level===next)&&!worse&&next<2) {next+=1;change=1;}
    return {rehab:{levels:{...r.levels,[protocolId]:next},log:log.slice(-300)},level:next,change};
  }

  return {LEVELS,levelHints,sources:S,protocols,zones,where,triggers,redFlags,onsets,zoneOfRegion,byId,prefill,activeZones,pick,guessProtocol,rehabPlan,protocolFor,careLevel,careBlock,withCare,warmups,warmupPlan,pendingCredit,canCredit,applyCredit,validateRehab,record};
});

/* Rehaab : bilan athlétique basket. Questions + tests terrain -> niveaux par qualité, priorités, point faible par séance, bloc kiné. Pur, sans DOM, pas de diagnostic. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AthleticProfile = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const g = typeof globalThis !== 'undefined' ? globalThis : {};
  function lib(name,path) { if(g[name]) return g[name]; try { return typeof require==='function'?require(path):null; } catch (e) { return null; } }
  const JP = () => lib('PlayerProfile','./player-profile.js');
  const BP = () => lib('BasketPathway','./basket-pathway.js');
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const isoDay = v => typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));

  // Qualités évaluées. tags : qualités du profil joueur renforcées quand celle-ci est faible. days : séances du parcours où elle a sa place.
  const qualities = {
    vertical:{label:'Détente',tags:['vertical'],days:['A']},
    firststep:{label:'Premier pas',tags:['firststep','speed'],days:['C']},
    decel:{label:'Freinage & appuis',tags:['decel','lateral'],days:['C','A']},
    reactive:{label:'Chevilles réactives',tags:['reactive','ankle'],days:['C']},
    strength:{label:'Force des jambes',tags:['strength','unilateral'],days:['A']},
    balance:{label:'Équilibre sur une jambe',tags:['ankle','unilateral','hip'],days:['A','C']},
    core:{label:'Gainage',tags:['core','antirot'],days:['B']},
    contact:{label:'Haut du corps & contact',tags:['contact','shoulder'],days:['B']},
    endurance:{label:'Souffle',tags:['endurance'],days:['C']},
    mobility:{label:'Mobilité',tags:['mobility'],days:[]}
  };
  const levelLabels = ['À travailler','Correct','Point fort'];

  // Chaque réponse donne un niveau : 0 à travailler, 1 correct, 2 point fort, null inconnu.
  const questions = [
    {id:'jump',qualities:['vertical'],label:'Ta détente, comparée à avant ta pause',options:[['same','Comme avant',2],['less','Un peu moins',1],['much','Beaucoup moins',0],['unknown','Je ne sais pas encore',null]]},
    {id:'firststep',qualities:['firststep'],label:'En un contre un, ton premier pas',options:[['beats','Je passe mon défenseur',2],['depends','Ça dépend des jours',1],['slow','Je me sens lent au démarrage',0],['unknown','Je ne sais pas encore',null]]},
    {id:'brake',qualities:['decel'],label:'Quand tu freines ou changes de direction',options:[['stable','Je reste stable et bas',2],['slide','Je glisse ou je perds l’équilibre',1],['knee','Le genou rentre ou ça tire',0]]},
    {id:'landing',qualities:['reactive'],label:'Tes réceptions de saut',options:[['quiet','Silencieuses et stables',2],['heavy','Lourdes, je m’écrase',1],['fear','J’appréhende de sauter',0]]},
    {id:'contact',qualities:['core','contact'],label:'Au contact : écran, drive, rebond',options:[['solid','Je tiens ma ligne',2],['moved','Je me fais déplacer',1],['back','Je me fais déplacer et le dos tire',0]]},
    {id:'engine',qualities:['endurance'],label:'Ton souffle sur le terrain',options:[['match','Je tiens un match entier',2],['cuts','Je coupe vite mais je récupère',1],['cooked','Je suis cuit en quelques minutes',0]]},
    {id:'strength',qualities:['strength'],label:'Squats, fentes, soulevés de terre avec charge',options:[['regular','Je m’entraîne régulièrement',2],['some','Un peu, sans régularité',1],['none','Pas depuis longtemps',0]]},
    {id:'squat',qualities:['mobility'],label:'Squat profond, talons au sol, buste droit',options:[['easy','Facilement',2],['heels','Les talons décollent',1],['no','Impossible ou douloureux',0]]},
    {id:'stiff',qualities:['mobility'],multi:true,optional:true,label:'Où te sens-tu raide ?',options:[['ankle','Chevilles'],['hip','Hanches'],['hamstring','Arrière des cuisses'],['back','Dos'],['shoulder','Épaules']]},
    {id:'mindset',qualities:[],label:'Ton état d’esprit pour la reprise',options:[['confident','Confiant'],['careful','Un peu d’appréhension'],['afraid','Peur de me blesser']]}
  ];

  // Tests propres au bilan. Ceux du parcours (BasketPathway.tests) sont réutilisés tels quels, sans copie.
  // Repères d'entraînement courants, pas des normes : aucune norme fiable n'existe pour un joueur de club.
  const ownTests = {
    vertical:{label:'Saut vertical debout',unit:'cm',sides:false,track:true,impact:true,video:'jump',target:'pas de seuil : c’est ta référence de détente',how:['De profil contre un mur, bras tendu vers le haut : marque le point le plus haut atteint debout.','Sans élan, fléchis et saute en touchant le mur le plus haut possible.','Hauteur = marque du saut moins marque debout. Garde le meilleur de trois essais.'],why:'Ta référence de détente : elle se compare à chaque nouveau bilan, pas à celle des autres.'},
    broad:{label:'Saut en longueur sans élan',unit:'cm',sides:false,track:true,impact:true,target:'pas de seuil : c’est ta référence de poussée',how:['Pieds derrière une ligne, bras libres.','Saute le plus loin possible et tiens la réception.','Mesure de la ligne au talon le plus proche. Meilleur de trois essais.'],why:'La poussée vers l’avant : c’est elle qui lance le premier pas.'},
    sprint5:{label:'Sprint 5 m chronométré',unit:'s',sides:false,track:true,lower:true,impact:true,video:'sprint',target:'pas de seuil : c’est ta référence de premier pas',how:['Départ arrêté, deux appuis, pied avant sur la ligne.','Filme de côté au ralenti ou fais chronométrer : du premier mouvement au passage du buste à 5 m.','Meilleur de deux essais, récupération complète.'],why:'Le premier pas fait la différence en un contre un. Un chrono au téléphone est approximatif : compare-toi à toi-même.'},
    plank:{label:'Planche ventrale',unit:'s',sides:false,min:60,target:'60 s en gardant l’alignement',how:['Sur les avant-bras, corps aligné des épaules aux talons.','Chrono jusqu’à ce que le bassin tombe ou monte.'],why:'Le tronc transmet la force des jambes au tir et au contact.'},
    pushups:{label:'Pompes, amplitude complète',unit:'rép.',sides:false,min:20,target:'20 pompes propres',how:['Corps gainé, poitrine à un poing du sol à chaque répétition.','Compte jusqu’à ce que l’alignement ou l’amplitude se perde.'],why:'La force du haut du corps pour tenir le contact.'},
    deepsquat:{label:'Squat profond talons au sol',unit:'check',sides:false,how:['Pieds largeur d’épaules, bras tendus devant toi.','Descends le plus bas possible et tiens 5 s, talons au sol, buste plutôt droit.'],why:'Chevilles et hanches assez mobiles pour se baisser en défense et amortir.'},
    thomas:{label:'Test de Thomas (avant de hanche)',unit:'check',sides:true,how:['Assis au bord d’un banc ou d’un lit, allonge-toi en ramenant un genou contre la poitrine.','Réussi si l’autre cuisse reste posée à plat, genou plié vers le bas. Si elle se soulève, ce côté est raide.'],why:'Un avant de hanche raide raccourcit la foulée et charge le bas du dos.'},
    aslr:{label:'Jambe tendue levée',unit:'check',sides:true,how:['Allongé sur le dos, jambes tendues, pointes relevées.','Monte une jambe sans plier le genou ni décoller l’autre : réussi si la cheville dépasse le milieu de la cuisse opposée.'],why:'Des arrières de cuisse souples protègent des claquages en sprint.'},
    rsi:{label:'Rebond réactif (RSI)',unit:'RSI',sides:false,track:true,impact:true,video:'rsi',target:'pas de seuil : c’est ta référence d’explosivité',how:['Téléphone posé au sol à 2 m, de profil, ralenti activé (120 ou 240 i/s).','Saute d’une marche basse (20-30 cm), et rebondis le plus haut possible en touchant le sol le moins longtemps possible.','Dans l’outil vidéo, marque l’arrivée au sol, le décollage, puis la réception : l’app calcule hauteur ÷ temps de contact.'],why:'L’explosivité utile au basket : sauter haut sans rester collé au sol (rebond, contre, deuxième saut).'},
    run17:{label:'Navettes « 17 » · souffle basket',unit:'s',sides:false,track:true,lower:true,impact:true,video:'sprint',target:'pas de seuil : c’est ta référence de souffle',how:['Deux lignes à 15 m, la largeur d’un terrain.','Enchaîne 17 traversées sans t’arrêter, en touchant chaque ligne du pied. Chrono.','Récupère 2 min et refais-le. Note la moyenne des deux.'],why:'L’effort d’un match : sprinter, freiner, relancer, encore et encore. La 2e course montre ta capacité à récupérer.'},
    pogoq:{label:'Rebonds de cheville · 20 s',unit:'check',sides:false,impact:true,how:['Petits rebonds sur place pendant 20 s, genoux presque tendus.','Réussi si les contacts restent courts, silencieux et réguliers jusqu’au bout, sans douleur.'],why:'La raideur utile de la cheville : c’est le ressort de tes appuis.'}
  };
  const sharedIds = ['hop','sprint10','shuttle','landingq','calf','balance','bridge','splitsquat','sideplank','kneewall'];
  const maxEffort = ['hop','sprint10','shuttle','landingq'];
  // Qualités renseignées par chaque test. Les tests « suivis » (sauts, sprints) n'ont pas de seuil : ils servent de référence.
  const testQualities = {vertical:['vertical'],broad:['vertical'],sprint5:['firststep'],sprint10:['firststep'],shuttle:['decel'],hop:['balance','strength'],
    pogoq:['reactive'],landingq:['reactive','decel'],calf:['reactive','strength'],balance:['balance'],bridge:['strength'],splitsquat:['strength','decel'],
    plank:['core'],sideplank:['core'],pushups:['contact'],rsi:['reactive'],run17:['endurance'],kneewall:['mobility'],deepsquat:['mobility'],thomas:['mobility'],aslr:['mobility']};
  const groups = [
    {id:'jump',label:'Détente',tests:['vertical','broad','hop']},
    {id:'speed',label:'Premier pas & appuis',tests:['sprint5','sprint10','shuttle']},
    {id:'ankle',label:'Chevilles & réceptions',tests:['rsi','pogoq','landingq','calf','balance']},
    {id:'engine',label:'Souffle basket',tests:['run17']},
    {id:'strength',label:'Force & contrôle',tests:['bridge','splitsquat','pushups']},
    {id:'core',label:'Gainage',tests:['plank','sideplank']},
    {id:'mobility',label:'Mobilité',tests:['kneewall','deepsquat','thomas','aslr']}
  ];

  function allTests() {
    const B=BP(), out={};
    if(B) sharedIds.forEach(id=>{ if(B.tests[id]) out[id]=B.tests[id]; });
    return {...out,...ownTests};
  }
  function create() { return {answers:{},tests:{},date:null,history:[]}; }
  function latest(a,id) { const list=a&&a.tests&&a.tests[id]||[]; return list[list.length-1]||null; }
  function recordTest(a,id,values,now=today()) {
    if(!allTests()[id]) return a;
    return {...a,tests:{...a.tests,[id]:[...(a.tests[id]||[]),{...values,date:now}].slice(-12)}};
  }
  function evaluate(id,record,list=[]) {
    const t=ownTests[id];
    if(!t) { const B=BP(); return B?B.evaluate(id,record,{tests:{[id]:list}}):{ok:false,detail:''}; }
    if(!record) return {ok:false,detail:'Pas encore mesuré.'};
    if(t.unit==='check') return {ok:t.sides?record.left===true&&record.right===true:record.value===true,detail:t.sides?`G ${record.left?'✓':'✗'} · D ${record.right?'✓':'✗'}`:record.value?'Réussi':'Pas encore'};
    if(t.track) { const prev=list.slice(0,-1).pop(); return {ok:true,detail:`${record.value} ${t.unit}${prev?` (avant : ${prev.value} ${t.unit})`:''}`}; }
    return {ok:Number(record.value)>=t.min,detail:`${record.value} ${t.unit}`};
  }
  const isTracked = id => { const t=allTests()[id]; return !!(t&&t.track); };
  // Tests suivis (sauts, sprints, souffle) : pas de norme, seulement ta tendance. Une baisse de plus de 5 % par rapport à ton
  // meilleur résultat précédent en fait une qualité à retravailler ; égaler ou battre ce repère la valide.
  function trend(id,list) {
    const t=allTests()[id]; if(!t||!t.track||!list||list.length<2) return null;
    const last=Number(list[list.length-1].value), prev=list.slice(0,-1).map(r=>Number(r.value)).filter(Number.isFinite);
    if(!Number.isFinite(last)||!prev.length) return null;
    const lower=t.lower||t.unit==='s', best=lower?Math.min(...prev):Math.max(...prev);
    if(!best) return null;
    const change=Math.round((lower?best-last:last-best)/best*1000)/10;
    return {best,last,change,ok:change>=-5};
  }

  // Sauts maximaux, sprints et navettes : seulement sans douleur des membres inférieurs.
  function lowerPains(state) { return (state.symptoms||[]).filter(s=>s.active&&['knee','ankle','hip','back'].includes(s.region)&&(Number(s.severity)>=3||s.redFlags)); }
  function canMax(state) { return !lowerPains(state).length && !(state.symptoms||[]).some(s=>s.active&&(s.redFlags||Number(s.severity)>=7)); }
  function testGroups(state) {
    const defs=allTests(), max=canMax(state);
    return groups.map(gr=>({...gr,tests:gr.tests.filter(id=>defs[id]).map(id=>({id,...defs[id],hidden:!max&&(maxEffort.includes(id)||!!(ownTests[id]&&ownTests[id].impact))}))}));
  }

  // Niveau par qualité : un test raté (ou un écart gauche/droite trop grand) donne 0 ; des tests réussis donnent 1, ou 2 si la réponse dit « point fort ».
  function assess(a) {
    const defs=allTests(), out={}, asym=[];
    Object.entries(qualities).forEach(([id,q])=>{out[id]={id,label:q.label,level:null,answer:null,passed:[],failed:[],notes:[]};});
    questions.forEach(q=>{
      const v=a&&a.answers?a.answers[q.id]:undefined;
      if(q.multi) {
        const n=Array.isArray(v)?v.length:0;
        if(n) q.qualities.forEach(id=>{const lvl=n>=2?0:1;out[id].answer=out[id].answer===null?lvl:Math.min(out[id].answer,lvl);out[id].notes.push(`Raideurs : ${v.map(x=>(q.options.find(o=>o[0]===x)||[])[1]).filter(Boolean).join(', ').toLowerCase()}.`);});
        return;
      }
      const opt=q.options.find(o=>o[0]===v);
      if(!opt||opt[2]===null||opt[2]===undefined) return;
      q.qualities.forEach(id=>{out[id].answer=out[id].answer===null?opt[2]:Math.min(out[id].answer,opt[2]);});
    });
    Object.keys(testQualities).forEach(id=>{
      const record=latest(a,id);
      if(!record||!defs[id]) return;
      if(isTracked(id)) {
        const tr=trend(id,a.tests[id]);
        if(tr) testQualities[id].forEach(q=>(tr.ok?out[q].passed:out[q].failed).push({id,label:defs[id].label,detail:`${tr.last} ${defs[id].unit} (${tr.change>=0?'+':''}${tr.change} % vs ton meilleur)`}));
        return;
      }
      const r=evaluate(id,record,a.tests[id]);
      testQualities[id].forEach(q=>(r.ok?out[q].passed:out[q].failed).push({id,label:defs[id].label,detail:r.detail}));
      const t=defs[id];
      if(t.sides&&t.unit!=='check'&&r.gap!==undefined&&r.gap>(t.gap||10)) asym.push({id,label:t.label,gap:r.gap,weak:(t.lower?Number(record.left)>Number(record.right):Number(record.left)<Number(record.right))?'left':'right'});
      if(t.sides&&t.unit==='check'&&record.left!==record.right) asym.push({id,label:t.label,gap:null,weak:record.left?'right':'left'});
    });
    Object.values(out).forEach(q=>{
      if(q.failed.length) q.level=0;
      else if(q.passed.length) q.level=q.answer===2?2:1;
      else q.level=q.answer;
      q.levelLabel=q.level===null?'Pas encore évalué':levelLabels[q.level];
    });
    return {qualities:out,asymmetries:asym};
  }
  const need = level => level===0?3:level===2?0:1;
  function weights(a) {
    const w={};
    Object.values(assess(a).qualities).forEach(q=>{const n=need(q.level);if(n) qualities[q.id].tags.forEach(t=>w[t]=(w[t]||0)+n);});
    return w;
  }
  // Les trois priorités : besoin × importance pour le poste et le profil de jeu.
  function targets(a,player={},count=3) {
    const J=JP(), pos={};
    (J?J.priorities(player):[]).forEach(p=>pos[p.id]=p.weight);
    const res=assess(a).qualities;
    return Object.values(res).filter(q=>q.level!==2)
      .map(q=>{const relevance=qualities[q.id].tags.reduce((n,t)=>n+(pos[t]||0),0);return {...q,score:need(q.level)*(1+relevance/4),relevance};})
      .sort((x,y)=>y.score-x.score).slice(0,count)
      .map(q=>({id:q.id,label:q.label,level:q.level,score:q.score,why:q.level===0?(q.failed.length?`${q.failed.map(f=>`${f.label} : ${f.detail}`).join(' · ')}.`:'Tu la sens en retrait depuis ta pause.'):q.level===1?'Correcte : à consolider pour ton poste.':'Pas encore évaluée : on la travaille par défaut pour ton poste.'}));
  }

  // Étape de départ conseillée. Plafond : étape 3, et une seule étape sautée après plus d'un an sans jouer.
  function recommendedStart(state) {
    const a=state.athletic, B=BP(), player=state.player||{};
    if(!a||!B) return {step:1,reason:'Sans bilan, on commence par les fondations.'};
    const pains=lowerPains(state);
    if(pains.length) return {step:1,reason:'Une douleur est active : on repart des fondations, le temps qu’elle se calme.'};
    if(a.answers.mindset==='afraid') return {step:1,reason:'Tu as peur de te blesser : les fondations redonnent confiance avant la vitesse.'};
    const check=(id,from=id)=>{const r=latest(a,from);return r?evaluate(id,r).ok:null;};
    const s1=['calf','bridge','balance','sideplank','kneewall'].map(id=>({id,ok:check(id)}));
    const missing=s1.filter(x=>x.ok===null), failed=s1.filter(x=>x.ok===false);
    const defs=allTests();
    if(missing.length||failed.length) return {step:1,reason:missing.length?`Mesure ${missing.map(x=>defs[x.id].label.toLowerCase()).join(', ')} pour savoir si tu peux passer les fondations.`:`À valider d’abord : ${failed.map(x=>defs[x.id].label.toLowerCase()).join(', ')}.`};
    const s2=[check('calf25','calf'),check('bridge20','bridge'),check('splitsquat'),check('landingq')];
    if(player.layoff==='long') return {step:2,reason:'Tes tests de fondations sont validés. Après plus d’un an sans jouer, on ne saute pas plus d’une étape : les tendons ont besoin de temps.'};
    if(s2.every(x=>x===true)) return {step:3,reason:'Fondations et force validées par tes tests : tu peux reprendre par la puissance.'};
    return {step:2,reason:'Tes tests de fondations sont validés : on reprend par la force.'};
  }

  // Candidats du créneau « point faible », par qualité puis par étape (1, 2, 3, 4 et plus). L'étape 1 reste sans impact.
  const focusLists = {
    firststep:[['knee-drive-iso','psoas-march','a-march'],['a-march','wall-drill','knee-drive-iso'],['falling-start','split-start','a-skip','wall-drill'],['band-resisted-start','drop-step-start','split-start','falling-start']],
    vertical:[['db-hip-thrust','hip-thrust','single-bridge'],['snap-down','box-jump-step','kb-swing'],['vertical-jump','db-jump','box-jump-step'],['approach-jump','single-leg-vertical','vertical-jump']],
    decel:[['step-down','iso-split'],['snap-down','lateral-lunge','reverse-lunge'],['lateral-decel','decel-stick','lateral-bound-stick'],['lateral-decel','decel-stick','drop-step-start']],
    reactive:[['calf-hold','foot-doming','single-calf'],['pogo','single-calf'],['single-pogo','lateral-hop','pogo'],['drop-jump','single-pogo','lateral-hop']],
    strength:[['split-squat','step-up','single-bridge'],['single-rdl','db-single-rdl','db-step-up','step-up'],['db-single-rdl','db-bulgarian','step-up'],['db-single-rdl','db-bulgarian','step-up']],
    balance:[['single-leg-eyes','single-leg-stand'],['single-leg-reach','airplane'],['single-hop-stick','single-leg-reach'],['single-hop-stick','single-leg-reach']],
    core:[['deadbug','bird-dog','side-plank'],['pallof','suitcase-carry','side-plank'],['pallof-cable','side-plank-full','halo'],['pallof-cable','side-plank-full','halo']],
    contact:[['carry','bear-hold'],['carry','suitcase-carry'],['carry','overhead-carry'],['carry','overhead-carry']],
    endurance:[['bike','march'],['bike-interval','rower-interval'],['run-interval','bike-interval'],['run-interval','bike-interval']]
  };
  // Doses selon le type d'exercice choisi, par semaine d'étape (la 4e est allégée).
  function dosesFor(e) {
    if(e.kind==='cardio') return {doses:['1x1','1x1','1x1','1x1'],secs:[480,600,720,480]};
    if(e.measure==='seconds') return {doses:['3x1','3x1','3x1','2x1'],secs:e.seconds>=30?[30,35,40,30]:[20,25,30,20]};
    if(e.kind==='plyo') return {doses:['3x3','3x4','4x4','2x3']};
    return {doses:['3x8','3x8-10','3x10','2x8']};
  }
  // Créneaux candidats par ordre de priorité (points faibles, puis qualités à consolider). exclude : mouvements déjà prévus ce jour-là,
  // pour que le créneau ajoute du neuf au lieu de doubler la séance. Le parcours garde le premier qui se résout avec le matériel.
  function focusSlots(a,player,stepId,dayKey,exclude=[]) {
    if(!a) return [];
    const stage=Math.min(4,Math.max(1,Number(stepId)||1))-1;
    const ranked=targets(a,player,Object.keys(qualities).length).filter(t=>(t.level===0||t.level===1)&&focusLists[t.id]&&qualities[t.id].days.includes(dayKey));
    return ranked.filter(t=>t.level===0).concat(ranked.filter(t=>t.level===1))
      .map(t=>({role:t.level===0?'point faible':'priorité',quality:t.id,label:t.label,level:t.level,ids:focusLists[t.id][stage].filter(id=>!exclude.includes(id)),optional:true,dosesFor}))
      .filter(s=>s.ids.length);
  }
  function focusSlot(a,player,stepId,dayKey,exclude=[]) { return focusSlots(a,player,stepId,dayKey,exclude)[0]||null; }

  // Mobilité qui manque, d'après les tests ratés et les raideurs déclarées. Ordre : cheville, avant de hanche, arrière de cuisse, dos, épaules.
  function deficits(a) {
    if(!a) return [];
    const stiff=Array.isArray(a.answers.stiff)?a.answers.stiff:[];
    const failed=id=>{const r=latest(a,id);return r?!evaluate(id,r,a.tests[id]).ok:false;};
    const detail=id=>evaluate(id,latest(a,id),a.tests[id]).detail;
    const out=[];
    if(failed('kneewall')||failed('deepsquat')||stiff.includes('ankle')||['heels','no'].includes(a.answers.squat)) out.push({area:'ankle',ids:['ankle-mob','calf-stretch'],why:failed('kneewall')?`cheville (genou au mur ${detail('kneewall')})`:'mobilité de cheville'});
    if(failed('thomas')||stiff.includes('hip')) out.push({area:'hip',ids:['couch-stretch','hip-flexor'],why:'avant de hanche'});
    if(failed('aslr')||stiff.includes('hamstring')) out.push({area:'hamstring',ids:['active-slr','hamstring'],why:'arrière de cuisse'});
    if(stiff.includes('back')) out.push({area:'back',ids:['cat','thoracic'],why:'dos'});
    if(stiff.includes('shoulder')) out.push({area:'shoulder',ids:['band-dislocate','shoulder-mob'],why:'épaules'});
    return out;
  }
  const tendonLists = {
    A:[['spanish-squat','wall-sit','slant-squat'],'tendon rotulien'],
    A3:[['slant-squat','reverse-nordic','spanish-squat'],'tendon rotulien'],
    B:[['facepull','band-pullapart'],'épaules'],
    C:[['calf-hold','foot-doming','tibialis'],'tendon d’Achille et pied']
  };
  // Bloc kiné : la zone douloureuse d'abord, puis la mobilité qui manque, puis les tendons sollicités par la séance.
  // present : exercices déjà dans la séance. Une zone qu'ils couvrent déjà n'est pas doublée.
  function kineBlock(state,{step=1,day=null,available=()=>true,present=()=>false,count=2,pains}={}) {
    const J=JP(), a=state.athletic, out=[];
    const push=(id,source,why)=>{ if(out.length<count&&!out.some(x=>x.id===id)&&available(id)){out.push({id,source,why});return true;} return false; };
    const active=pains||(state.symptoms||[]).filter(s=>s.active);
    if(J) J.rehabBlock(active,id=>!out.some(x=>x.id===id)&&available(id),1).forEach(id=>push(id,'pain','zone signalée'));
    if(!a) return out;
    deficits(a).filter(d=>!d.ids.some(present)).forEach(d=>d.ids.some(id=>push(id,'mobility',d.why)));
    const tendons=day==='all'?[tendonLists.A,tendonLists.C]:day==='B'?[tendonLists.B]:day==='C'?[tendonLists.C]:[Number(step)>=3?tendonLists.A3:tendonLists.A];
    tendons.filter(([ids])=>!ids.some(present)).forEach(([ids,why])=>ids.some(id=>push(id,'tendon',why)));
    return out;
  }
  function kineCount(state,minutes) {
    const a=state.athletic;
    if(minutes&&minutes<=30) return 2;
    return (!minutes||minutes>45||a&&a.answers.mindset==='afraid')?3:2;
  }

  // Les mesures communes au bilan et au parcours comptent pour les critères de passage.
  function seedPathwayTests(p,a) {
    const B=BP();
    if(!B||!p||!a) return p;
    const pairs=sharedIds.map(id=>[id,id]).concat([['calf25','calf'],['bridge20','bridge']]);
    return pairs.reduce((acc,[target,from])=>{
      const r=latest(a,from); if(!r||!B.tests[target]) return acc;
      const mine=(acc.tests[target]||[]).slice(-1)[0];
      if(mine&&String(mine.date)>=String(r.date)) return acc;
      const {date,...values}=r;
      return B.recordTest(acc,target,values,date);
    },p);
  }

  // Enregistre le bilan du jour et garde un historique court pour comparer les références (sauts, sprints).
  function finalize(a,now=today()) {
    const res=assess(a).qualities, levels={}, values={};
    Object.values(res).forEach(q=>levels[q.id]=q.level);
    ['vertical','broad','sprint5','sprint10','rsi','run17'].forEach(id=>{const r=latest(a,id);if(r&&r.value!==undefined) values[id]=Number(r.value);});
    const history=(a.history||[]).filter(h=>h.date!==now).concat({date:now,levels,values}).slice(-12);
    return {...a,date:now,history};
  }
  function previousValue(a,id) {
    const past=(a.history||[]).filter(h=>h.date!==a.date&&h.values&&h.values[id]!==undefined);
    return past.length?past[past.length-1]:null;
  }

  const num = x => x!==''&&x!==null&&x!==undefined&&Number.isFinite(Number(x))&&Number(x)>=0&&Number(x)<10000;
  function cleanRecord(t,r) {
    if(!r||typeof r!=='object'||!isoDay(r.date)) return null;
    if(t.unit==='check') return t.sides?{left:r.left===true,right:r.right===true,date:r.date}:{value:r.value===true,date:r.date};
    if(t.unit==='rsa') return num(r.best)&&num(r.last)?{best:Number(r.best),last:Number(r.last),date:r.date}:null;
    if(t.sides) return num(r.left)&&num(r.right)?{left:Number(r.left),right:Number(r.right),date:r.date}:null;
    // method : « video » quand la valeur vient de l'analyse image par image (plus fiable que le mur ou le chrono à la main).
    return num(r.value)?{value:Number(r.value),date:r.date,...(r.method==='video'?{method:'video'}:{})}:null;
  }
  // Tolérant : garde seulement ce qui est connu et borné.
  function validateAthletic(v) {
    if(!v||typeof v!=='object'||Array.isArray(v)) return null;
    const answers={}, tests={}, defs=allTests();
    const given=v.answers&&typeof v.answers==='object'?v.answers:{};
    questions.forEach(q=>{
      const x=given[q.id];
      if(q.multi){ if(Array.isArray(x)) answers[q.id]=[...new Set(x.filter(o=>q.options.some(p=>p[0]===o)))]; }
      else if(q.options.some(o=>o[0]===x)) answers[q.id]=x;
    });
    Object.entries(v.tests&&typeof v.tests==='object'&&!Array.isArray(v.tests)?v.tests:{}).forEach(([id,list])=>{
      if(!defs[id]||!Array.isArray(list)) return;
      const clean=list.map(r=>cleanRecord(defs[id],r)).filter(Boolean).slice(-12);
      if(clean.length) tests[id]=clean;
    });
    const history=(Array.isArray(v.history)?v.history:[]).filter(h=>h&&typeof h==='object'&&isoDay(h.date)).slice(-12).map(h=>({
      date:h.date,
      levels:Object.fromEntries(Object.keys(qualities).map(q=>[q,h.levels&&[0,1,2].includes(h.levels[q])?h.levels[q]:null])),
      values:Object.fromEntries(Object.entries(h.values&&typeof h.values==='object'?h.values:{}).filter(([k,x])=>ownTests[k]||k==='sprint10').filter(([,x])=>num(x)).map(([k,x])=>[k,Number(x)]))
    }));
    return {answers,tests,date:isoDay(v.date)?v.date:null,history};
  }
  function answered(a) { return questions.filter(q=>!q.optional).every(q=>a.answers[q.id]!==undefined); }

  return {trend,qualities,levelLabels,questions,ownTests,sharedIds,groups,testQualities,allTests,create,latest,recordTest,evaluate,canMax,testGroups,assess,weights,targets,recommendedStart,focusLists,dosesFor,focusSlots,focusSlot,deficits,kineBlock,kineCount,seedPathwayTests,finalize,previousValue,validateAthletic,answered};
});

/* Rehaab : dossier joueur. Sept chapitres adaptatifs (on ne voit que les questions qui nous concernent), puis apply()
   écrit les réponses dans les structures existantes (profile, player, basketProfile, athletic.answers, symptoms, owned) :
   tous les moteurs en profitent sans réécriture. summary() résume le joueur pour l'IA, sans prénom. Pur, sans DOM, pas de diagnostic. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PlayerDossier = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const g = typeof globalThis !== 'undefined' ? globalThis : {};
  function lib(name,path) { if(g[name]) return g[name]; try { return typeof require==='function'?require(path):null; } catch (e) { return null; } }
  const PT = () => lib('PersonalTraining','./personal-engine.js');
  const JP = () => lib('PlayerProfile','./player-profile.js');
  const AP = () => lib('AthleticProfile','./athletic-profile.js');
  const BPr = () => lib('BasketProfile','./basket-profile.js');
  const RW = () => lib('RehabWarmup','./rehab-warmup.js');
  const today = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const isoDay = v => typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
  const o = list => list.map(([value,label,hint])=>({value,label,...(hint?{hint}:{})}));
  const days = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

  const chapters = [
    {id:'morpho',title:'Ton gabarit',short:'Taille, poids, poids de jeu, détente',required:true,photo:'morpho'},
    {id:'game',title:'Ton basket',short:'Poste, profil, armes, club',required:true,photo:'game'},
    {id:'break',title:'Ta pause',short:'Durée, raison, ce qui a baissé',required:false,photo:'break'},
    {id:'health',title:'Ta santé',short:'Blessures passées, douleurs du moment',required:true,photo:'health'},
    {id:'body',title:'Ton corps aujourd’hui',short:'Détente, appuis, souffle, force',required:false,photo:'body'},
    {id:'life',title:'Ta semaine',short:'Jours libres, durée, lieu, matériel, sommeil',required:false,photo:'life'},
    {id:'goals',title:'Tes objectifs',short:'Cap, échéance, priorités',required:true,photo:'goals'}
  ];

  // Douleurs : mêmes zones que le moteur. La précision « où exactement » choisit le protocole de soin (RehabWarmup.where).
  const painRegions = [['knee','Genou'],['ankle','Cheville, pied, mollet'],['hip','Hanche, aine, cuisse'],['back','Dos'],['shoulder','Épaule'],['wrist','Poignet, doigts'],['elbow','Coude'],['neck','Cou']];
  const sideOptions = o([['left','Gauche'],['right','Droite'],['both','Les deux'],['center','Au centre']]);
  const hasPain = (a,r) => Array.isArray(a.pains) && a.pains.includes(r);
  const whereOf = region => { const R=RW(); if(!R) return []; return (R.where[R.zoneOfRegion[region]]||[]).map(([value,label])=>({value,label})); };

  const weapons = o([['crossover','Crossover'],['between','Entre les jambes'],['behind','Dans le dos'],['hesi','Hésitation'],['inout','In & out'],['spin','Spin'],['euro','Euro step'],['floater','Floater'],['pullup','Pull-up après dribble'],['stepback','Step-back'],['catchshoot','Catch & shoot'],['post','Jeu dos au panier'],['jab','Jab step'],['passing','Passe, vision']]);
  const levels = o([['loisir','Loisir'],['club','Club départemental'],['regional','Régional'],['national','National']]);

  function questionList() {
    const J=JP(), B=BPr(), A=AP(), P=PT(), R=RW();
    const positions=J?Object.entries(J.positions).map(([value,p])=>({value,label:`${p.number} · ${p.label}`})):[];
    const archetypes=J?Object.entries(J.archetypes).map(([value,a])=>({value,label:a.label,hint:a.hint})):[];
    const skills=B?Object.entries(B.skills).map(([value,s])=>({value,label:s.label})):[];
    const q = [
      // 1. Gabarit
      {id:'age',chapter:'morpho',type:'number',label:'Ton âge',unit:'ans',min:14,max:70,required:true},
      {id:'height',chapter:'morpho',type:'number',label:'Ta taille',unit:'cm',min:140,max:230,required:true},
      {id:'weight',chapter:'morpho',type:'number',label:'Ton poids aujourd’hui',unit:'kg',min:40,max:200,step:0.1,required:true},
      {id:'playWeight',chapter:'morpho',type:'number',label:'Ton poids quand tu jouais à ton meilleur niveau',hint:'Ton « poids de jeu ». Laisse vide si tu ne sais pas.',unit:'kg',min:40,max:200,step:0.1},
      {id:'hand',chapter:'morpho',type:'single',label:'Ta main forte',options:o([['right','Droite'],['left','Gauche'],['both','Les deux']])},
      {id:'takeoff',chapter:'morpho',type:'single',label:'En lay-up, ton pied d’appel',hint:'Le pied qui pousse au moment de sauter.',options:o([['left','Gauche'],['right','Droit'],['both','Les deux'],['unknown','Je ne sais pas']])},
      {id:'reach',chapter:'morpho',type:'single',label:'En sautant avec élan, tu touches…',options:o([['none','Rien de spécial'],['net','Le filet'],['board','La planche'],['rim','Le cercle'],['dunk','Je dunke']]),required:true},
      // 2. Ton basket
      {id:'position',chapter:'game',type:'single',label:'Ton poste principal',options:positions,required:true},
      {id:'position2',chapter:'game',type:'single',label:'Un deuxième poste ?',options:[{value:'none',label:'Non'},...positions],when:a=>!!a.position},
      {id:'archetypes',chapter:'game',type:'multi',max:3,label:'Ton profil de jeu',hint:'Trois au maximum.',options:archetypes,required:true},
      {id:'levelPeak',chapter:'game',type:'single',label:'Le plus haut niveau où tu as joué',options:levels,required:true},
      {id:'levelTarget',chapter:'game',type:'single',label:'Le niveau que tu vises',options:levels},
      {id:'years',chapter:'game',type:'number',label:'Années de basket au total',unit:'ans',min:0,max:40},
      {id:'weapons',chapter:'game',type:'multi',max:6,label:'Tes armes',hint:'Ce que tu sais vraiment faire en match.',options:weapons},
      {id:'strengths',chapter:'game',type:'multi',max:3,label:'Sur le terrain, tu es à l’aise pour…',options:skills},
      {id:'weaknesses',chapter:'game',type:'multi',max:3,label:'Sur le terrain, tu galères pour…',hint:'C’est ce qui oriente le plus ton programme.',options:skills,required:true},
      {id:'club',chapter:'game',type:'single',label:'Tu joues en club en ce moment ?',options:o([['yes','Oui'],['soon','Je reprends bientôt'],['no','Non, playground ou rien']]),required:true},
      {id:'practiceDays',chapter:'game',type:'days',label:'Tes jours d’entraînement au club',when:a=>a.club==='yes'},
      {id:'matchDay',chapter:'game',type:'day',label:'Ton jour de match',when:a=>a.club==='yes'},
      {id:'season',chapter:'game',type:'single',label:'Période de l’année pour toi',options:B?o(B.seasons):[],when:a=>a.club!=='no'},
      {id:'hoop',chapter:'game',type:'single',label:'Accès à un panier',options:o([['daily','Quand je veux'],['weekly','Une ou deux fois par semaine'],['rare','Rarement'],['none','Jamais']])},
      // 3. Ta pause
      {id:'layoffMonths',chapter:'break',type:'number',label:'Depuis combien de mois tu n’as pas joué régulièrement ?',hint:'0 si tu joues en ce moment.',unit:'mois',min:0,max:240},
      {id:'layoffReason',chapter:'break',type:'single',label:'Pourquoi cette pause ?',options:o([['injury','Une blessure'],['studies','Les études'],['work','Le travail'],['family','La famille'],['motivation','L’envie n’était plus là'],['other','Autre']]),when:a=>Number(a.layoffMonths)>0},
      {id:'layoffActivity',chapter:'break',type:'single',label:'Pendant la pause, tu faisais…',options:o([['none','Rien de sportif'],['gym','De la salle'],['running','Du cardio, de la course'],['sport','Un autre sport'],['pickup','Quelques matchs entre potes']]),when:a=>Number(a.layoffMonths)>0},
      {id:'kilosGained',chapter:'break',type:'number',label:'Combien de kilos pris depuis ?',hint:'Négatif si tu en as perdu.',unit:'kg',min:-40,max:80,when:a=>Number(a.layoffMonths)>0&&!(Number(a.playWeight)>0)},
      {id:'dropped',chapter:'break',type:'multi',max:4,label:'Ce qui a le plus baissé',options:o([['jump','La détente'],['speed','La vitesse, le premier pas'],['breath','Le souffle'],['shooting','Le tir'],['handle','Le dribble'],['strength','La force, le contact'],['confidence','La confiance']]),when:a=>Number(a.layoffMonths)>0},
      // 4. Santé
      {id:'history',chapter:'health',type:'multi',max:8,label:'Tes blessures passées',options:o([['none','Aucune'],['ankle','Entorse de cheville'],['knee','Genou (tendon, ménisque, ligament)'],['back','Dos'],['hamstring','Arrière de cuisse'],['groin','Aine'],['shoulder','Épaule'],['finger','Doigts, poignet'],['surgery','Une opération']]),required:true,exclusive:'none'},
      {id:'ankleSprains',chapter:'health',type:'single',label:'Combien d’entorses de cheville ?',options:o([['1','Une'],['2-3','Deux ou trois'],['4+','Quatre ou plus']]),when:a=>(a.history||[]).includes('ankle')},
      {id:'surgeryWhat',chapter:'health',type:'text',label:'Quelle opération, et quand ?',max:160,when:a=>(a.history||[]).includes('surgery')},
      {id:'pains',chapter:'health',type:'multi',max:4,label:'Une douleur en ce moment ?',hint:'Même légère : elle ne t’empêche pas de t’entraîner, elle change les exercices.',options:[{value:'none',label:'Aucune'},...painRegions.map(([value,label])=>({value,label}))],required:true,exclusive:'none'},
      ...painRegions.flatMap(([r,label])=>[
        {id:`pain-${r}-where`,chapter:'health',type:'single',label:`${label} : où exactement ?`,options:whereOf(r),when:a=>hasPain(a,r)&&whereOf(r).length>1,required:true},
        {id:`pain-${r}-side`,chapter:'health',type:'single',label:`${label} : quel côté ?`,options:sideOptions,when:a=>hasPain(a,r)},
        {id:`pain-${r}-severity`,chapter:'health',type:'scale',label:`${label} : intensité ressentie`,hint:'0-3 : gêne. 4-6 : douleur. 7 et plus : pas de séance.',min:0,max:10,when:a=>hasPain(a,r),required:true}
      ]),
      {id:'triggers',chapter:'health',type:'multi',max:6,label:'Ce qui réveille la douleur',options:R?o(R.triggers):[],when:a=>Array.isArray(a.pains)&&a.pains.some(p=>p!=='none')},
      {id:'morning',chapter:'health',type:'single',label:'Raideur au réveil',options:o([['none','Aucune'],['short','Moins de 30 minutes'],['long','Plus de 30 minutes']])},
      {id:'flags',chapter:'health',type:'multi',max:7,label:'Un de ces signes ?',hint:'Si oui, l’app ne propose rien sur la zone et te conseille de consulter.',options:[{value:'none',label:'Aucun'},...(R?o(R.redFlags):[])],when:a=>Array.isArray(a.pains)&&a.pains.some(p=>p!=='none'),required:true,exclusive:'none'},
      // 5. Ton corps aujourd'hui : les questions du bilan athlétique, puis du concret.
      ...(A?A.questions.map(x=>({id:`ap-${x.id}`,chapter:'body',type:x.multi?'multi':'single',max:x.multi?5:undefined,label:x.label,options:x.options.map(([value,label])=>({value,label}))})):[]),
      {id:'floorRise',chapter:'body',type:'single',label:'Te relever du sol, assis en tailleur',options:o([['nohands','Sans les mains'],['onehand','Avec une main'],['hard','Avec difficulté']])},
      {id:'run10',chapter:'body',type:'single',label:'Courir 10 minutes sans t’arrêter',options:o([['easy','Facile'],['hard','Dur mais possible'],['no','Impossible pour l’instant']])},
      {id:'pushups',chapter:'body',type:'single',label:'Pompes propres d’affilée',options:o([['20+','20 ou plus'],['10-19','10 à 19'],['1-9','1 à 9'],['0','Aucune']])},
      {id:'plank',chapter:'body',type:'single',label:'Planche sur les avant-bras',options:o([['60+','Plus d’une minute'],['30-60','30 s à 1 min'],['<30','Moins de 30 s']])},
      // 6. Ta semaine
      {id:'sessions',chapter:'life',type:'single',label:'Séances possibles par semaine, en plus du club',options:o([['2','2'],['3','3'],['4','4'],['5','5'],['6','6']])},
      {id:'freeDays',chapter:'life',type:'days',label:'Tes jours libres pour t’entraîner'},
      {id:'slot',chapter:'life',type:'single',label:'Plutôt…',options:o([['morning','Le matin'],['noon','Le midi'],['evening','Le soir'],['variable','Ça change']])},
      {id:'maxMinutes',chapter:'life',type:'single',label:'Durée maximale d’une séance',options:o([['20','20 min'],['30','30 min'],['45','45 min'],['60','1 h'],['75','1 h 15'],['90','1 h 30']])},
      {id:'places',chapter:'life',type:'multi',max:4,label:'Où tu t’entraînes',options:o([['home','À la maison'],['gym','En salle'],['court','Sur un terrain'],['outdoor','Dehors, parc, piste']])},
      {id:'equipment',chapter:'life',type:'equipment',label:'Ton matériel',hint:'Le poids du corps est toujours disponible.'},
      {id:'sleep',chapter:'life',type:'single',label:'Ton sommeil, en moyenne',options:o([['<6','Moins de 6 h'],['6-7','6 à 7 h'],['7-8','7 à 8 h'],['8+','Plus de 8 h']])},
      {id:'job',chapter:'life',type:'single',label:'Dans la journée, tu es…',options:o([['sit','Assis la plupart du temps'],['stand','Debout, en mouvement'],['physical','Dans un travail physique'],['student','Étudiant']])},
      {id:'stress',chapter:'life',type:'single',label:'Ton niveau de stress ces temps-ci',options:o([['low','Bas'],['mid','Moyen'],['high','Élevé']])},
      // 7. Objectifs
      {id:'mainGoal',chapter:'goals',type:'single',label:'Ton objectif principal',options:o([['comeback','Retrouver mon niveau d’avant'],['athletic','Devenir plus athlétique qu’avant'],['club','Rejouer en club'],['level','Monter de niveau'],['weight','Perdre du poids et retrouver mes jambes'],['durable','Jouer sans me blesser']]),required:true},
      {id:'measurable',chapter:'goals',type:'multi',max:4,label:'Ce que tu veux pouvoir faire',options:o([['rim','Toucher le cercle'],['dunk','Dunker'],['weight','Atteindre un poids'],['fullmatch','Tenir un match entier'],['painfree','Jouer sans douleur'],['firststep','Passer mon défenseur au premier pas'],['shooting','Retrouver mon tir']])},
      {id:'targetWeight',chapter:'goals',type:'number',label:'Poids visé',unit:'kg',min:40,max:200,step:0.1,when:a=>(a.measurable||[]).includes('weight')},
      {id:'deadline',chapter:'goals',type:'single',label:'Pour quand ?',options:o([['1m','Dans un mois'],['3m','Dans trois mois'],['6m','Dans six mois'],['season','Pour la prochaine saison'],['none','Pas d’échéance']]),required:true},
      {id:'priorities',chapter:'goals',type:'rank',max:3,label:'Classe tes priorités physiques',hint:'Touche dans l’ordre : la première compte le plus.',options:J?J.goals.map(x=>({value:x.id,label:x.label})):[],required:true},
      {id:'fear',chapter:'goals',type:'single',label:'La peur de te blesser',options:o([['none','Elle ne me freine pas'],['some','Elle me freine un peu'],['strong','Elle me bloque']])}
    ];
    return q;
  }
  let cache=null;
  const questions = () => cache||(cache=questionList());
  const visible = (q,a) => !q.when||q.when(a||{});
  function questionsFor(chapter,answers) { return questions().filter(q=>q.chapter===chapter&&visible(q,answers)); }
  const answered = (q,v) => v!==undefined&&v!==null&&v!==''&&!(Array.isArray(v)&&!v.length);

  function cleanAnswer(q,v) {
    const ok=x=>(q.options||[]).some(p=>p.value===x);
    if(q.type==='single') return ok(v)?v:undefined;
    if(q.type==='multi'||q.type==='rank') {
      if(!Array.isArray(v)) return undefined;
      let list=[...new Set(v)].filter(ok).slice(0,q.max||8);
      if(q.exclusive&&list.includes(q.exclusive)) list=list.length>1&&list[list.length-1]!==q.exclusive?list.filter(x=>x!==q.exclusive):[q.exclusive];
      return list;
    }
    if(q.type==='number'||q.type==='scale') {
      if(v===''||v===null||v===undefined) return undefined;
      const n=Number(v);return Number.isFinite(n)&&n>=q.min&&n<=q.max?Math.round(n*10)/10:undefined;
    }
    if(q.type==='days') return Array.isArray(v)?[...new Set(v.filter(n=>Number.isInteger(n)&&n>=0&&n<=6))].sort():undefined;
    if(q.type==='day') return v===null||v==='none'?'none':Number.isInteger(v)&&v>=0&&v<=6?v:undefined;
    if(q.type==='text') return typeof v==='string'&&v.trim()?v.trim().slice(0,q.max||200):undefined;
    if(q.type==='equipment') { const P=PT(), ids=P?P.equipment.map(e=>e.id):[]; return Array.isArray(v)?[...new Set(['bodyweight',...v.filter(x=>ids.includes(x))])]:undefined; }
    return undefined;
  }
  // Une réponse exclusive (« Aucune ») retire les autres, et inversement : le dernier choix gagne.
  function toggle(q,list,value) {
    const cur=Array.isArray(list)?list:[];
    if(cur.includes(value)) return cur.filter(x=>x!==value);
    if(q.exclusive) return value===q.exclusive?[value]:[...cur.filter(x=>x!==q.exclusive),value].slice(-(q.max||8));
    return [...cur,value].slice(-(q.max||8));
  }

  function blank() { return {answers:{},chapters:{},followups:[],synthesis:null,checkins:[],date:null}; }
  function validate(v) {
    if(!v||typeof v!=='object'||Array.isArray(v)) return null;
    const answers={}, given=v.answers&&typeof v.answers==='object'&&!Array.isArray(v.answers)?v.answers:{};
    questions().forEach(q=>{ const x=cleanAnswer(q,given[q.id]); if(x!==undefined) answers[q.id]=x; });
    const chaptersDone={};
    Object.entries(v.chapters&&typeof v.chapters==='object'?v.chapters:{}).forEach(([k,d])=>{ if(chapters.some(c=>c.id===k)&&isoDay(d)) chaptersDone[k]=d; });
    const followups=(Array.isArray(v.followups)?v.followups:[]).filter(f=>f&&typeof f.question==='string'&&f.question.trim()).slice(-12).map(f=>({
      id:typeof f.id==='string'?f.id.slice(0,40):String(Math.random()).slice(2,10),
      question:f.question.trim().slice(0,240),answer:typeof f.answer==='string'?f.answer.trim().slice(0,400):'',date:isoDay(f.date)?f.date:today()
    }));
    const s=v.synthesis&&typeof v.synthesis==='object'?v.synthesis:null;
    const synthesis=s&&typeof s.message==='string'?{
      message:s.message.slice(0,1500),
      priorities:(Array.isArray(s.priorities)?s.priorities:[]).filter(p=>p&&typeof p.label==='string').slice(0,3).map(p=>({label:p.label.slice(0,80),why:String(p.why||'').slice(0,240)})),
      risks:(Array.isArray(s.risks)?s.risks:[]).filter(x=>typeof x==='string').slice(0,3).map(x=>x.slice(0,200)),
      source:s.source==='ai'?'ai':'local',date:isoDay(s.date)?s.date:today()
    }:null;
    return {answers,chapters:chaptersDone,followups,synthesis,checkins:(Array.isArray(v.checkins)?v.checkins:[]).filter(isoDay).slice(-24),date:isoDay(v.date)?v.date:null};
  }

  function chapterStatus(d,id) {
    const a=(d&&d.answers)||{}, list=questionsFor(id,a), req=list.filter(q=>q.required);
    const count=list.filter(q=>answered(q,a[q.id])).length;
    const missing=req.filter(q=>!answered(q,a[q.id])).map(q=>q.id);
    return {id,total:list.length,count,missing,done:!missing.length&&!!(d&&d.chapters&&d.chapters[id])};
  }
  function completeness(d) {
    const list=chapters.map(c=>({...c,...chapterStatus(d,c.id)}));
    const total=list.reduce((n,c)=>n+c.total,0), count=list.reduce((n,c)=>n+c.count,0);
    return {chapters:list,percent:total?Math.round(count/total*100):0,ready:list.filter(c=>c.required).every(c=>c.done),next:(list.find(c=>c.required&&!c.done)||list.find(c=>!c.done)||null)};
  }

  const label = (id,value) => { const q=questions().find(x=>x.id===id); const opt=q&&(q.options||[]).find(p=>p.value===value); return opt?opt.label:String(value); };
  const labels = (id,list) => (list||[]).map(v=>label(id,v));
  const gap = a => Number(a.weight)>0&&Number(a.playWeight)>0?Math.round((Number(a.weight)-Number(a.playWeight))*10)/10:Number.isFinite(Number(a.kilosGained))&&a.kilosGained!==undefined?Number(a.kilosGained):null;
  function pains(a) { return (a.pains||[]).filter(r=>r!=='none').map(r=>({region:r,where:a[`pain-${r}-where`]||null,side:a[`pain-${r}-side`]||'both',severity:Number.isFinite(Number(a[`pain-${r}-severity`]))?Number(a[`pain-${r}-severity`]):3})); }
  const sideText = {left:'côté gauche',right:'côté droit',both:'des deux côtés',center:'au centre'};
  const redFlags = a => (a.flags||[]).filter(f=>f!=='none');

  // Résumé pour l'IA et pour l'écran « ce que le coach a compris ». Jamais de prénom.
  function summary(d) {
    if(!d||!d.answers) return null;
    const a=d.answers, out=[], J=JP();
    if(a.position) {
      const pos=J&&J.positions[a.position]?J.positions[a.position].label:a.position;
      const second=a.position2&&a.position2!=='none'?` / ${label('position2',a.position2)}`:'';
      out.push(`${pos}${second}${(a.archetypes||[]).length?` (${labels('archetypes',a.archetypes).join(', ').toLowerCase()})`:''}${a.levelPeak?`, meilleur niveau ${label('levelPeak',a.levelPeak).toLowerCase()}`:''}${a.levelTarget?`, vise ${label('levelTarget',a.levelTarget).toLowerCase()}`:''}${a.years!==undefined?`, ${a.years} ans de basket`:''}.`);
    }
    const body=[a.age&&`${a.age} ans`,a.height&&`${a.height} cm`,a.weight&&`${a.weight} kg`].filter(Boolean);
    if(body.length) out.push(`${body.join(', ')}${a.playWeight?` (poids de jeu ${a.playWeight} kg)`:''}${gap(a)?`, écart ${gap(a)>0?'+':''}${gap(a)} kg`:''}.`);
    if(a.reach) out.push(`Détente : touche ${label('reach',a.reach).toLowerCase()}${a.takeoff&&a.takeoff!=='unknown'?`, appel pied ${label('takeoff',a.takeoff).toLowerCase()}`:''}.`);
    if(Number(a.layoffMonths)>0) out.push(`Pause de ${a.layoffMonths} mois${a.layoffReason?` (${label('layoffReason',a.layoffReason).toLowerCase()})`:''}${a.layoffActivity?`, pendant la pause : ${label('layoffActivity',a.layoffActivity).toLowerCase()}`:''}${(a.dropped||[]).length?`. A le plus baissé : ${labels('dropped',a.dropped).join(', ').toLowerCase()}`:''}.`);
    if((a.weapons||[]).length) out.push(`Armes : ${labels('weapons',a.weapons).join(', ')}.`);
    if((a.weaknesses||[]).length) out.push(`Galère pour : ${labels('weaknesses',a.weaknesses).join(', ').toLowerCase()}${(a.strengths||[]).length?` ; à l’aise pour : ${labels('strengths',a.strengths).join(', ').toLowerCase()}`:''}.`);
    if(a.club) out.push(`Club : ${a.club==='yes'?'oui':label('club',a.club).toLowerCase()}${(a.practiceDays||[]).length?`, entraînements ${a.practiceDays.map(n=>days[n].toLowerCase()).join(', ')}`:''}${Number.isInteger(a.matchDay)?`, match le ${days[a.matchDay].toLowerCase()}`:''}${a.hoop?`. Panier : ${label('hoop',a.hoop).toLowerCase()}`:''}.`);
    const hist=(a.history||[]).filter(h=>h!=='none');
    if(hist.length) out.push(`Antécédents : ${labels('history',hist).join(', ').toLowerCase()}${a.ankleSprains?` (${a.ankleSprains} entorse${a.ankleSprains==='1'?'':'s'})`:''}${a.surgeryWhat?` ; opération : ${a.surgeryWhat}`:''}.`);
    const p=pains(a);
    if(p.length) out.push(`Douleurs actuelles : ${p.map(x=>`${label('pains',x.region).toLowerCase()} ${sideText[x.side]||''} ${x.severity}/10${x.where&&x.where!=='unknown'?` (${label(`pain-${x.region}-where`,x.where).toLowerCase()})`:''}`).join(' ; ')}${(a.triggers||[]).length?`. Déclenchée par : ${labels('triggers',a.triggers).join(', ').toLowerCase()}`:''}.`);
    else if((a.pains||[]).includes('none')) out.push('Aucune douleur actuelle.');
    if(redFlags(a).length) out.push(`Signes d’alerte déclarés : ${labels('flags',redFlags(a)).join(', ').toLowerCase()}.`);
    if(a.morning&&a.morning!=='none') out.push(`Raideur au réveil : ${label('morning',a.morning).toLowerCase()}.`);
    const fn=[a.floorRise&&`relevé du sol ${label('floorRise',a.floorRise).toLowerCase()}`,a.run10&&`10 min de course : ${label('run10',a.run10).toLowerCase()}`,a.pushups&&`pompes : ${label('pushups',a.pushups).toLowerCase()}`,a.plank&&`planche : ${label('plank',a.plank).toLowerCase()}`].filter(Boolean);
    const A=AP(); const apLines=A?A.questions.filter(x=>a[`ap-${x.id}`]!==undefined).map(x=>{const v=a[`ap-${x.id}`];return `${x.label.toLowerCase()} : ${(Array.isArray(v)?v:[v]).map(k=>(x.options.find(p=>p[0]===k)||[k,k])[1].toLowerCase()).join(', ')}`;}):[];
    if(fn.length||apLines.length) out.push(`Corps aujourd’hui : ${[...apLines,...fn].join(' ; ')}.`);
    const life=[a.sessions&&`${a.sessions} séances possibles par semaine`,(a.freeDays||[]).length&&`jours libres ${a.freeDays.map(n=>days[n].toLowerCase()).join(', ')}`,a.slot&&label('slot',a.slot).toLowerCase(),a.maxMinutes&&`${a.maxMinutes} min maximum`,(a.places||[]).length&&labels('places',a.places).join(', ').toLowerCase(),a.sleep&&`sommeil ${label('sleep',a.sleep).toLowerCase()}`,a.job&&label('job',a.job).toLowerCase(),a.stress&&`stress ${label('stress',a.stress).toLowerCase()}`].filter(Boolean);
    if(life.length) out.push(`Semaine : ${life.join(', ')}.`);
    if(a.mainGoal) out.push(`Objectif : ${label('mainGoal',a.mainGoal).toLowerCase()}${(a.measurable||[]).length?` ; veut : ${labels('measurable',a.measurable).join(', ').toLowerCase()}`:''}${a.targetWeight?` (poids visé ${a.targetWeight} kg)`:''}${a.deadline?` ; échéance : ${label('deadline',a.deadline).toLowerCase()}`:''}.`);
    if((a.priorities||[]).length) out.push(`Priorités dans l’ordre : ${labels('priorities',a.priorities).join(', ').toLowerCase()}.`);
    if(a.fear&&a.fear!=='none') out.push(`Peur de la blessure : ${label('fear',a.fear).toLowerCase()}.`);
    (d.followups||[]).filter(f=>f.answer).forEach(f=>out.push(`Q : ${f.question} R : ${f.answer}`));
    return out.join('\n');
  }

  // Écrit le dossier dans les structures existantes. Seules les réponses données remplacent l'existant.
  function apply(state,dossier,now=today()) {
    const d=validate(dossier)||blank(), a=d.answers, J=JP(), B=BPr(), A=AP(), P=PT(), R=RW();
    const s={...state,dossier:d};
    const has=k=>a[k]!==undefined;
    // Profil général.
    const profile={...s.profile};
    ['age','height','weight'].forEach(k=>{ if(has(k)) profile[k]=String(a[k]); });
    if(has('sessions')) profile.weeklyTarget=Number(a.sessions);
    const months=Number(a.layoffMonths)||0;
    // Reprise après 3 mois ou plus, ou sans force travaillée depuis longtemps : la progression part de « returning ».
    if(months>=3||a['ap-strength']==='none') profile.experience='returning';
    else if(a['ap-strength']==='regular') profile.experience='regular';
    if(profile.goal==='balanced'&&a.mainGoal) profile.goal='basket';
    profile.basketLevel=a.levelPeak==='loisir'?'beginner':a.levelPeak?'regular':profile.basketLevel;
    if(chapters.filter(c=>c.required).every(c=>d.chapters[c.id])) profile.onboarded=true;
    s.profile=profile;
    // Profil joueur.
    if(J&&(has('position')||has('archetypes')||has('priorities'))) {
      const prev=s.player||{};
      s.player=J.validatePlayer({...prev,
        position:a.position||prev.position,
        archetypes:a.archetypes||prev.archetypes,
        level:a.levelPeak||prev.level,
        season:a.season||prev.season,
        layoff:has('layoffMonths')?(months>=12?'long':months>0?'months':'none'):prev.layoff,
        goals:a.priorities||prev.goals});
    }
    // « Mon jeu » : terrain, club, ressentis.
    if(B&&(has('weaknesses')||has('club')||has('pains'))) {
      const prev=B.validate(s.basketProfile)||B.blank();
      const goal={weight:'lean',athletic:'power',level:'power',durable:'durability',comeback:'power',club:'durability'}[a.mainGoal]||prev.goal;
      const feel=new Set((prev.feelings||[]).filter(f=>!['knees','ankles','back','shoulders'].includes(f)));
      pains(a).forEach(p=>{ const f={knee:'knees',ankle:'ankles',back:'back',shoulder:'shoulders'}[p.region]; if(f) feel.add(f); });
      if((a.dropped||[]).includes('breath')) feel.add('breath');
      if(feel.size>1) feel.delete('fine');
      s.basketProfile=B.validate({...prev,
        strengths:a.strengths||prev.strengths,weaknesses:a.weaknesses||prev.weaknesses,feelings:[...feel],
        season:a.season||prev.season,
        practiceDays:a.club==='yes'?(a.practiceDays||prev.practiceDays):a.club?[]:prev.practiceDays,
        matchDay:a.club==='yes'?(Number.isInteger(a.matchDay)?a.matchDay:a.matchDay==='none'?null:prev.matchDay):a.club?null:prev.matchDay,
        goal,date:(a.weaknesses||[]).length?now:prev.date});
    }
    // Bilan athlétique : les réponses du chapitre « Ton corps » deviennent ses réponses (les tests ne bougent pas).
    if(A) {
      const ap=Object.fromEntries(Object.entries(a).filter(([k])=>k.startsWith('ap-')).map(([k,v])=>[k.slice(3),v]));
      if(Object.keys(ap).length) { const prev=A.validateAthletic(s.athletic)||A.create(); s.athletic=A.validateAthletic({...prev,answers:{...prev.answers,...ap}}); }
    }
    // Douleurs : une zone déclarée met à jour la douleur active de la zone, ou en crée une. Une zone retirée est marquée résolue.
    if(P&&has('pains')) {
      const list=pains(a), flags=redFlags(a).length>0, regions=list.map(p=>p.region);
      const protocolOf=p=>{ if(!R) return undefined; if(p.where&&p.where!=='unknown'&&R.byId(p.where)) return p.where; const g=R.guessProtocol(R.zoneOfRegion[p.region],a.triggers||[]); return g&&R.byId(g)?g:undefined; };
      let symptoms=(s.symptoms||[]).map(x=>x.active&&!regions.includes(x.region)?{...x,active:false,resolvedAt:now}:x);
      list.forEach(p=>{
        const i=symptoms.findIndex(x=>x.active&&x.region===p.region), protocol=protocolOf(p);
        const base={region:p.region,side:p.side,severity:p.severity,redFlags:flags,...(protocol?{protocol}:{})};
        if(i>=0) symptoms[i]={...symptoms[i],...base};
        else symptoms.push({id:P.uid(),...base,onset:'known',note:'Déclarée dans le dossier joueur',date:now,active:true,followups:[]});
      });
      s.symptoms=symptoms;
    }
    // Matériel.
    if(has('equipment')) { s.owned=a.equipment; s.checkIn={...s.checkIn,equipment:a.equipment}; }
    if(has('maxMinutes')&&s.checkIn) s.checkIn={...s.checkIn,minutes:Math.min(Number(a.maxMinutes),Number(s.checkIn.minutes)||Number(a.maxMinutes))};
    return s;
  }

  // Enregistre un chapitre : réponses nettoyées, date du chapitre, puis écriture dans l'état.
  function saveChapter(state,chapter,answers,now=today()) {
    const prev=validate(state.dossier)||blank();
    // Les réponses cachées (branche abandonnée) de ce chapitre sont retirées pour ne pas fausser le dossier.
    const merged={...prev.answers,...answers};
    questions().filter(q=>q.chapter===chapter&&!visible(q,merged)).forEach(q=>{ delete merged[q.id]; });
    const d=validate({...prev,answers:merged,chapters:{...prev.chapters,[chapter]:now},date:now});
    return apply(state,d,now);
  }

  // Remplit le dossier avec ce que l'app sait déjà (anciens questionnaires), pour ne rien redemander.
  function prefill(state) {
    const a={}, p=state.profile||{}, pl=state.player||{}, bp=state.basketProfile, ath=state.athletic;
    ['age','height','weight'].forEach(k=>{ if(p[k]!==''&&p[k]!==undefined&&Number.isFinite(Number(p[k]))) a[k]=Number(p[k]); });
    if(pl.position) a.position=pl.position;
    if((pl.archetypes||[]).length) a.archetypes=pl.archetypes;
    if(pl.level) a.levelPeak=pl.level;
    if((pl.goals||[]).length) a.priorities=pl.goals;
    if(bp) { if(bp.strengths.length) a.strengths=bp.strengths; if(bp.weaknesses.length) a.weaknesses=bp.weaknesses; if(bp.practiceDays.length||bp.matchDay!==null) { a.club='yes'; a.practiceDays=bp.practiceDays; a.matchDay=bp.matchDay===null?'none':bp.matchDay; } a.season=bp.season; }
    if(ath&&ath.answers) Object.entries(ath.answers).forEach(([k,v])=>{ a[`ap-${k}`]=v; });
    const owned=state.owned||[]; if(owned.length>1) a.equipment=owned;
    const active=(state.symptoms||[]).filter(x=>x.active&&painRegions.some(r=>r[0]===x.region));
    if(active.length) { a.pains=[...new Set(active.map(x=>x.region))].slice(0,4); active.forEach(x=>{ a[`pain-${x.region}-severity`]=Number(x.severity); if(x.side) a[`pain-${x.region}-side`]=x.side; if(x.protocol) a[`pain-${x.region}-where`]=x.protocol; }); }
    const prev=validate(state.dossier)||blank();
    return validate({...prev,answers:{...a,...prev.answers}});
  }

  // Synthèse locale (sans réseau) : priorités calculées par les moteurs + points d'attention issus des réponses.
  function localSynthesis(state) {
    const d=validate(state.dossier)||blank(), a=d.answers, J=JP(), out={priorities:[],risks:[],message:'',source:'local',date:today()};
    if(J&&state.player&&state.player.position) {
      const top=J.priorities({...state.player,court:state.basketProfile||null},state.athletic||null).slice(0,3);
      out.priorities=top.map(q=>({label:q.label,why:whyQuality(q.id,a)}));
    }
    const g=gap(a), months=Number(a.layoffMonths)||0, p=pains(a);
    if(redFlags(a).length) out.risks.push('Un signe d’alerte est déclaré : fais examiner la zone par un professionnel avant tout exercice ciblé.');
    p.filter(x=>x.severity>=7).forEach(x=>out.risks.push(`${label('pains',x.region)} à ${x.severity}/10 : pas de séance tant que la douleur n’a pas été vue.`));
    if(months>=12) out.risks.push(`${months} mois sans jouer : les tendons reprennent moins vite que les muscles. On remonte les sauts et les sprints progressivement.`);
    if(g!==null&&g>=5) out.risks.push(`${g} kg au-dessus de ton poids de jeu : chaque réception pèse plus sur les genoux. Les sauts répétés arrivent après les fondations.`);
    p.filter(x=>x.severity<7).forEach(x=>out.risks.push(`${label('pains',x.region)} ${x.severity}/10 : le soin de la zone est intégré à tes séances, et les exercices qu’elle ne tolère pas sont écartés.`));
    if((a.history||[]).includes('ankle')&&['2-3','4+'].includes(a.ankleSprains)) out.risks.push('Plusieurs entorses de cheville : équilibre et chevilles réactives à chaque séance.');
    out.risks=out.risks.slice(0,3);
    const pos=J&&a.position&&J.positions[a.position]?J.positions[a.position].label.toLowerCase():'joueur';
    // Priorité n°1 du joueur absente du début du plan : on dit pourquoi, au lieu de l'ignorer.
    const first=(a.priorities||[])[0], firstQ={vertical:'vertical',speed:'firststep',strength:'strength',endurance:'endurance'}[first];
    const delayed=firstQ&&J&&!out.priorities.some(x=>x.label===J.qualityLabels[firstQ])?`« ${label('priorities',first)} » n’est pas oublié : ${p.length||(g!==null&&g>=5)||months>=12?'ça arrive dès que les fondations sont posées (tendons, poids, appuis), pour ne pas te blesser en chemin':'ça monte en priorité à l’étape suivante'}.`:'';
    out.message=`Tu es ${pos}${months?`, ${months} mois sans jouer`:''}${g!==null&&g>0?`, ${g} kg au-dessus de ton poids de jeu`:''}. ${out.priorities.length?`Ton plan commence par : ${out.priorities.map(x=>x.label.toLowerCase()).join(', ')}.`:''} ${a.mainGoal?`Cap : ${label('mainGoal',a.mainGoal).toLowerCase()}${a.deadline&&a.deadline!=='none'?`, ${label('deadline',a.deadline).toLowerCase()}`:''}.`:''}${delayed?' '+delayed:''}`.replace(/\s+/g,' ').trim();
    if(!a.position) out.message='Complète d’abord les chapitres essentiels (gabarit, basket, santé, objectifs) : le coach part de là pour comprendre ton profil.';
    return out;
  }
  function whyQuality(id,a) {
    const B=BPr(), w=(a.weaknesses||[]).filter(k=>B&&B.skills[k]&&B.skills[k].qualities[id]).map(k=>label('weaknesses',k).toLowerCase());
    const map={firststep:'ton premier pas en un contre un',decel:'freiner et changer de direction sans que le genou rentre',lateral:'tenir ton défenseur en latéral',vertical:'retrouver ta détente',endurance:'tenir un match entier',ankle:'des chevilles qui encaissent les appuis',strength:'une base de force pour tout le reste',unilateral:'pousser et réceptionner sur une jambe',reactive:'des appuis rapides et légers',contact:'tenir au contact',antirot:'garder ta ligne au contact',hip:'des hanches stables',speed:'ta vitesse en transition',core:'transmettre la force des jambes',shoulder:'des épaules solides',mobility:'te baisser et amortir'};
    const base=map[id]||'ton jeu';
    return w.length?`Pour ${base}. Tu as dit galérer pour : ${w.join(', ')}.`:`Pour ${base}.`;
  }

  // Point d'étape toutes les 4 semaines.
  function checkinDue(state,now=today()) {
    const d=state.dossier; if(!d||!d.date) return false;
    const last=[d.date,...(d.checkins||[])].filter(isoDay).sort().pop();
    return Math.round((Date.parse(`${now}T12:00:00Z`)-Date.parse(`${last}T12:00:00Z`))/86400000)>=28;
  }

  return {chapters,days,painRegions,questions,questionsFor,visible,answered,cleanAnswer,toggle,blank,validate,chapterStatus,completeness,summary,apply,saveChapter,prefill,localSynthesis,checkinDue,gap,pains,redFlags,label};
});

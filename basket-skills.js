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
    shoot:{label:'Tir',short:'Tir',style:'Stephen Curry',why:'Routine de forme, catch & shoot, tir après dribble, volume.'},
    finish:{label:'Finition au cercle',short:'Finition',style:'Derrick Rose',why:'Deux mains, appuis variés, vitesse et explosivité au cercle.'},
    footwork:{label:'Jeu de jambes avec ballon',short:'Appuis',style:'',why:'Triple menace, feintes, arrêts et pivots.'}
  };
  const TIERS = ['Fondations','Intermédiaire','Avancé'];

  // Points travaillés, évalués dans le questionnaire.
  const items = {
    weakHand:{area:'handle',label:'Dribbler de la main faible'},
    eyesUp:{area:'handle',label:'Dribbler sans regarder la balle'},
    pressure:{area:'handle',label:'Garder la balle sous pression'},
    moves:{area:'handle',label:'Enchaîner crossover, entre les jambes, dans le dos'},
    speedDribble:{area:'handle',label:'Dribbler vite en transition'},
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
    stops:{area:'footwork',label:'Arrêts et pivots propres'}
  };
  const ratings = [[0,'Difficile'],[1,'Correct'],[2,'Point fort']];

  // Exercices. needs : ball toujours, hoop quand il faut un panier. impact : sauts répétés (charge des jambes).
  // measure 'shots' : réussis / tentés ; seconds sert à estimer la durée (≈ 6 s par tir).
  const D = (id,name,area,tier,tags,needs,instructions,o={}) => ({id,name,kind:'skill',pattern:area,area,tier,tags,needs,instructions,
    regions:o.regions||(area==='handle'?['wrist']:area==='shoot'?['wrist','elbow','shoulder']:['ankle','knee','wrist']),
    level:tier,impact:!!o.impact,measure:o.measure||'reps',sets:o.sets||3,min:o.min||8,max:o.max||12,rest:o.rest||30,seconds:o.seconds||30,
    weighted:false,unilateral:!!o.unilateral,style:o.style||null,cuts:!!o.cuts});
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
    D('sk-rip','Rip-through et attaque','footwork',3,['tripleThreat','pressure'],HC,['Balle balayée bas d’une hanche à l’autre.','Attaque côté opposé en un dribble.','Épaule devant pour protéger.'],{min:6,max:8,rest:40,cuts:true})
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
  const positionAreas = {meneur:{handle:2,shoot:1},arriere:{shoot:2,handle:1},ailier:{finish:1,shoot:1,footwork:1},'ailier-fort':{finish:2,footwork:1},pivot:{finish:2,footwork:2}};
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
    return drills.filter(d=>d.area===area&&d.tier<=tier&&d.tier>=tier-1&&(hoop||!d.needs.includes('hoop'))&&!(hoop&&area==='shoot'&&!d.needs.includes('hoop'))&&!(noImpact&&(d.impact||d.cuts))&&!(stationary&&d.cuts)
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
    const plan=[...take('handle',1),...take(main,total>=45?3:2),...take(second,total>=45?2:1)];
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

  return {areas,TIERS,items,ratings,drills,byId,blank,validate,complete,saveProfile,initialLevels,tierFromAnswers,tierFromTests,priorities,pick,session,hostOf,block,withBlock,record,summary,hoopToday,estimate};
});

const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const PD=require('../player-dossier.js');
const BP=require('../basket-pathway.js');
const JP=require('../player-profile.js');
const SP=require('../season-plan.js');
const BC=require('../basket-cardio.js');

const MONDAY='2026-10-12';
const NOW='2026-10-14';
const items=w=>w.days.flatMap(d=>d.items.map(x=>({...x,day:d.weekday})));

// Un joueur qui a la corde et le vélo, parcours à l'étape donnée, aucune douleur.
function joueur({owned=['bodyweight','bike','rope'],step=2}={}){
  const s=PT.initialState();
  s.profile.onboarded=true;s.profile.experience='regular';s.profile.impactReady=true;
  s.owned=owned;s.checkIn.equipment=owned;
  s.player=JP.validatePlayer({position:'meneur'});
  s.pathway=BP.create({startStep:step,now:'2026-10-05'});
  return s;
}
// Séance cardio déjà faite (propre par défaut).
function fait(s,kind,date,extra={}){
  const e={id:`${kind}-${date}`,entries:{x:[{done:true,pain:!!extra.pain}]}};
  s.sessions.push({id:e.id,date,title:'Cardio',minutes:12,entries:e.entries,exercises:[],source:'cardio',cardioKind:kind,...extra});
  return s;
}

test('corde : petits sauts chronométrés, niveau 1 sur 4 au départ, démarrage autorisé même après une longue pause',()=>{
  const s=joueur();
  // Dernière séance 20 jours plus tôt : le moteur général parlerait de « reprise » et couperait les impacts.
  s.sessions.push({id:'old',date:'2026-09-24',title:'Muscu',minutes:40,entries:{},exercises:[],source:'program-plan'});
  const p=BC.plan(PT,JP,s,'rope',{now:NOW});
  expect(p.error).toBeUndefined();
  expect(p.source).toBe('cardio');
  expect(p.cardioKind).toBe('rope');
  expect(p.cardioSoft).toBe(false);
  const e=p.exercises[0];
  expect(e.id).toBe('rope');
  expect(e.impact).toBe(true);
  expect([e.sets,e.seconds,e.rest]).toEqual([6,20,40]);
  expect(p.reasons.join(' ')).toMatch(/Niveau 1 sur 4/);
  // L'aperçu revérifie chaque exercice au démarrage : il ne doit pas bloquer la séance.
  expect(p.exercises.every(x=>PT.allowed(x,s,p.check))).toBe(true);
});

test('course fractionnée : marche entre les efforts, parcours extérieur toujours disponible',()=>{
  const s=joueur({owned:['bodyweight']});
  const p=BC.plan(PT,JP,s,'run',{now:NOW});
  expect(p.error).toBeUndefined();
  expect(p.exercises[0].id).toBe('run-interval');
  expect([p.exercises[0].sets,p.exercises[0].seconds,p.exercises[0].rest]).toEqual([6,30,90]);
  expect(p.exercises.every(x=>PT.allowed(x,s,p.check))).toBe(true);
});

test('sans corde dans le matériel : version sans impact et message clair',()=>{
  const s=joueur({owned:['bodyweight','bike']});
  const p=BC.plan(PT,JP,s,'rope',{now:NOW});
  expect(p.error).toBeUndefined();
  expect(p.cardioSoft).toBe(true);
  expect(p.exercises[0].impact).toBeFalsy();
  expect(p.exercises[0].id).toBe('bike-interval');
  expect(p.reasons.join(' ')).toMatch(/corde/i);
});

test('remise en route ou douleur au bas du corps : aucun impact, la séance reste proposée',()=>{
  const s=joueur();
  const reset=BC.plan(PT,JP,s,'rope',{now:NOW,phase:'reset'});
  expect(reset.cardioSoft).toBe(true);
  expect(reset.exercises.some(e=>e.impact)).toBe(false);
  expect(reset.reasons.join(' ')).toMatch(/Remise en route/);
  const mal=joueur();
  mal.symptoms.push({id:'k',region:'knee',active:true,severity:3,date:NOW});
  const p=BC.plan(PT,JP,mal,'run',{now:NOW});
  expect(p.cardioSoft).toBe(true);
  expect(p.exercises.some(e=>e.impact)).toBe(false);
  expect(p.reasons.join(' ')).toMatch(/douleur/i);
});

test('douleur importante : pas de séance',()=>{
  const s=joueur();
  s.symptoms.push({id:'k',region:'knee',active:true,severity:8,date:NOW});
  expect(BC.plan(PT,JP,s,'rope',{now:NOW}).error).toMatch(/avis médical/);
});

test('étape 1 du parcours : allure facile, niveau plafonné à 2',()=>{
  const s=joueur({step:1});
  for(const d of ['2026-09-01','2026-09-03','2026-09-08','2026-09-10','2026-09-15','2026-09-17']) fait(s,'rope',d);
  expect(BC.levelOf(s,'rope','2026-09-20').level).toBe(3);
  const p=BC.plan(PT,JP,s,'rope',{now:'2026-09-20'});
  expect(p.cardioLevel).toBe(1);
  expect(p.reasons.join(' ')).toMatch(/Étape 1/);
});

test('progression : deux séances propres montent d’un niveau, une douleur ne compte pas, une pause de trois semaines redescend',()=>{
  const s=joueur();
  expect(BC.levelOf(s,'rope',NOW).level).toBe(0);
  fait(s,'rope','2026-10-01');
  expect(BC.levelOf(s,'rope',NOW).level).toBe(0);
  fait(s,'rope','2026-10-05');
  expect(BC.levelOf(s,'rope',NOW).level).toBe(1);
  // Une séance avec douleur : ne compte pas, et le niveau est signalé « gardé ».
  fait(s,'rope','2026-10-09',{pain:true});
  const held=BC.levelOf(s,'rope',NOW);
  expect(held.level).toBe(1);
  expect(held.held).toBe(true);
  // La course a sa propre progression.
  expect(BC.levelOf(s,'run',NOW).level).toBe(0);
  // Pause : plus de 21 jours depuis la dernière séance.
  expect(BC.levelOf(s,'rope','2026-11-20').level).toBe(0);
  expect(BC.levelOf(s,'rope','2026-11-20').lapsed).toBe(true);
});

test('planning : deux séances cardio par semaine, jamais deux jours de suite à impacts (vivacité comprise)',()=>{
  const s=joueur({step:3});
  s.seasonPlan={resetWeeks:0};
  const w=SP.weekSchedule(s,MONDAY,MONDAY),all=items(w),cardio=all.filter(x=>x.type==='cardio');
  expect(cardio.map(x=>x.kind).sort()).toEqual(['rope','run']);
  expect(cardio.every(x=>x.legs==='impact')).toBe(true);
  const impacts=all.filter(x=>x.legs==='impact').map(x=>x.day).sort((a,b)=>a-b);
  for(let i=1;i<impacts.length;i++) expect(impacts[i]-impacts[i-1],`impacts les jours ${impacts}`).toBeGreaterThanOrEqual(2);
  // Jamais le même jour que des jambes lourdes.
  for(const c of cardio) expect(all.some(x=>x.legs==='heavy'&&x.day===c.day)).toBe(false);
  expect(SP.violations(s,w)).toEqual([]);
});

test('semaine chargée (club, match) : le cardio reste au planning en version sans impact, jamais la veille du match',()=>{
  const s=joueur({step:3});
  s.seasonPlan={resetWeeks:0};
  s.basketProfile={matchDay:5,practiceDays:[1]};
  const w=SP.weekSchedule(s,MONDAY,MONDAY),cardio=items(w).filter(x=>x.type==='cardio');
  expect(w.warnings).toEqual([]);
  expect(cardio.length).toBe(2);
  expect(cardio.every(x=>x.soft&&x.legs==='light'&&/sans impact/.test(x.label))).toBe(true);
  expect(cardio.some(x=>x.day===5)).toBe(false); // pas le jour du match
  // Lancée depuis le calendrier : aucune corde ni course, un message qui explique pourquoi.
  const p=BC.plan(PT,JP,s,cardio[0].kind,{phase:cardio[0].phase,soft:cardio[0].soft});
  expect(p.exercises.some(e=>e.impact)).toBe(false);
  expect(p.reasons.join(' ')).toMatch(/Semaine chargée/);
  expect(SP.violations(s,w)).toEqual([]);
});

test('planning : en remise en route le cardio reste sans impact',()=>{
  const s=joueur({step:1});
  s.dossier=PD.saveChapter(s,'break',{layoffMonths:24,layoffReason:'work',dropped:[]}).dossier;
  const w=SP.weekSchedule(s,MONDAY,MONDAY);
  expect(w.phase.id).toBe('reset');
  const cardio=items(w).filter(x=>x.type==='cardio');
  expect(cardio.length).toBe(2);
  expect(cardio.every(x=>x.legs==='light')).toBe(true);
});

test('fréquence au choix : 0 retire le cardio, 1 alterne corde et course d’une semaine à l’autre',()=>{
  const s=joueur({step:3});s.seasonPlan={resetWeeks:0};
  s.cardio={perWeek:0};
  expect(items(SP.weekSchedule(s,MONDAY,MONDAY)).filter(x=>x.type==='cardio').length).toBe(0);
  s.cardio={perWeek:1};
  const a=items(SP.weekSchedule(s,MONDAY,MONDAY)).filter(x=>x.type==='cardio'),b=items(SP.weekSchedule(s,SP.at(MONDAY,7),SP.at(MONDAY,7))).filter(x=>x.type==='cardio');
  expect(a.length).toBe(1);expect(b.length).toBe(1);
  expect(a[0].kind).not.toBe(b[0].kind);
});

test('le joueur garde la main : déplacement avec alerte, retour au choix automatique',()=>{
  const s=joueur({step:3});s.seasonPlan={resetWeeks:0};
  const w=SP.weekSchedule(s,MONDAY,MONDAY),rope=items(w).find(x=>x.kind==='rope'),run=items(w).find(x=>x.kind==='run');
  // Mettre la course juste après la corde : refusé tel quel (impacts rapprochés ou jambes lourdes), accepté en connaissance de cause.
  const next=SP.at(rope.date,1);
  const refus=SP.reschedule(s,MONDAY,run.key,next);
  expect(refus.ok).toBe(false);
  expect(refus.canForce).toBe(true);
  expect(refus.why).toMatch(/48 heures|jambes lourdes|impacts/);
  const force=SP.reschedule(s,MONDAY,run.key,next,{force:true});
  expect(force.ok).toBe(true);
  const moved={...s,calendar:force.calendar};
  expect(items(SP.weekSchedule(moved,MONDAY,MONDAY)).find(x=>x.kind==='run').date).toBe(next);
  const back={...s,calendar:SP.unmove(moved,MONDAY,run.key)};
  expect(items(SP.weekSchedule(back,MONDAY,MONDAY)).find(x=>x.kind==='run').date).toBe(run.date);
});

test('séance faite : reconnue comme faite dans le planning, et la sauvegarde garde le réglage',()=>{
  const s=joueur({step:3});s.seasonPlan={resetWeeks:0};
  const w=SP.weekSchedule(s,MONDAY,MONDAY),rope=items(w).find(x=>x.kind==='rope');
  fait(s,'rope',rope.date);
  const after=items(SP.weekSchedule(s,MONDAY,MONDAY)).find(x=>x.kind==='rope');
  expect(after.status).toBe('done');
  s.cardio={perWeek:1};
  const back=PT.validateState(JSON.parse(JSON.stringify(s)));
  expect(back.cardio).toEqual({perWeek:1});
  const old=JSON.parse(JSON.stringify(s));delete old.cardio;
  expect(PT.validateState(old).cardio).toEqual({perWeek:2});
});

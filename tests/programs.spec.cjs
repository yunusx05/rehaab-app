/* Programmes muscu : restaurés au lot « soin, muscu basket » (tests moteur d'origine, sans la nutrition supprimée au lot 9). */
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const PP=require('../personal-programs.js');

function base({experience='regular',owned=['bodyweight','dumbbells','bench','bands']}={}){
  const data=PT.initialState();
  data.profile.onboarded=true;data.profile.name='Test';data.profile.experience=experience;data.profile.safeties=true;
  data.profile.age=30;data.profile.height=180;data.profile.weight=80;
  data.owned=owned;data.checkIn.equipment=owned;
  return data;
}
function withProgram(config={}){
  const data=base();
  const made=PP.createProgram(data,{familyId:'fit',weeks:8,daysPerWeek:3,minutes:30,equipment:data.owned,constraints:[],...config});
  if(made.error)throw new Error(made.error);
  data.program=made.program;return data;
}
async function seed(page,data,route='program'){
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('test-seeded','1');}},{data,key:PT.STORAGE_KEY});
  // Le premier rendu compile tout le JSX via Babel dans le navigateur : laisser le temps au montage.
  await page.goto('/#'+route);await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
// L'app regroupe ses écritures (250 ms) : on attend la sauvegarde avant de la lire.
async function state(page){await page.waitForTimeout(300);return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}

/* ---------- Catalogue d'exercices ---------- */

test('catalogue : identifiants uniques et schéma respecté sur chaque entrée',()=>{
  const ids=PT.catalog.map(e=>e.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(PT.catalog.length).toBeGreaterThan(180);
  const broken=PT.catalog.filter(e=>
    typeof e.name!=='string'||!e.name.trim()
    ||!PT.patterns[e.pattern]
    ||!['strength','cardio','basket','mobility','plyo'].includes(e.kind)
    ||!['reps','seconds','shots','contacts'].includes(e.measure)
    ||!Array.isArray(e.needs)||!e.needs.length||!e.needs.every(id=>PT.equipment.some(x=>x.id===id))
    ||!Array.isArray(e.regions)||!e.regions.every(r=>PT.regions[r])
    ||!Array.isArray(e.instructions)||e.instructions.length<2
    ||!PT.bounded(e.sets,1,8)||!PT.bounded(e.min,1,100)||!PT.bounded(e.max,e.min,100)
    ||!PT.bounded(e.rest,0,600)||!PT.bounded(e.seconds,1,3600)
  ).map(e=>e.id);
  expect(broken).toEqual([]);
});

test('catalogue : la répartition des mouvements couvre chaque pattern affiché dans la progression',()=>{
  const shown=['push','pull','squat','hinge','core','calf','arms'];
  const missing=shown.filter(p=>!PT.catalog.some(e=>e.pattern===p));
  expect(missing).toEqual([]);
  // Un exercice ne doit pas utiliser un pattern absent de la table des libellés.
  expect(PT.catalog.filter(e=>!PT.patterns[e.pattern]).map(e=>e.id)).toEqual([]);
});

test('catalogue : un exercice à charge déclare un matériel chargeable cohérent',()=>{
  const bad=PT.catalog.filter(e=>e.weighted&&!e.needs.includes(e.weighted)).map(e=>e.id);
  expect(bad).toEqual([]);
});

/* ---------- Modèle de programmes ---------- */

test('programmes : chaque famille se construit et produit une séance jouable',()=>{
  const data=base({owned:['bodyweight','dumbbells','bench','bands','kettlebell']});
  for(const family of PP.families){
    const made=PP.createProgram(data,{familyId:family.id,weeks:8,daysPerWeek:4,minutes:45,equipment:data.owned,constraints:[]});
    expect(made.error,`création ${family.id}`).toBeUndefined();
    const plan=PP.sessionPlan(made.program,1,made.program.days[0],data);
    expect(plan.error,`séance ${family.id}`).toBeUndefined();
    expect(plan.exercises.length).toBeGreaterThan(1);
    expect(plan.programInstanceId).toBe(made.program.id);
    expect(plan.exercises.every(e=>PT.allowed(e,data,plan.check))).toBe(true);
  }
});

test('programmes : la génération est déterministe à état égal',()=>{
  const data=withProgram();
  const a=PP.sessionPlan(data.program,3,data.program.days[1],data);
  const b=PP.sessionPlan(data.program,3,data.program.days[1],data);
  expect(a.exercises.map(e=>e.id)).toEqual(b.exercises.map(e=>e.id));
  expect(a.exercises.map(e=>e.sets)).toEqual(b.exercises.map(e=>e.sets));
});

test('programmes : le mouvement repère reste stable, les accessoires tournent',()=>{
  const data=withProgram({familyId:'bulk',weeks:8,daysPerWeek:3,minutes:45});
  const weeks=[1,2,3,5,6,7].map(w=>PP.sessionPlan(data.program,w,data.program.days[0],data));
  const anchors=weeks.map(p=>p.exercises.find(e=>e.slotRole==='anchor').id);
  expect(new Set(anchors).size).toBe(1);
  const accessories=weeks.map(p=>p.exercises.filter(e=>e.slotRole!=='anchor').map(e=>e.id).join(','));
  expect(new Set(accessories).size).toBeGreaterThan(1);
});

test('programmes : la durée estimée respecte le temps disponible',()=>{
  const data=base();
  for(const minutes of [15,30,60]){
    const made=PP.createProgram(data,{familyId:'fit',weeks:4,daysPerWeek:3,minutes,equipment:data.owned,constraints:[]});
    for(const day of made.program.days){
      const plan=PP.sessionPlan(made.program,1,day,data);
      expect(plan.error).toBeUndefined();
      expect(plan.estimatedMinutes,`${minutes} min / ${day}`).toBeLessThanOrEqual(minutes+2);
      expect(plan.exercises.length).toBeGreaterThan(0);
    }
  }
});

test('programmes : la semaine d’allègement réduit le volume sans changer les mouvements repères',()=>{
  const data=withProgram({familyId:'bulk',weeks:8,daysPerWeek:3,minutes:45});
  const build=PP.sessionPlan(data.program,3,data.program.days[0],data);
  const deload=PP.sessionPlan(data.program,4,data.program.days[0],data);
  expect(PP.phaseFor(4,8).id).toBe('deload');
  const anchorOf=p=>p.exercises.find(e=>e.slotRole==='anchor');
  expect(anchorOf(deload).id).toBe(anchorOf(build).id);
  expect(anchorOf(deload).sets).toBeLessThan(anchorOf(build).sets);
});

test('programmes : une douleur importante suspend création et lancement',()=>{
  const data=withProgram();
  data.symptoms=[{id:'s1',region:'knee',active:true,severity:8,date:PT.dateKey()}];
  expect(PP.createProgram(data,{familyId:'fit',weeks:4,daysPerWeek:3,minutes:30,equipment:data.owned,constraints:[]}).error).toBeTruthy();
  expect(PP.sessionPlan(data.program,1,data.program.days[0],data).error).toBeTruthy();
});

test('programmes : les zones douloureuses et les contraintes écartent les mouvements concernés',()=>{
  const data=withProgram();
  data.symptoms=[{id:'s1',region:'knee',active:true,severity:4,date:PT.dateKey()}];
  const check=PP.checkFor(data,data.program,{constraints:['no-floor','no-impact']});
  for(const day of data.program.days){
    const plan=PP.sessionPlan(data.program,1,day,data,check);
    if(plan.error)continue;
    // Hors soin, rien ne sollicite le genou ; le soin du genou, lui, respecte aussi les contraintes.
    expect(plan.exercises.some(e=>e.pathwayRole!=='soin'&&e.regions.includes('knee'))).toBe(false);
    expect(plan.exercises.some(e=>e.pathwayRole==='soin'&&e.careRegion==='knee')).toBe(true);
    expect(plan.exercises.some(e=>e.impact)).toBe(false);
    expect(plan.exercises.some(e=>e.floor)).toBe(false);
  }
});

test('programmes : un débutant ne reçoit aucun mouvement de niveau avancé',()=>{
  const data=base({experience:'beginner'});
  const made=PP.createProgram(data,{familyId:'fit',weeks:4,daysPerWeek:3,minutes:30,equipment:data.owned,constraints:[]});
  expect(made.error).toBeUndefined();
  for(const day of made.program.days){
    const plan=PP.sessionPlan(made.program,1,day,data);
    if(plan.error)continue;
    expect(plan.exercises.some(e=>e.level>1)).toBe(false);
  }
});

test('programmes : suivi, séance partielle et absence de doublon',()=>{
  const data=withProgram();
  let program=data.program;
  const first=PP.progressOf(program);
  expect(first.done).toBe(0);
  expect(first.currentWeek).toBe(1);
  program=PP.markCompleted(program,{week:1,day:program.days[0],sessionId:'a',date:PT.dateKey(),partial:true});
  program=PP.markCompleted(program,{week:1,day:program.days[0],sessionId:'b',date:PT.dateKey()});
  expect(program.completed.filter(c=>c.week===1&&c.day===program.days[0]).length).toBe(1);
  expect(PP.progressOf(program).done).toBe(1);
  program=PP.markCompleted(program,{week:1,day:program.days[1],sessionId:'c',date:PT.dateKey()});
  expect(PP.progressOf(program).nextDay).toBe(program.days[2]);
});

test('programmes : pause, reprise et archivage conservent l’avancement',()=>{
  const data=withProgram();
  let program=PP.markCompleted(data.program,{week:1,day:data.program.days[0],sessionId:'a',date:PT.dateKey()});
  const paused=PP.pause(program);
  expect(paused.status).toBe('paused');
  expect(PP.progressOf(paused).done).toBe(1);
  const resumed=PP.resume(paused);
  expect(resumed.status).toBe('active');
  expect(PP.progressOf(resumed).done).toBe(1);
  const archived=PP.archive(resumed);
  expect(archived.status).toBe('archived');
  expect(PP.progressOf(archived).done).toBe(1);
  expect(PP.validateProgram(archived).completed.length).toBe(1);
});

/* ---------- Persistance ---------- */

test('persistance : une ancienne sauvegarde sans programme reste valide',()=>{
  const old=PT.initialState();
  delete old.trash;delete old.program;delete old.programArchive;delete old.nutrition;
  old.sessions=[{id:'x',date:PT.dateKey(),title:'Ancienne séance',minutes:30,entries:{},exercises:[]}];
  const migrated=PT.validateState(old);
  expect(migrated.sessions.length).toBe(1);
  expect(migrated.program).toBe(null);
  expect(migrated.programArchive).toEqual([]);
  expect(Array.isArray(migrated.trash)).toBe(true);
  expect(migrated.programWeek).toBe(1);
});

test('persistance : export et import conservent le programme',()=>{
  const data=withProgram();
  data.trash=[{id:'t1',date:PT.dateKey(),title:'Retirée',minutes:10,entries:{},exercises:[]}];
  const back=PT.importBundle(JSON.stringify(PT.exportBundle(data)));
  expect(back.state.program.id).toBe(data.program.id);
  expect(back.state.program.completed).toEqual([]);
  expect(back.state.trash.length).toBe(1);
});

test('persistance : un programme corrompu est refusé plutôt qu’accepté en silence',()=>{
  const data=withProgram();
  const broken=PT.clone(data);broken.program.familyId='inconnu';
  expect(()=>PT.validateState(broken)).toThrow();
  const badWeek=PT.clone(data);badWeek.program.completed=[{week:99,day:badWeek.program.days[0],date:PT.dateKey()}];
  expect(()=>PT.validateState(badWeek)).toThrow();
});


test('check-in : le score détermine le niveau, une réponse manquante ne dégrade rien',()=>{
  expect(PP.readinessLevel({energy:0,sleep:0,soreness:0}).id).toBe('spent');
  expect(PP.readinessLevel({energy:1,sleep:1,soreness:1}).id).toBe('low');
  expect(PP.readinessLevel({energy:2,sleep:1,soreness:1}).id).toBe('normal');
  expect(PP.readinessLevel({energy:2,sleep:2,soreness:2}).id).toBe('high');
  const partial=PP.readinessLevel({energy:0});
  expect(partial.id).toBe('normal');expect(partial.complete).toBe(false);
  expect(PP.readinessLevel({energy:9,sleep:2,soreness:2}).complete).toBe(false);
});

test('check-in : la durée ne dépasse ni le programme ni le temps annoncé, et reste au-dessus de 10 min',()=>{
  const spent=PP.readinessById('spent'),normal=PP.readinessById('normal');
  expect(PP.readinessMinutes(normal,45,60)).toBe(45);
  expect(PP.readinessMinutes(normal,45,20)).toBe(20);
  expect(PP.readinessMinutes(spent,45,60)).toBe(25);
  expect(PP.readinessMinutes(spent,15,60)).toBe(10);
});

test('check-in : réserve basse allège la séance sans perdre les mouvements repères',()=>{
  const data=withProgram({minutes:45});
  const full=PP.sessionPlan(data.program,1,data.program.days[0],data,
    PP.checkForSession(data,data.program,{answers:{energy:2,sleep:2,soreness:2},minutes:60}));
  const light=PP.sessionPlan(data.program,1,data.program.days[0],data,
    PP.checkForSession(data,data.program,{answers:{energy:0,sleep:0,soreness:0},minutes:60}));
  expect(full.error).toBeUndefined();expect(light.error).toBeUndefined();
  expect(light.exercises.length).toBeLessThanOrEqual(full.exercises.length);
  expect(light.exercises.length).toBeLessThanOrEqual(3);
  expect(light.estimatedMinutes).toBeLessThanOrEqual(full.estimatedMinutes);
  expect(light.exercises[0].rest).toBeGreaterThan(full.exercises[0].rest);
  // Les mouvements repères de la séance complète survivent à la version courte.
  const anchors=full.exercises.filter(e=>e.slotRole==='anchor').map(e=>e.id);
  anchors.forEach(id=>expect(light.exercises.some(e=>e.id===id)).toBe(true));
  expect(light.readiness.id).toBe('spent');
  expect(light.reasons.some(r=>r.includes('Check-in du jour'))).toBe(true);
});

test('check-in : aucune charge ni série ajoutée quand la forme est bonne',()=>{
  const data=withProgram({minutes:45});
  const normal=PP.sessionPlan(data.program,1,data.program.days[0],data,
    PP.checkForSession(data,data.program,{answers:{energy:2,sleep:1,soreness:1},minutes:45}));
  const high=PP.sessionPlan(data.program,1,data.program.days[0],data,
    PP.checkForSession(data,data.program,{answers:{energy:2,sleep:2,soreness:2},minutes:45}));
  expect(high.exercises.length).toBe(normal.exercises.length);
  high.exercises.forEach((e,i)=>{
    expect(e.sets).toBeLessThanOrEqual(normal.exercises[i].sets);
    expect(e.targetMax).toBeLessThanOrEqual(normal.exercises[i].targetMax||e.targetMax);
  });
});


/* ---------- Muscu basket, « Mon jeu » et charge commune ---------- */
const JP=require('../player-profile.js');
const BP=require('../basket-pathway.js');
const C=require('../basket-profile.js');
const TL=require('../training-load.js');
const shift=n=>PT.dateKey(new Date(Date.now()+n*864e5));
function basketPlayer(court={weaknesses:['contact','engine'],feelings:['back']}){
  const data=base({owned:['bodyweight','dumbbells','bench','bands','kettlebell','pullup','court']});
  data.player=JP.validatePlayer({position:'pivot',archetypes:[],layoff:'long'});
  data.basketProfile=court?C.save(court):null;
  return data;
}
function basketProgram(data){
  const made=PP.createProgram(data,{familyId:'basket',weeks:8,daysPerWeek:3,minutes:45,equipment:data.owned,constraints:[]});
  if(made.error)throw new Error(made.error);
  data.program=made.program;return data;
}

test('mon jeu : réponses nettoyées, faiblesses en priorité, anciennes sauvegardes valides',()=>{
  const clean=C.validate({weaknesses:['contact','contact','inconnu','engine','finish','rebound'],strengths:['contact','handle'],practiceDays:[1,5,9],matchDay:5,feelings:['back','x']});
  expect(clean.weaknesses).toEqual(['contact','engine','finish']);
  expect(clean.strengths).toEqual(['handle']);
  expect(clean.practiceDays).toEqual([1]);
  expect(clean.feelings).toEqual(['back']);
  const ranked=JP.priorities({position:'meneur',archetypes:[],court:C.save({weaknesses:['contact']})}).map(q=>q.id);
  expect(ranked[0]).toBe('contact');
  const old=PT.initialState();delete old.basketProfile;
  expect(PT.validateState(old).basketProfile).toBeNull();
});

test('muscu basket : accent tiré des faiblesses, aucun saut, séance jouable chaque jour',()=>{
  const data=basketProgram(basketPlayer());
  for(const day of data.program.days){
    const plan=PP.sessionPlan(data.program,1,day,data);
    expect(plan.error,day).toBeUndefined();
    expect(plan.exercises.some(e=>e.impact||e.kind==='plyo')).toBe(false);
    expect(plan.exercises.filter(e=>e.courtFocus)).toHaveLength(1);
    expect(plan.reasons.join(' ')).toContain('Accent « Mon jeu »');
  }
  // Sans questionnaire : pas d'accent, séance identique au modèle.
  const plain=basketProgram(basketPlayer(null));
  expect(PP.sessionPlan(plain.program,1,'A',plain).exercises.some(e=>e.courtFocus)).toBe(false);
});

test('charge commune : veille de match = pas de jambes lourdes en muscu ni de sauts au parcours',()=>{
  const data=basketProgram(basketPlayer({weaknesses:['rebound'],matchDay:TL.weekday(shift(1))}));
  data.pathway={...BP.create(),step:3};
  const today=TL.day(data);
  expect(today.protectLegs).toBe(true);
  expect(today.primary).toBe('muscu');
  for(const day of data.program.days){
    const plan=PP.sessionPlan(data.program,1,day,data);
    expect(plan.exercises.filter(e=>e.pathwayRole!=='soin').some(TL.legHeavy)).toBe(false);
  }
  const pathway=BP.sessionPlan(PT,JP,data,data.pathway,'A');
  expect(pathway.exercises.some(e=>e.impact)).toBe(false);
  expect(PT.todayPlan(data).action).toBe('program');
});

test('charge commune : jour de match = échauffement, parcours fait = complément court du haut du corps',()=>{
  const match=basketProgram(basketPlayer({weaknesses:['engine'],matchDay:TL.weekday(PT.dateKey())}));
  expect(PT.todayPlan(match)).toMatchObject({kind:'match',action:'warmup'});
  const data=basketProgram(basketPlayer());data.pathway=BP.create();
  const legs=PT.catalog.find(e=>e.id==='goblet'),hinge=PT.catalog.find(e=>e.id==='rdl');
  data.sessions.push({id:'p1',date:PT.dateKey(),title:'Parcours',source:'pathway',focus:'muscle',format:'classic',minutes:40,effort:6,exercises:[legs,hinge],entries:{goblet:[{done:true}],rdl:[{done:true}]},completedAt:new Date().toISOString(),partial:false});
  const day=TL.day(data);
  expect(day).toMatchObject({primary:'muscu',protectLegs:true,maxMinutes:30});
  expect(PT.todayPlan(data).action).toBe('program');
  const plan=PP.sessionPlan(data.program,1,'B',data,PP.checkFor(data,data.program));
  expect(plan.estimatedMinutes).toBeLessThanOrEqual(31);
  expect(plan.exercises.filter(e=>e.pathwayRole!=='soin').some(TL.legHeavy)).toBe(false);
});

test('muscu basket : une douleur ajoute le soin de la zone au programme',()=>{
  const data=basketProgram(basketPlayer());
  data.symptoms=[{id:'s',region:'shoulder',severity:3,active:true,date:PT.dateKey(),side:'right',onset:'new'}];
  const plan=PP.sessionPlan(data.program,1,'A',data);
  expect(plan.exercises[0].pathwayRole).toBe('soin');
  expect(plan.exercises[plan.exercises.length-1].pathwayRole).toBe('soin');
  expect(plan.reasons.join(' ')).toContain('Soin intégré');
});

for(const width of [320,390])test(`mon jeu puis ma muscu depuis le parcours, sans débordement à ${width}px`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:900});
  const data=basketPlayer(null);data.pathway=BP.create();
  await seed(page,data,'pathway');
  await page.getByRole('button',{name:/Mon jeu/}).first().click();
  await expect(page.getByRole('heading',{name:'Mon jeu.'})).toBeVisible();
  await page.locator('.coach-q',{hasText:'Où es-tu en difficulté'}).getByRole('button',{name:/Tenir au contact/}).click();
  await page.locator('.coach-q',{hasText:'Entraînements au club'}).getByRole('button',{name:'Mar',exact:true}).click();
  await page.locator('.coach-q',{hasText:'Jour de match'}).getByRole('button',{name:'Sam',exact:true}).click();
  await expect(page.locator('.notice')).toContainText('Faiblesses : tenir au contact');
  await noOverflow(page);
  await page.getByRole('button',{name:/Enregistrer mon jeu/}).click();
  let saved=await state(page);
  expect(saved.basketProfile).toMatchObject({weaknesses:['contact'],practiceDays:[1],matchDay:5});
  await page.getByRole('button',{name:/Ma muscu/}).first().click();
  await expect(page.getByRole('heading',{name:'Créer ma muscu.'})).toBeVisible();
  await page.getByRole('button',{name:/Basket · force complémentaire/}).click();
  await page.getByRole('button',{name:'Créer ce programme'}).click();
  await expect(page.getByRole('heading',{name:'Ma muscu.'})).toBeVisible();
  await expect(page.getByText('Aujourd’hui, avec le reste de ta semaine')).toBeVisible();
  await noOverflow(page);
  saved=await state(page);
  expect(saved.program.familyId).toBe('basket');
  await page.getByRole('button',{name:/Lancer cette séance/}).first().click();
  await page.getByRole('button',{name:'En forme',exact:true}).click();
  await page.getByRole('button',{name:'Bonne',exact:true}).click();
  await page.getByRole('button',{name:'Aucune',exact:true}).click();
  await page.getByRole('button',{name:/Voir ma séance du jour/}).click();
  await expect(page.getByRole('button',{name:'Démarrer la séance'})).toBeVisible();
  await expect(page.locator('.role-tag',{hasText:'Priorité terrain'})).toHaveCount(1);
  expect(errors).toEqual([]);
});

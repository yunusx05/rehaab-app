const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const PP=require('../personal-programs.js');
const PN=require('../personal-nutrition.js');

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
async function state(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}
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
    expect(plan.exercises.some(e=>e.regions.includes('knee'))).toBe(false);
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

test('persistance : export et import conservent programme et repères nutritionnels',()=>{
  const data=withProgram();
  data.nutrition={...PN.initialNutrition(),bodyType:'male',activity:'moderate',goal:'lose'};
  data.trash=[{id:'t1',date:PT.dateKey(),title:'Retirée',minutes:10,entries:{},exercises:[]}];
  const back=PT.importBundle(JSON.stringify(PT.exportBundle(data)));
  expect(back.state.program.id).toBe(data.program.id);
  expect(back.state.program.completed).toEqual([]);
  expect(back.state.nutrition.goal).toBe('lose');
  expect(back.state.trash.length).toBe(1);
});

test('persistance : un programme corrompu est refusé plutôt qu’accepté en silence',()=>{
  const data=withProgram();
  const broken=PT.clone(data);broken.program.familyId='inconnu';
  expect(()=>PT.validateState(broken)).toThrow();
  const badWeek=PT.clone(data);badWeek.program.completed=[{week:99,day:badWeek.program.days[0],date:PT.dateKey()}];
  expect(()=>PT.validateState(badWeek)).toThrow();
});

/* ---------- Nutrition ---------- */

test('nutrition : estimation cohérente et sans double comptage de la dépense sportive',()=>{
  const input={weight:80,height:180,age:30,bodyType:'male',activity:'sedentary',goal:'maintain',weeklySessions:0,minutesPerSession:0};
  const still=PN.estimate(input);
  const active=PN.estimate({...input,weeklySessions:4,minutesPerSession:45});
  expect(still.ok&&active.ok).toBe(true);
  expect(still.training).toBe(0);
  expect(active.training).toBeGreaterThan(0);
  expect(active.total-still.total).toBe(active.training);
  expect(still.resting).toBeLessThan(still.daily);
  const lose=PN.estimate({...input,goal:'lose'}),gain=PN.estimate({...input,goal:'gain'});
  expect(lose.target).toBeLessThan(still.total);
  expect(gain.target).toBeGreaterThan(still.total);
  expect(lose.target).toBeGreaterThanOrEqual(lose.resting*0.8);
});

test('nutrition : entrées manquantes ou hors bornes ne produisent aucune cible',()=>{
  expect(PN.estimate({}).ok).toBe(false);
  expect(PN.estimate({weight:80,height:180,age:30}).ok).toBe(false);
  expect(PN.estimate({weight:900,height:180,age:30,bodyType:'male',activity:'moderate',goal:'lose'}).ok).toBe(false);
  expect(PN.estimate({weight:80,height:180,age:30,bodyType:'inconnu',activity:'moderate',goal:'lose'}).ok).toBe(false);
  expect(()=>PN.validateNutrition({activity:'inconnu'})).toThrow();
  expect(()=>PN.validateNutrition({weeklySessions:99})).toThrow();
  expect(PN.validateNutrition(null).goal).toBe('');
});

test('nutrition : garde-fous mineur, grossesse, suivi médical et poids bas',()=>{
  const ok={weight:80,height:180,age:30,bodyType:'male',activity:'moderate',goal:'lose',weeklySessions:3,minutesPerSession:45};
  for(const variant of [{age:15},{pregnancy:true},{medicalFollowUp:true},{weight:55}]){
    const result=PN.estimate({...ok,...variant});
    expect(result.ok,JSON.stringify(variant)).toBe(false);
    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.target).toBeUndefined();
  }
});

test('nutrition : l’horizon reste une fourchette, jamais une date',()=>{
  const result=PN.estimate({weight:85,height:180,age:30,bodyType:'male',activity:'moderate',goal:'lose',weeklySessions:3,minutesPerSession:45});
  const horizon=PN.horizon(result,85,78);
  expect(horizon.low).toBeLessThan(horizon.high);
  expect(horizon.text).toContain('semaines');
  expect(horizon.text).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  // Un objectif incohérent avec la cible calorique ne renvoie pas de délai.
  expect(PN.horizon(result,85,95).weeks).toBeUndefined();
});

/* ---------- Parcours dans l'application ---------- */

for(const width of [320,390,430,1280])test(`programme : création au poids du corps sans débordement à ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await seed(page,base({owned:['bodyweight']}),'program-new');
  await expect(page.getByRole('heading',{name:'Créer un programme.'})).toBeVisible();
  await page.getByRole('button',{name:/Fit · forme générale/}).click();
  await expect(page.getByText(/créneaux sur/)).toBeVisible();
  await noOverflow(page);
  await page.getByRole('button',{name:'Créer ce programme'}).click();
  await expect(page.getByRole('heading',{name:'Mon programme.'})).toBeVisible();
  const data=await state(page);
  expect(data.program.familyId).toBe('fit');
  expect(data.program.equipment).toContain('bodyweight');
  await noOverflow(page);
});

test('programme : créer avec haltères, lancer une séance, l’enregistrer et retrouver le suivi après rechargement',async({page})=>{
  await seed(page,base(),'program-new');
  await page.getByRole('button',{name:/Bulk · prise de muscle/}).click();
  await page.getByRole('button',{name:'Créer ce programme'}).click();
  await expect(page.getByRole('heading',{name:'Mon programme.'})).toBeVisible();
  await expect(page.getByText('Semaine 1 sur 8')).toBeVisible();

  await page.getByRole('button',{name:/Lancer cette séance/}).first().click();
  await expect(page.locator('.visual-preview')).toBeVisible();
  const draft=await state(page);
  expect(draft.draft.programInstanceId).toBe(draft.program.id);
  expect(draft.draft.programWeekIndex).toBe(1);

  await page.getByRole('button',{name:/Commencer|Démarrer/}).first().click();
  await expect(page.locator('.personal-app.is-live')).toBeVisible();

  // Enregistrer une seule série suffit : une séance partielle doit compter comme faite.
  await page.evaluate(()=>window.scrollTo(0,0));
  const before=await state(page);
  expect(before.program.completed.length).toBe(0);
  await page.reload();
  const kept=await state(page);
  expect(kept.draft.status).toBe('active');
  expect(kept.program.id).toBe(before.program.id);
});

test('programme : consulter une autre semaine ne valide rien et ne touche pas au programme basket',async({page})=>{
  await seed(page,withProgram(),'program');
  const start=await state(page);
  await page.getByRole('button',{name:'Semaine suivante'}).click();
  await expect(page.getByText('S2')).toBeVisible();
  const after=await state(page);
  expect(after.program.completed).toEqual(start.program.completed);
  expect(after.programWeek).toBe(1);
  expect(after.draft).toBe(null);
});

test('programme : pause puis reprise, et le programme basket reste accessible à part',async({page})=>{
  await seed(page,withProgram(),'program');
  await page.getByRole('button',{name:/Mettre en pause/}).click();
  await expect(page.getByText(/Programme en pause/)).toBeVisible();
  expect((await state(page)).program.status).toBe('paused');
  await page.getByRole('button',{name:/Reprendre/}).first().click();
  expect((await state(page)).program.status).toBe('active');

  await page.getByRole('button',{name:/Programme basket d’origine/}).click();
  await expect(page.getByRole('heading',{name:'Mon programme basket.'})).toBeVisible();
  expect((await state(page)).programWeek).toBe(1);
});

test('programme : archiver conserve l’avancement et permet de reprendre',async({page})=>{
  const data=withProgram();
  data.program=PP.markCompleted(data.program,{week:1,day:data.program.days[0],sessionId:'a',date:PT.dateKey()});
  await seed(page,data,'program');
  await page.getByRole('button',{name:'Archiver ce programme'}).click();
  await page.getByRole('button',{name:'Confirmer l’archivage'}).click();
  await expect(page.getByRole('heading',{name:'Mes programmes.'})).toBeVisible();
  const archived=await state(page);
  expect(archived.program).toBe(null);
  expect(archived.programArchive.length).toBe(1);
  expect(archived.programArchive[0].completed.length).toBe(1);

  await page.locator('summary',{hasText:'Programmes archivés'}).click();
  await page.getByRole('button',{name:'Reprendre'}).first().click();
  const resumed=await state(page);
  expect(resumed.program.status).toBe('active');
  expect(resumed.program.completed.length).toBe(1);
  expect(resumed.programArchive.length).toBe(0);
});

test('nutrition : l’écran affiche une estimation, ses hypothèses et refuse une cible hors cadre',async({page})=>{
  await seed(page,base(),'nutrition');
  await expect(page.getByRole('heading',{name:'Mes repères caloriques.'})).toBeVisible();
  await page.getByLabel('Formule de calcul').selectOption('male');
  await page.getByLabel('Mon activité hors séances').selectOption('moderate');
  await page.getByLabel('Mon objectif').selectOption('lose');
  await expect(page.getByText('kcal à manger')).toBeVisible();
  await page.locator('summary',{hasText:'Les hypothèses du calcul'}).click();
  await expect(page.getByText(/n’est comptée qu’une fois/)).toBeVisible();
  await noOverflow(page);

  await page.getByLabel(/Je suis enceinte/).check();
  await expect(page.getByText(/Grossesse ou allaitement déclaré/)).toBeVisible();
  await expect(page.getByText('kcal à manger')).toHaveCount(0);

  await page.getByLabel(/Je suis enceinte/).uncheck();
  await page.getByRole('button',{name:'Enregistrer ces repères'}).click();
  expect((await state(page)).nutrition.goal).toBe('lose');
});

test('programme : le raccourci d’accueil mène au programme et le clavier suffit',async({page})=>{
  await seed(page,withProgram(),'today');
  const shortcut=page.locator('.home-shortcuts button').first();
  await expect(shortcut).toContainText('semaine 1/8');
  await shortcut.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:'Mon programme.'})).toBeVisible();
  await noOverflow(page);
});

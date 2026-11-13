const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const BP=require('../basket-pathway.js');
const PP=require('../personal-programs.js');
const SK=require('../basket-skills.js');
const TL=require('../training-load.js');

const home=['bodyweight','dumbbells','bench','bands','pullup','court'];
const weak={weakHand:0,eyesUp:0,pressure:0,moves:1,speedDribble:1,catchShoot:1,pullup:0,freeThrow:2,range:0,onMove:1,weakFinish:0,contactFinish:1,floater:1,footFinish:1,explosive:1,tripleThreat:1,stops:2};
function player(skills=true){
  const data=PT.initialState();
  data.profile.onboarded=true;data.profile.name='Test';data.profile.experience='returning';
  data.owned=home;data.checkIn.equipment=home;
  data.player=JP.validatePlayer({position:'meneur',archetypes:[],layoff:'long'});
  if(skills)data.skills=SK.saveProfile(null,{answers:weak,tests:{freeThrows:15,spotShooting:12}});
  return data;
}
async function seed(page,data,route){
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('test-seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.goto('/#'+route);await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
async function state(page){await page.waitForTimeout(300);return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}

test('skills : fiches courtes, identifiants uniques, hors du catalogue physique',()=>{
  expect(SK.drills.filter(d=>d.instructions.length>3||d.instructions.some(l=>l.split(/\s+/).length>12)).map(d=>d.id)).toEqual([]);
  const ids=SK.drills.map(d=>d.id);expect(new Set(ids).size).toBe(ids.length);
  expect(ids.some(id=>PT.catalog.some(e=>e.id===id))).toBe(false);
  expect(PT.catalog.some(e=>e.kind==='skill')).toBe(false);
  for(const area of Object.keys(SK.areas))for(const tier of [1,2,3])expect(SK.drills.some(d=>d.area===area&&d.tier===tier),`${area} ${tier}`).toBe(true);
});

test('skills : questionnaire → paliers, les tests de tir corrigent le palier du tir',()=>{
  const s=player().skills;
  expect(s.levels.handle).toBe(1);
  expect(SK.saveProfile(null,{answers:{...weak,catchShoot:2,pullup:2,freeThrow:2,range:2,onMove:2},tests:{freeThrows:6,spotShooting:5}}).levels.shoot).toBe(1);
  expect(SK.saveProfile(null,{answers:{...weak,catchShoot:2,pullup:2,freeThrow:2,range:2,onMove:2}}).levels.shoot).toBe(3);
  expect(SK.priorities(s,{position:'meneur'})[0].area).toBe('handle');
  expect(PT.validateState({...PT.initialState(),skills:undefined}).skills).toBeNull();
});

test('skills : séance à la durée choisie, panier = tir puis lancers francs, sans panier = rien au panier',()=>{
  const data=player();
  const noHoop=SK.session(PT,data,{minutes:45});
  expect(noHoop.exercises.some(e=>e.needs.includes('hoop'))).toBe(false);
  expect(noHoop.estimatedMinutes).toBeGreaterThanOrEqual(35);expect(noHoop.estimatedMinutes).toBeLessThanOrEqual(46);
  data.skills.hoopDate=PT.dateKey();
  const withHoop=SK.session(PT,data,{minutes:60});
  expect(withHoop.exercises.some(e=>e.measure==='shots')).toBe(true);
  expect(withHoop.exercises[withHoop.exercises.length-1].id).toBe('sk-ft');
  expect(withHoop.estimatedMinutes).toBeLessThanOrEqual(61);
  const light=SK.session(PT,data,{minutes:45,light:true});
  expect(light.exercises.some(e=>e.impact||e.cuts)).toBe(false);
  // Douleur au poignet : plus aucun exercice qui le sollicite.
  data.symptoms=[{id:'w',region:'wrist',severity:3,active:true,date:PT.dateKey(),side:'right',onset:'new'}];
  expect(SK.session(PT,data,{minutes:30}).exercises?.some(e=>e.regions.includes('wrist'))??false).toBe(false);
});

test('skills : blocs après muscu haut du corps, footing et jambes ; rien les jours de club',()=>{
  const data=player();data.skills.hoopDate=PT.dateKey();
  const upper=SK.block(PT,data,{exercises:[{id:'db-press',pattern:'push'},{id:'db-row',pattern:'pull'}]});
  expect(new Set(upper.exercises.map(e=>e.area))).toEqual(new Set(['handle','shoot']));
  const cardio=SK.block(PT,data,{exercises:[{id:'run',pattern:'cardio'}]});
  // Lot 31 : le dribble ouvre toujours le bloc, la finition suit.
  expect(cardio.exercises[0].area).toBe('handle');expect(cardio.exercises.some(e=>e.area==='finish')).toBe(true);
  const legs=SK.block(PT,data,{exercises:[{pattern:'squat'},{pattern:'hinge'}]});
  expect(legs.exercises.some(e=>e.impact||e.cuts)).toBe(false);
  data.program=PP.createProgram(data,{familyId:'basket',weeks:8,daysPerWeek:3,minutes:45,equipment:data.owned}).program;
  const muscu=PP.sessionPlan(data.program,1,'A',data);
  expect(muscu.exercises.filter(e=>e.skillBlock).length).toBeGreaterThan(1);
  expect(muscu.reasons.join(' ')).toContain('Bloc skills');
  data.basketProfile=require('../basket-profile.js').save({weaknesses:['engine'],practiceDays:[TL.weekday(PT.dateKey())]});
  expect(PP.sessionPlan(data.program,1,'A',data).exercises.some(e=>e.skillBlock)).toBe(false);
  expect(TL.day(data).skills).toBe('none');
});

test('skills : progression par les tirs et le ressenti, redescente si trop dur',()=>{
  let s=player().skills;s.levels.shoot=2;
  const sess=(made)=>({id:PT.uid(),date:PT.dateKey(),exercises:[{id:'sk-catch-3',skillArea:'shoot',measure:'shots'}],entries:{'sk-catch-3':[{done:true,made,attempts:25}]}});
  // Lot 40 : une seule séance « trop facile » (≥ 70 %) suffit pour monter.
  let r=SK.record(s,sess(15));expect(r.changes).toEqual([]);
  r=SK.record(r.skills,sess(19));expect(r.skills.levels.shoot).toBe(3);
  // Tirs validés sans nombre de réussis : ne comptent pas.
  const blank=SK.record(r.skills,{...sess(''),entries:{'sk-catch-3':[{done:true,made:'',attempts:25,later:true}]}});expect(blank.skills.log.slice(-1)[0].attempts).toBe(0);
  r=SK.record(r.skills,{...sess(10)},{shoot:'hard'});r=SK.record(r.skills,sess(8),{shoot:'hard'});
  expect(r.skills.levels.shoot).toBe(2);
});

test('skills : jour sans physique possible = séance skills proposée, jamais le jour de match',()=>{
  const data=player();data.profile.weeklyTarget=1;
  data.sessions.push({id:'x',date:PT.dateKey(),title:'Muscu',source:'program-plan',minutes:40,effort:6,exercises:[],entries:{},completedAt:'',partial:false});
  const tomorrow=PT.dateKey(new Date(Date.now()+864e5));
  expect(PT.todayPlan(data,tomorrow).action).toBe('skills');
  data.basketProfile=require('../basket-profile.js').save({weaknesses:['engine'],matchDay:TL.weekday(tomorrow)});
  expect(PT.todayPlan(data,tomorrow).action).toBe('warmup');
});

for(const width of [320,390])test(`skills : questionnaire, séance avec panier, tirs notés, sans débordement à ${width}px`,async({page})=>{
  test.setTimeout(90000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:900});
  const data=player(false);data.pathway=BP.create();
  await seed(page,data,'pathway');
  await page.getByRole('button',{name:/Mes skills basket/}).first().click();
  await page.getByRole('button',{name:/Faire le questionnaire/}).click();
  await expect(page.getByRole('heading',{name:'Où en es-tu ?'})).toBeVisible();
  for(const [id,v] of Object.entries(SK.items)){const label=SK.ratings[weak[id]??1][1];await page.locator('.coach-q',{hasText:v.label}).getByRole('button',{name:label,exact:true}).click();}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:/Calculer mes paliers/}).click();
  await expect(page.getByRole('heading',{name:'Mes skills.'})).toBeVisible();
  let saved=await state(page);
  expect(saved.skills.levels.handle).toBe(1);
  await page.getByLabel('J’ai un panier aujourd’hui').check();
  await page.getByRole('button',{name:/Lancer une séance skills/}).click();
  await page.getByRole('button',{name:'Rien à signaler'}).click();
  await expect(page.getByRole('button',{name:'Démarrer la séance'})).toBeVisible();
  saved=await state(page);
  expect(saved.draft.source).toBe('skills');
  expect(saved.draft.exercises.some(e=>e.needs.includes('hoop'))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  // Retirer le panier dans l'aperçu reconstruit la séance sans exercice au panier.
  await page.getByLabel(/J’ai un panier aujourd’hui/).uncheck();
  saved=await state(page);
  expect(saved.draft.exercises.some(e=>e.needs.includes('hoop'))).toBe(false);
  expect(errors).toEqual([]);
});

test('skills : la bibliothèque les montre dans l’onglet Basket',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await seed(page,player(),'library');
  await page.getByRole('button',{name:'Basket',exact:true}).click();
  const n=Number((await page.locator('.library-count').innerText()).match(/\d+/)[0]);
  expect(n).toBeGreaterThanOrEqual(SK.drills.length);
});

test('lot 40 : gêne à 1/10 : les finitions et le travail des jambes restent proposés ; séance finie sous fatigue',()=>{
  const data=player();data.symptoms=[{id:'k',region:'knee',severity:1,active:true,side:'right',onset:'known',redFlags:false,note:'',date:PT.dateKey(),followups:[]}];
  data.skills.levels={handle:2,coordination:2,shoot:2,finish:3,footwork:2,defense:2,moves:2};data.skills.hoopDate=PT.dateKey();
  expect(SK.painRegions(data)).toEqual([]);
  expect(SK.pick(data,{area:'finish',count:5,hoop:true}).length).toBeGreaterThan(2);
  const plan=SK.session(PT,data,{minutes:60});
  expect(plan.error).toBeUndefined();
  expect(plan.exercises.some(e=>e.tiredFinisher)).toBe(true);
  // Vraie douleur (4/10) : la zone est de nouveau protégée.
  data.symptoms[0].severity=4;expect(SK.painRegions(data)).toEqual(['knee']);
});

test('lot 40 : réussis notés en fin de séance, répartis sur les séries faites',()=>{
  const d={entries:{a:[{done:true,attempts:'10',made:'',later:true},{done:true,attempts:'10',made:'',later:true},{done:false,attempts:'10',made:''}]}};
  const out=SK.applyShotTotals(d,{a:'13'});
  expect(out.entries.a.map(r=>r.made)).toEqual(['10','3','']);
  expect(PT.validateRow({attempts:'10',made:'',later:true},{measure:'shots'})).toBe('');
  expect(PT.validateRow({attempts:'10',made:''},{measure:'shots'})).not.toBe('');
});

test('lot 40 : fin de séance skills : « Tes tirs » se remplit une fois, les réussis sont enregistrés',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  const data=player();data.skills.hoopDate=PT.dateKey();
  const plan=SK.session(PT,data,{minutes:45});
  const shot=plan.exercises.find(e=>e.measure==='shots');expect(shot).toBeTruthy();
  const d=PT.startDraft(plan,data);
  Object.values(d.entries).forEach(rows=>rows.forEach(r=>{r.done=true;}));
  d.entries[shot.id]=d.entries[shot.id].map(r=>({...r,done:true,attempts:'10',made:'',later:true}));
  Object.assign(d,{ready:true,warmupDone:true,reviewing:true,clockStarted:null,stageStarted:null,elapsedBase:1800,timer:null,cooldownDone:true});
  data.draft=d;
  await seed(page,data,'session');
  const total=d.entries[shot.id].length*10;
  const input=page.getByLabel(new RegExp(`Tirs réussis, .*sur ${total}`)).first();
  await expect(input).toBeVisible();
  await input.fill(String(total+5));
  await page.getByRole('button',{name:'Effort 6 sur 10'}).click();
  await page.getByRole('button',{name:/Enregistrer ma séance/}).click();
  await expect(page.getByText(/entre 0 et le nombre de tirs tentés/)).toBeVisible();
  await input.fill('7');
  await page.getByRole('button',{name:/Enregistrer ma séance/}).click();
  await page.waitForTimeout(800);
  const saved=await state(page);
  const s=saved.sessions.slice(-1)[0];
  expect(s.entries[shot.id].reduce((n,r)=>n+(Number(r.made)||0),0)).toBe(7);
  expect(errors).toEqual([]);
});

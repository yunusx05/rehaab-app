// Lot 31 : retours terrain — pluie, sable, sangle abdominale, skills / séance de tir, recommencer au jour 1, Fondations sans remise en route.
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const BP=require('../basket-pathway.js');
const JP=require('../player-profile.js');
const SP=require('../season-plan.js');
const BC=require('../basket-cardio.js');
const SK=require('../basket-skills.js');
const CORE=require('../basket-core.js');

const MONDAY='2026-10-12';
const items=w=>w.days.flatMap(d=>d.items.map(x=>({...x,day:d.weekday})));
function joueur(owned=['bodyweight','dumbbells','bands','kettlebell','bench','pullup','ball','rope']){
  const s=PT.initialState();s.profile.onboarded=true;s.profile.experience='regular';s.owned=owned;s.checkIn.equipment=owned;
  s.pathway=BP.create({startStep:1,now:'2026-10-05'});return s;
}

test('pluie : rien de ce qui se fait dehors, cardio en intérieur, tir déplacé, skills sans panier',()=>{
  const s=joueur([...joueur().owned,'outdoor','hoop','sand']),day=PT.dateKey();
  s.calendar=SP.setRain(s,true,day);
  expect(SP.rainOn(s,day)).toBe(true);
  const check={...s.checkIn,equipment:s.owned,guided:2,date:day};
  ['run','sand-sprint','sand-pogo'].forEach(id=>expect(PT.allowed(PT.catalog.find(e=>e.id===id),s,check),id).toBe(false));
  const run=BC.plan(PT,JP,{...s,pathway:{...s.pathway,step:3}},'run',{phase:'step3'});
  expect(run.exercises[0].id).toBe('run-in-place');
  expect(run.reasons.join(' ')).toMatch(/Pluie/);
  s.skills=SK.saveProfile(SK.blank(),{answers:{},tests:{},date:day});s.skills.hoopDate=day;
  const sk=SK.session(PT,s,{minutes:45});
  expect(sk.exercises.some(e=>(e.needs||[]).includes('hoop'))).toBe(false);
  // Le tir ne va jamais un jour de pluie.
  const monday=SP.mondayOf(day),w=SP.weekSchedule(s,monday,monday);
  expect(items(w).filter(x=>x.type==='shooting').every(x=>w.days[x.day].date!==day)).toBe(true);
  // « Il ne pleut plus » : retour en arrière.
  s.calendar=SP.setRain(s,false,day);expect(SP.rainOn(s,day)).toBe(false);
});

test('sable : séance sable au planning, circuit qui monte par niveau, sans sauts à l’étape 1',()=>{
  const s=joueur([...joueur().owned,'sand']);
  expect(BC.weekKinds(2,MONDAY,s)).toEqual(['rope','sand']);
  const w=SP.weekSchedule(s,MONDAY,MONDAY);
  expect(items(w).some(x=>x.type==='cardio'&&x.kind==='sand')).toBe(true);
  const p1=BC.plan(PT,JP,s,'sand',{phase:'step1'});
  expect(p1.title).toBe('Cardio · séance sable');
  expect(p1.exercises.every(e=>e.needs.includes('sand'))).toBe(true);
  expect(p1.exercises.some(e=>e.pattern==='jump')).toBe(false);
  // Sans terrain de sable : course fractionnée à la place.
  const s2=joueur();expect(BC.weekKinds(2,MONDAY,s2)).toEqual(['rope','run']);
});

test('abdos : core workout en circuit, finisher en fin de séance du parcours, rien sur une version courte',()=>{
  const s=joueur();
  const w=CORE.workout(PT,s,{minutes:12});
  expect(w.error).toBeUndefined();
  expect(w.format).toBe('circuit');
  expect(new Set(w.exercises.map(e=>e.coreFamily)).size).toBe(3);
  const plan=BP.sessionPlan(PT,JP,s,s.pathway,'A');
  expect(plan.exercises.filter(e=>e.coreBlock).length).toBeGreaterThanOrEqual(2);
  const short=BP.sessionPlan(PT,JP,s,s.pathway,'A',{minutes:30});
  expect(short.exercises.some(e=>e.coreBlock)).toBe(false);
  ['crunch','band-crunch','band-woodchop','v-up','hollow-rock'].forEach(id=>expect(PT.catalog.some(e=>e.id===id),id).toBe(true));
});

test('skills : le dribble ouvre la séance, avec panier lay-up et tir ; séance de tir chaque semaine',()=>{
  const s=joueur(),day=PT.dateKey();
  s.skills=SK.saveProfile(SK.blank(),{answers:{},tests:{},date:day});s.skills.hoopDate=day;
  const sk=SK.session(PT,s,{minutes:45});
  expect(sk.exercises[0].area).toBe('handle');
  expect(sk.exercises.some(e=>e.area==='finish')).toBe(true);
  expect(sk.exercises.some(e=>e.area==='shoot')).toBe(true);
  expect(SK.dribbleWarm(PT,s).every(e=>e.area==='handle')).toBe(true);
  const w=SP.weekSchedule(s,MONDAY,MONDAY);
  expect(items(w).filter(x=>x.type==='shooting').length).toBe(1);
});

test('recommencer au jour 1 : parcours, muscu et planning à zéro, profil et historique gardés',()=>{
  const s=joueur();s.pathway={...s.pathway,step:3,completed:[{step:1,day:'A',date:'2026-10-06'}],tests:{calf:[{value:20,date:'2026-10-06'}]}};
  s.sessions=[{id:'x',date:'2026-10-06',source:'pathway',exercises:[],entries:{}}];s.player={position:'guard'};
  s.calendar={...SP.blankCalendar(),week:{0:'off'},moves:{'2026-10-12':{PA:'2026-10-14'}}};
  const r=SP.restart(s,'2026-11-11');
  expect(r.pathway.step).toBe(1);expect(r.pathway.completed).toEqual([]);expect(r.pathway.startedAt).toBe('2026-11-11');
  expect(r.pathway.tests.calf.length).toBe(1);
  expect(r.sessions.length).toBe(1);expect(r.player).toEqual(s.player);
  expect(r.calendar.moves).toEqual({});expect(r.calendar.week).toEqual({0:'off'});
  expect(r.seasonPlan.start).toBe('2026-11-11');
});

test('écrans : « Il pleut » noté depuis l’imprévu puis retiré, « Recommencer au jour 1 » confirmé',async({page})=>{
  test.setTimeout(90000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const s=joueur();s.profile.name='Test';s.pathway={...s.pathway,step:2};
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('s')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('s','1');}},{data:s,key:PT.STORAGE_KEY});
  await page.goto('/#mishap');await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
  await page.getByRole('button',{name:/Il pleut/}).click();
  await page.getByRole('button',{name:'Noter la pluie et adapter ma journée'}).click();
  await expect(page.locator('.rain-note')).toBeVisible();
  const OUT=process.env.SHOTS;if(OUT)await page.screenshot({path:OUT+'/rain-home.png'});
  await page.getByRole('button',{name:'Il ne pleut plus'}).click();
  await expect(page.locator('.rain-note')).toHaveCount(0);
  await page.goto('/#profile');
  await page.getByRole('button',{name:/Recommencer au jour 1/}).click();
  await expect(page.getByText('Recommencer au jour 1 ?')).toBeVisible();
  if(OUT)await page.screenshot({path:OUT+'/restart.png'});
  await page.getByRole('button',{name:'Oui, recommencer'}).click();
  await page.waitForTimeout(400);
  const st=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);
  expect(st.pathway.step).toBe(1);
  expect(errors).toEqual([]);
});

test('jour « Shooting » : réglé à la main, la séance de tir y va, deux jours = deux séances, rien d’autre ce jour-là',()=>{
  const s=joueur();s.skills=SK.saveProfile(SK.blank(),{answers:{},tests:{},date:'2026-10-05'});
  expect(SP.MODES.shooting).toBe('Shooting');
  s.calendar={...SP.blankCalendar(),week:{2:'shooting'}};
  let w=SP.weekSchedule(s,MONDAY,MONDAY);
  expect(w.days[2].items.map(x=>x.type)).toEqual(['shooting']);
  expect(items(w).filter(x=>x.type==='shooting').length).toBe(1);
  s.calendar={...SP.blankCalendar(),week:{2:'shooting',5:'shooting'}};
  w=SP.weekSchedule(s,MONDAY,MONDAY);
  expect(items(w).filter(x=>x.type==='shooting').map(x=>x.day).sort()).toEqual([2,5]);
  expect(SP.violations(s,w)).toEqual([]);
});

test('accueil : un jour « Shooting », le bouton principal lance la séance de tir',async({page})=>{
  test.setTimeout(90000);
  const s=joueur();s.profile.name='Test';s.skills=SK.saveProfile(SK.blank(),{answers:{},tests:{},date:PT.dateKey()});
  s.calendar=SP.setDayMode(s,PT.dateKey(),'shooting');
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('s')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('s','1');}},{data:s,key:PT.STORAGE_KEY});
  await page.goto('/#today');await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
  await page.getByRole('button',{name:/Lancer ma séance de tir/}).click();
  await expect(page.getByRole('heading',{name:/Mes séances de tir/})).toBeVisible();
});

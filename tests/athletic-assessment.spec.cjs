const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const BP=require('../basket-pathway.js');
const AP=require('../athletic-profile.js');

const home=['bodyweight','dumbbells','kettlebell','barbell','bench','bands','bike','court'];
const weak={jump:'much',firststep:'slow',brake:'stable',landing:'quiet',contact:'solid',engine:'match',strength:'regular',squat:'heels',stiff:['ankle'],mindset:'careful'};
function player({position='meneur',archetypes=['slasher'],pains=[],answers=weak,layoff='long'}={}){
  const data=PT.initialState();
  data.profile.onboarded=true;data.profile.name='Test';data.profile.experience='returning';
  data.owned=home;data.checkIn.equipment=home;
  data.player=JP.validatePlayer({position,archetypes,layoff});
  data.symptoms=pains.map((p,i)=>({id:`s${i}`,side:'right',onset:'known',redFlags:false,note:'',date:PT.dateKey(),active:true,followups:[],...p}));
  data.athletic={...AP.create(),answers};
  return data;
}
const record=(a,list)=>list.reduce((acc,[id,v])=>AP.recordTest(acc,id,v),a);
const foundations=[['calf',{left:22,right:21}],['bridge',{left:16,right:17}],['balance',{left:35,right:32}],['sideplank',{left:50,right:48}],['kneewall',{left:10,right:11}]];

test('bilan : niveaux, asymétries et priorités du slasher',()=>{
  const data=player();
  const res=AP.assess(data.athletic);
  expect(res.qualities.firststep.level).toBe(0);
  expect(res.qualities.vertical.level).toBe(0);
  expect(res.qualities.decel.level).toBe(2);
  expect(AP.targets(data.athletic,data.player)[0].id).toBe('firststep');
  const a=record(data.athletic,[['hop',{left:150,right:120}]]);
  expect(AP.assess(a).asymmetries.map(x=>x.id)).toContain('hop');
  expect(AP.assess(a).qualities.balance.level).toBe(0);
  // Sans bilan, les priorités du poste ne changent pas.
  expect(JP.priorities({position:'meneur'})[0].id).toBe('decel');
});

test('bilan : étape conseillée prudente, plafonnée',()=>{
  expect(AP.recommendedStart(player()).step).toBe(1);
  const ok=player();ok.athletic=record(ok.athletic,foundations);
  expect(AP.recommendedStart(ok).step).toBe(2);
  const fit=player({layoff:'none'});fit.athletic=record(fit.athletic,[...foundations,['calf',{left:26,right:27}],['bridge',{left:21,right:22}],['splitsquat',{left:true,right:true}],['landingq',{value:true}]]);
  expect(AP.recommendedStart(fit).step).toBe(3);
  const hurt=player({pains:[{region:'knee',severity:3}]});hurt.athletic=fit.athletic;
  expect(AP.recommendedStart(hurt).step).toBe(1);
  expect(AP.testGroups(hurt).flatMap(g=>g.tests).filter(t=>!t.hidden).some(t=>['vertical','sprint5','sprint10','shuttle','hop'].includes(t.id))).toBe(false);
});

test('parcours avec bilan : point faible adapté à l’étape, bloc kiné, sécurité intacte',()=>{
  const data=player();data.athletic=record(data.athletic,[['kneewall',{left:7,right:10}]]);
  const early=BP.sessionPlan(PT,JP,data,BP.create(),'C');
  expect(early.exercises.find(e=>e.pathwayRole==='point faible').id).toMatch(/knee-drive-iso|psoas-march|a-march/);
  const late=BP.sessionPlan(PT,JP,data,{...BP.create(),step:4},'C');
  expect(late.exercises.find(e=>e.pathwayRole==='point faible').id).toMatch(/band-resisted-start|drop-step-start|split-start|falling-start/);
  const kine=BP.sessionPlan(PT,JP,data,BP.create(),'A');
  expect(kine.exercises[0].pathwayRole).toBe('kiné');
  expect(kine.exercises.filter(e=>e.pathwayRole==='kiné').map(e=>e.id)).toContain('ankle-mob');
  for(const pains of [[],[{region:'knee',severity:4}],[{region:'ankle',severity:3}]])for(const step of BP.steps)for(const day of step.days)for(const minutes of [undefined,30]){
    const d=player({pains});d.athletic=data.athletic;
    const plan=BP.sessionPlan(PT,JP,d,{...BP.create(),step:step.id},day.key,{minutes});
    expect(plan.error,`${step.id}${day.key}`).toBeUndefined();
    expect(plan.exercises.filter(e=>!PT.allowed(e,d,plan.check)||!JP.tolerates(e,d.symptoms)).map(e=>e.id)).toEqual([]);
    expect(new Set(plan.exercises.map(e=>e.id)).size).toBe(plan.exercises.length);
    expect(plan.exercises.some(e=>e.pathwayRole==='kiné')).toBe(true);
    if(step.id===1)expect(plan.exercises.filter(e=>e.impact&&!['landing','pogo'].includes(e.id)).map(e=>e.id)).toEqual([]);
    if(pains.length)expect(plan.exercises.some(e=>e.id==='reverse-nordic'||e.impact&&['knee','ankle'].includes(pains[0].region))).toBe(false);
  }
  const quick=BP.quickPlan(PT,JP,data,'first-step');
  expect(quick.exercises.some(e=>e.impact)).toBe(false);
  expect(BP.quickPlan(PT,JP,data,'kine').exercises[0].id).toBe('ankle-mob');
});

test('bilan : sauvegardes anciennes et valeurs corrompues',()=>{
  const old=PT.initialState();delete old.athletic;
  expect(PT.validateState(old).athletic).toBeNull();
  const dirty=PT.validateState({...PT.initialState(),athletic:{answers:{jump:'much',firststep:'??',stiff:['ankle','x']},tests:{vertical:[{value:45,date:'2026-09-01'},{value:-3,date:'2026-09-02'}],nope:[{value:1,date:'2026-09-01'}]},history:'x'}}).athletic;
  expect(dirty.answers).toEqual({jump:'much',stiff:['ankle']});
  expect(dirty.tests).toEqual({vertical:[{value:45,date:'2026-09-01'}]});
  expect(dirty.history).toEqual([]);
  const seeded=AP.seedPathwayTests(BP.create(),record(AP.create(),foundations));
  expect(BP.latest(seeded,'calf25')).toBeTruthy();
});

test('bilan dans l’app : répondre, passer les tests, lancer le parcours',async({page})=>{
  test.setTimeout(90000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:320,height:780});
  const data=player();data.athletic=null;
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('test-seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.goto('/#bilan');await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
  await expect(page.getByRole('heading',{name:'Ton ressenti.'})).toBeVisible();
  for(const label of ['Beaucoup moins','Je me sens lent au démarrage','Je reste stable et bas','Silencieuses et stables','Je tiens ma ligne','Je tiens un match entier','Je m’entraîne régulièrement','Les talons décollent','Un peu d’appréhension'])await page.getByRole('button',{name:label,exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:/Continuer/}).click();
  await page.locator('summary',{hasText:'Mobilité'}).click();
  const knee=page.locator('.test-card',{hasText:'Genou au mur'});
  await knee.getByLabel('Gauche (cm)').fill('7');await knee.getByLabel('Droite (cm)').fill('10');
  await page.locator('.test-card',{hasText:'Genou au mur'}).getByRole('button',{name:/Enregistrer/}).click();
  await expect(page.locator('.test-card',{hasText:'Genou au mur'}).locator('.caption')).toContainText('écart');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:/Voir mon bilan/}).click();
  await expect(page.getByRole('heading',{name:'Tes priorités'})).toBeVisible();
  await expect(page.locator('.quality-list li')).toHaveCount(10);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:/Lancer le parcours à l’étape 1/}).click();
  await expect(page.getByRole('heading',{name:'Fondations.'})).toBeVisible();
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);
  expect(saved.pathway.step).toBe(1);expect(saved.athletic.date).toBeTruthy();expect(saved.athletic.tests.kneewall).toHaveLength(1);
  await expect(page.locator('.dose-list small',{hasText:'Kiné'}).first()).toBeVisible();

  await page.setViewportSize({width:390,height:844});await page.goto('/#bilan');
  await page.getByRole('button',{name:/Continuer/}).click();await page.getByRole('button',{name:/Voir mon bilan/}).click();
  await expect(page.getByRole('heading',{name:'Tes priorités'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

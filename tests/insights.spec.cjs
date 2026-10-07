const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const AP=require('../athletic-profile.js');

const NOW='2026-10-03';
const day=n=>{const d=new Date(`${NOW}T12:00:00`);d.setDate(d.getDate()-n);return PT.dateKey(d);};
const activity=(n,minutes,effort)=>({id:PT.uid(),date:day(n),title:'Match',source:'external',eventType:'match',focus:'basket',format:'external',minutes,effort,entries:{},exercises:[],completedAt:`${day(n)}T20:00:00.000Z`,partial:false,nextDay:'same',nextDayPending:false});
function base(){const data=PT.initialState();data.profile.onboarded=true;data.profile.name='Test';data.profile.experience='regular';data.owned=['bodyweight','dumbbells','bench'];data.checkIn.equipment=data.owned;return data;}
function regular(){const data=base();for(let n=35;n>=8;n-=3)data.sessions.push(activity(n,45,5));return data;}
async function seed(page,data,route='today'){
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('test-seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.goto('/#'+route);await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
async function state(page){await page.waitForTimeout(300);return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}

test('charge : calibration, zone stable puis pic qui allège la séance',()=>{
  const fresh=base();fresh.sessions.push(activity(2,60,6));
  expect(PT.trainingLoad(fresh,NOW).zone).toBe('calibration');
  const data=regular();data.sessions.push(activity(3,45,5),activity(6,45,5));
  expect(PT.trainingLoad(data,NOW).zone).toBe('stable');
  data.sessions.push(activity(1,90,9),activity(2,90,8),activity(4,90,8));
  const load=PT.trainingLoad(data,NOW);
  expect(load.zone).toBe('spike');expect(load.ratio).toBeGreaterThan(1.5);
  expect(PT.context(data,data.checkIn,NOW).loadSpike).toBe(true);
  expect(PT.todayPlan(data,NOW).action).toBe('mobility');
});

test('aujourd’hui : douleur bloquante, match, douleur active puis feu vert',()=>{
  const data=regular();
  expect(PT.todayPlan(data,NOW).kind).toBe('train');
  data.events.push({id:'m',title:'Match du samedi',type:'match',date:NOW,minutes:60,effort:5,completed:false});
  expect(PT.todayPlan(data,NOW).kind).toBe('match');
  data.symptoms.push({id:'s',region:'knee',side:'right',severity:4,onset:'new',redFlags:false,note:'',date:NOW,active:true,followups:[]});
  expect(PT.todayPlan(data,NOW).kind).toBe('match');
  data.events=[];expect(PT.todayPlan(data,NOW).kind).toBe('rehab');
  data.symptoms[0].severity=8;expect(PT.todayPlan(data,NOW).kind).toBe('blocked');
});

test('bilan : les tests suivis comptent par tendance, sprint plus court = mieux',()=>{
  let a=AP.create();
  a=AP.recordTest(a,'rsi',{value:1.6},'2026-09-01');a=AP.recordTest(a,'rsi',{value:1.4},'2026-10-01');
  a=AP.recordTest(a,'run17',{value:62},'2026-09-01');a=AP.recordTest(a,'run17',{value:59},'2026-10-01');
  const q=AP.assess(a).qualities;
  expect(q.reactive.level).toBe(0);expect(q.endurance.level).toBe(1);
  expect(AP.validateAthletic({tests:{vertical:[{value:41.2,date:NOW,method:'video'}]}}).tests.vertical[0].method).toBe('video');
});

test('accueil : une seule réponse pour aujourd’hui',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const data=regular();data.sessions.push(activity(1,90,9),activity(2,90,8),activity(4,90,8));
  // Les dates du test sont relatives au 3 octobre : on les recale sur aujourd'hui.
  const shift=PT.dayDiff(PT.dateKey(),NOW);data.sessions.forEach(s=>{const d=new Date(`${s.date}T12:00:00`);d.setDate(d.getDate()+shift);s.date=PT.dateKey(d);});
  await seed(page,data);
  const card=page.locator('.today-plan');
  await expect(card.getByRole('heading',{name:'Récupération active.'})).toBeVisible();
  await page.screenshot({path:'test-results/accueil-aujourdhui.png'});
  await card.getByRole('button',{name:/10 min de mobilité/}).click();
  await expect.poll(async()=>(await state(page)).draft?.focus).toBe('mobility');
});

test('séance : « Fait comme prévu » valide la série sans marge, donc sans hausse de charge',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const data=base();const e=PT.makePrescription(PT.catalog.find(x=>x.id==='curl'),'classic',30,PT.context(data));e.sets=2;
  data.draft=PT.startDraft({id:'quick',title:'Rapide',exercises:[e],format:'classic',focus:'muscle',source:'generated',check:data.checkIn,warmupSeconds:60,entries:{},status:'preview',reasons:[]},data);
  data.draft.entries.curl.forEach(r=>r.weight='10');
  await seed(page,data,'session');
  await page.getByRole('button',{name:'Échauffement effectué',exact:true}).click();
  await page.getByRole('button',{name:'Terminé',exact:true}).click();
  await page.getByRole('button',{name:'Fait comme prévu'}).click();
  await expect(page.getByRole('timer')).toHaveAttribute('aria-label',/^Repos/);
  const row=(await state(page)).draft.entries.curl[0];
  expect(row).toMatchObject({done:true,result:'passed',rir:'',reps:String(e.targetMin),weight:'10'});
});

test('mesure vidéo : hauteur = g·t²/8, RSI et chrono, ralenti pris en compte',async({page})=>{
  await seed(page,base());
  const r=await page.evaluate(()=>({
    jump:ptVideoResult('jump',[1.000,1.500],1),
    slow:ptVideoResult('jump',[1.000,3.000],4),
    rsi:ptVideoResult('rsi',[0,0.2,0.65],1),
    sprint:ptVideoResult('sprint',[0.5,2.35],1),
    bad:ptVideoResult('jump',[2,1],1)
  }));
  expect(r.jump.value).toBe(30.7);   // 9,81 × 0,5² / 8 = 0,3066 m
  expect(r.slow.value).toBe(30.7);   // 2 s à la lecture ÷ 4 = 0,5 s réelles
  expect(r.rsi.value).toBe(1.24);    // 0,248 m / 0,2 s
  expect(r.sprint.value).toBe(1.85);
  expect(r.bad.error).toBeTruthy();
});

test('raccourci Corps : « Mesurer ma détente » ouvre directement les tests, même bilan déjà fait',async({page})=>{
  const data=base();data.athletic={...AP.create(),date:NOW};data.player={...(data.player||{}),position:'meneur'};
  await seed(page,data,'pathway');
  await page.getByRole('button',{name:/Mesurer ma détente et mes tests/}).click();
  await expect(page.getByRole('heading',{name:'Tes tests.'})).toBeVisible();
  await expect(page.getByText('Saut vertical debout').first()).toBeVisible();
});

test('repères de départ : la première mesure compte, puis repère atteint et pas de recul',()=>{
  const mk=(id,values)=>{const a=AP.create();a.tests={[id]:values.map(value=>({value,date:NOW}))};return AP.assess(a).qualities;};
  expect(mk('vertical',[38]).vertical.level).toBe(0);
  expect(mk('vertical',[38]).vertical.failed[0].detail).toContain('pas encore atteint');
  expect(mk('vertical',[50]).vertical.level).toBe(1);
  expect(mk('vertical',[50,46]).vertical.level).toBe(0);
  expect(mk('vertical',[38,42]).vertical.level).toBe(0);
  expect(mk('sprint5',[1.1]).firststep.level).toBe(1);
  expect(mk('sprint5',[1.4]).firststep.level).toBe(0);
  expect(AP.meetsBase('run17',62)).toBe(true);
});

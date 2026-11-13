// Lot 32 « joueur actif » : gêne ≠ blessure, bloc explosivité, séances de 45 min, 3 cardios, aller directement à une étape.
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const BP=require('../basket-pathway.js');
const BC=require('../basket-cardio.js');

const home=['bodyweight','dumbbells','kettlebell','barbell','bench','bands','bike','court','hoop','rope'];
function player(pains=[]){
  const d=PT.initialState();d.profile.onboarded=true;d.profile.experience='returning';d.owned=home;d.checkIn.equipment=home;
  d.player=JP.validatePlayer({position:'ailier',archetypes:['slasher'],layoff:'long'});
  d.symptoms=pains.map((p,i)=>({id:`s${i}`,side:'right',onset:'known',redFlags:false,note:'',date:PT.dateKey(),active:true,followups:[],...p}));
  return d;
}
const step3={...BP.create(),step:3};

test('gêne à 1/10 : sauts et sprints gardés, soin court, séance de 45 min environ',()=>{
  const d=player([{region:'knee',severity:1},{region:'hip',severity:1}]);
  for(const day of ['A','B','C']){
    const plan=BP.sessionPlan(PT,JP,d,step3,day);
    expect(plan.error).toBeUndefined();
    expect(plan.exercises.some(e=>e.impact),day).toBe(true);
    expect(plan.exercises.filter(e=>e.pathwayRole==='soin').length).toBeLessThanOrEqual(2);
    expect(plan.estimatedMinutes).toBeLessThanOrEqual(50);
    expect(plan.reasons.join(' ')).toMatch(/Gêne légère/);
  }
});

test('lendemain « pire » : les impacts sortent 48 h, puis reviennent',()=>{
  const d=player([{region:'knee',severity:1}]);
  d.sessions.push({id:'x',date:PT.dateKey(),title:'Parcours',exercises:[],entries:{},nextDay:'worse',source:'pathway'});
  expect(BP.sessionPlan(PT,JP,d,step3,'C').exercises.some(e=>e.impact)).toBe(false);
  expect(BC.impactStatus(d,'step3').ok).toBe(false);
  const old=new Date();old.setDate(old.getDate()-3);d.sessions[0].date=PT.dateKey(old);
  expect(BP.sessionPlan(PT,JP,d,step3,'C').exercises.some(e=>e.impact)).toBe(true);
  expect(BC.impactStatus(d,'step3').ok).toBe(true);
});

test('vraie douleur (4/10) : pas de saut sur la zone, comme avant',()=>{
  const d=player([{region:'knee',severity:4}]);
  const plan=BP.sessionPlan(PT,JP,d,step3,'C');
  expect(plan.exercises.some(e=>e.impact)).toBe(false);
});

test('bloc explosivité en tête, même le jour du haut du corps ; entraînement de club la veille sans effet',()=>{
  const d=player();
  const b=BP.sessionPlan(PT,JP,d,step3,'B');
  const main=b.exercises.filter(e=>!['kiné','soin'].includes(e.pathwayRole));
  expect(main[0].primer).toBe(true);
  expect(main.filter(e=>e.primer).map(e=>e.id)).toEqual(expect.arrayContaining(['accel-10']));
  const y=new Date();y.setDate(y.getDate()-1);
  d.sessions.push({id:'club',date:PT.dateKey(y),title:'Club',exercises:[],entries:{},source:'external',eventType:'club'});
  expect(BP.sessionPlan(PT,JP,d,step3,'A').exercises.some(e=>e.impact)).toBe(true);
});

test('aller directement à l’étape 3 garde tests et historique',()=>{
  const p=BP.recordTest(BP.create(),'calf',{left:20,right:20});
  const q=BP.jumpTo(p,3);
  expect(q.step).toBe(3);expect(q.tests.calf).toHaveLength(1);expect(q.history.pop().jump).toBe(true);
  expect(BP.jumpTo(q,9)).toBe(q);
});

test('écran du parcours : passer directement à l’étape 3',async({page})=>{
  const d=player();d.pathway=BP.create();
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('s')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('s','1');}},{data:d,key:PT.STORAGE_KEY});
  await page.goto('/#pathway');
  await page.getByText('Gérer le parcours').click();
  await page.getByRole('button',{name:'Étape 3 · Puissance'}).click();
  await expect(page.getByRole('heading',{name:/Puissance/}).first()).toBeVisible();
  await page.waitForTimeout(400);
  expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).pathway.step,PT.STORAGE_KEY)).toBe(3);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('lot 36 : une seule sortie sur le terrain, en premier, dans chaque séance du parcours et en vivacité',()=>{
  const d=player([{region:'knee',severity:1}]);
  for(const step of [1,2,3,4,5]) for(const day of BP.stepById(step).days){
    const plan=BP.sessionPlan(PT,JP,d,{...BP.create(),step},day.key);
    if(plan.error) continue;
    const places=plan.exercises.map(e=>e.place);
    const switches=places.filter((x,i)=>i>0&&x!==places[i-1]).length;
    expect(switches,`${step}${day.key}`).toBeLessThanOrEqual(1);
    if(places.includes('out')) expect(places[0],`${step}${day.key}`).toBe('out');
  }
  const v=BP.quickPlan(PT,JP,d,'vivacite');
  expect(v.exercises.every(e=>e.place===v.exercises[0].place)).toBe(true);
});

test('lot 36 : vraie douleur (4/10) : le soin qui calme la zone reste en tête',()=>{
  const d=player([{region:'knee',severity:4}]);
  const plan=BP.sessionPlan(PT,JP,d,{...BP.create(),step:3},'A');
  if(!plan.error&&plan.exercises.some(e=>e.place==='out')) expect(plan.exercises[0].pathwayRole).toBe('soin');
});

test('lot 38 : quand le reste ne demande que poids du corps ou élastique, toute la séance se fait sur le terrain (Copenhagen → adduction au sol)',()=>{
  const d=player([{region:'knee',severity:1}]);d.owned=[...new Set([...d.owned,'sliders'])];d.checkIn.equipment=d.owned;
  const plan=BP.sessionPlan(PT,JP,d,{...BP.create(),step:3},'C');
  expect(plan.error).toBeUndefined();
  expect(plan.exercises.every(e=>e.place==='out')).toBe(true);
  expect(plan.exercises.some(e=>e.id==='copenhagen')).toBe(false);
  // Regrouper une seconde fois ne change rien (le coach et l'enregistrement repassent par la même règle).
  const again=BP.groupByPlace(PT,d,plan);
  expect(again.exercises.map(e=>e.id)).toEqual(plan.exercises.map(e=>e.id));
  expect(again.reasons.filter(r=>/terrain/i.test(r)).length).toBe(1);
});

test('lot 38 : Vivacité du même jour fusionnée dans le bloc terrain, puis cochée par le planning',()=>{
  const d=player([{region:'knee',severity:1}]);
  const base=BP.sessionPlan(PT,JP,d,{...BP.create(),step:3},'A');
  const m=BP.withVivacite(PT,JP,d,base);
  expect(m.withVivacite).toBe(true);
  const places=m.exercises.map(e=>e.place);
  expect(places.filter((x,i)=>i>0&&x!==places[i-1]).length).toBeLessThanOrEqual(1);
  m.exercises.filter(e=>e.pathwayRole==='vivacité').forEach(e=>expect(e.place).toBe('out'));
  // Fusionner deux fois ne rajoute rien.
  expect(BP.withVivacite(PT,JP,d,m).exercises.length).toBe(m.exercises.length);
  // Le planning compte la vivacité du jour comme faite quand la séance fusionnée est terminée.
  const SP=require('../season-plan.js');global.BasketPathway=BP;
  const monday=SP.mondayOf(PT.dateKey());
  const w0=SP.weekSchedule(d,monday,PT.dateKey());
  const viva=w0.days.flatMap(x=>x.items).find(x=>x.type==='vivacite');
  if(viva){
    const done={...d,sessions:[{id:'s1',date:viva.date,source:'pathway',pathwayDay:'B',withVivacite:true,title:'x',minutes:50}]};
    const w=SP.weekSchedule(done,monday,viva.date);
    expect(w.days.flatMap(x=>x.items).find(x=>x.type==='vivacite').status).toBe('done');
  }
});

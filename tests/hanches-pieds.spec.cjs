// Lot 26 : hanches, pieds et genou qui part sur le côté.
const {test,expect}=require('@playwright/test');
const fs=require('fs');
const path=require('path');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const RW=require('../rehab-warmup.js');
const AP=require('../athletic-profile.js');
const BP=require('../basket-pathway.js');

const home=['bodyweight','dumbbells','kettlebell','bench','bands','court'];
const NEW=['deep-squat-shift','quadruped-hip-car','straddle-lean','box-pigeon','box-figure-four','squat-kneel-stand','kneel-jump-squat','foot-bridge','foot-bridge-rdl','kb-single-rdl','band-split-squat-out','side-lying-abduction','pad-single-calf','inversion-sl-balance'];
const answers={jump:'less',firststep:'depends',brake:'slide',landing:'heavy',contact:'moved',engine:'cuts',strength:'some',squat:'easy',weakLeg:'none',mindset:'careful'};
function player({owned=home,kneeTrack,pains=[]}={}){
  const data=PT.initialState();
  data.profile.onboarded=true;data.profile.name='Test';data.profile.experience='returning';
  data.owned=owned;data.checkIn.equipment=owned;
  data.player=JP.validatePlayer({position:'meneur',archetypes:['slasher'],layoff:'long'});
  data.athletic=AP.validateAthletic({...AP.create(),answers:kneeTrack?{...answers,kneeTrack}:answers});
  data.symptoms=pains.map((p,i)=>({id:`s${i}`,side:'right',onset:'known',redFlags:false,note:'',date:PT.dateKey(),active:true,followups:[],...p}));
  return data;
}
async function seed(page,data,route){
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('test-seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.goto('/#'+route);await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
async function state(page){await page.waitForTimeout(300);return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}

test('14 nouveaux exercices complets, avion de hanche en rotation',()=>{
  NEW.forEach(id=>{
    const e=PT.catalog.find(x=>x.id===id);
    expect(e,id).toBeTruthy();
    expect(e.instructions.filter(t=>t.length>=15).length,id).toBeGreaterThanOrEqual(2);
    expect(e.transfer&&e.load&&e.cues.length,id).toBeTruthy();
  });
  expect(new Set(PT.catalog.map(e=>e.id)).size).toBe(PT.catalog.length);
  const plane=PT.catalog.find(e=>e.id==='airplane');
  expect(plane.name).toMatch(/rotation/);expect(plane).toMatchObject({measure:'reps',min:5,max:8});
  expect(PT.catalog.find(e=>e.id==='single-calf').instructions.join(' ')).toMatch(/gros orteil/);
});

test('Quick rehab : hanches et pieds-genou, trois niveaux nommés, avec ou sans matériel',()=>{
  for(const id of ['hips','foot-knee']){
    const p=RW.byId(id);
    expect(p.levelNames).toHaveLength(3);
    expect(RW.levelName(p,0)).not.toBe('Calmer');
    for(const owned of [['bodyweight'],home]) [0,1,2].forEach(level=>{
      const plan=RW.rehabPlan(PT,JP,player({owned}),id,level,20);
      expect(plan.error,`${id} ${level}`).toBeUndefined();
      expect(plan.exercises.length).toBeGreaterThanOrEqual(3);
      expect(new Set(plan.exercises.map(e=>e.id)).size).toBe(plan.exercises.length);
      expect(plan.reasons[0]).toContain(RW.levelName(p,level));
    });
  }
  // Pieds-genou : le soutien du bord du pied et de la hanche vient tôt, et la consigne gros orteil est écrite.
  const wake=RW.rehabPlan(PT,JP,player(),'foot-knee',0,20);
  expect(wake.exercises.map(e=>e.id)).toEqual(expect.arrayContaining(['foot-bridge','side-lying-abduction']));
  expect(wake.reasons.join(' ')).toMatch(/gros orteil/);
  const strong=RW.rehabPlan(PT,JP,player(),'foot-knee',1,20);
  expect(strong.exercises[0].id).toBe('band-split-squat-out');
  // Les protocoles existants gardent Calmer / Renforcer / Retour terrain.
  expect(RW.levelName('knee-pfp',0)).toBe('Calmer');
  // Questionnaire et coach : les deux protocoles sont joignables.
  expect(RW.where.knee.map(x=>x[0])).toContain('foot-knee');
  expect(RW.where.foot.map(x=>x[0])).toContain('foot-knee');
  expect(RW.where.hip.map(x=>x[0])).toContain('hips');
  const coach=fs.readFileSync(path.join(__dirname,'..','api','coach.js'),'utf8');
  expect(coach).toContain("'hips', 'foot-knee'");
  // Le niveau monte comme les autres protocoles.
  let r={levels:{},log:[]};
  r=RW.record(r,{protocolId:'hips',level:0,painAfter:1,sessionId:'a'}).rehab;
  expect(RW.record(r,{protocolId:'hips',level:0,painAfter:0,sessionId:'b'}).level).toBe(1);
});

test('début de séance : jambes = 1 hanche + 1 pied, haut du corps = 1, sans doublon avec la séance',()=>{
  const data=player();
  const prep=new Set([...RW.POOLS.hipPrep,...RW.POOLS.footPrep]);
  const legs=RW.attachRoutines(PT,JP,data,BP.sessionPlan(PT,JP,data,BP.create(),'A'));
  const w=legs.warmupMoves.map(e=>e.id);
  expect(w.filter(id=>RW.POOLS.hipPrep.includes(id))).toHaveLength(1);
  expect(w.filter(id=>RW.POOLS.footPrep.includes(id))).toHaveLength(1);
  expect(w.some(id=>legs.exercises.some(e=>e.id===id))).toBe(false);
  const upper=RW.attachRoutines(PT,JP,data,BP.sessionPlan(PT,JP,data,BP.create(),'B'));
  expect(upper.warmupMoves.filter(e=>prep.has(e.id))).toHaveLength(1);
});

test('genou droit qui part dehors : alignement en tête du parcours et de la séance du joueur, côté droit d’abord',()=>{
  const data=player({kneeTrack:'right-out'});
  expect(AP.kneeTrack(data.athletic)).toEqual({side:'right',dir:'out'});
  for(const day of ['A','B','C']){
    const plan=BP.sessionPlan(PT,JP,data,BP.create(),day);
    const align=plan.exercises.filter(e=>e.kineSource==='alignment');
    expect(align,day).toHaveLength(1);
    expect(AP.alignLists.out).toContain(align[0].id);
    expect(plan.exercises.indexOf(align[0])).toBeLessThan(3);
    expect(align[0].sideNote).toMatch(/droit/);
    expect(new Set(plan.exercises.map(e=>e.id)).size).toBe(plan.exercises.length);
    expect(plan.reasons.join(' ')).toMatch(/genou droit qui part vers l’extérieur/);
  }
  const body=JP.dailyBody(PT,data,{minutes:45,random:()=>.5});
  expect(body.exercises.some(e=>AP.alignLists.out.includes(e.id)&&e.sideNote)).toBe(true);
  // Sans réponse (ou « non ») : rien ne change.
  const none=player({kneeTrack:'none'});
  expect(BP.sessionPlan(PT,JP,none,BP.create(),'A').exercises.some(e=>e.kineSource==='alignment')).toBe(false);
  // Genou qui rentre : la voûte du pied passe en priorité.
  const valgus=player({kneeTrack:'left-in'});
  const a=BP.sessionPlan(PT,JP,valgus,BP.create(),'A').exercises.find(e=>e.kineSource==='alignment');
  expect(AP.alignLists.in).toContain(a.id);
  // Quick rehab propose directement le bon protocole.
  expect(RW.prefill(data)).toMatchObject({zone:'knee',where:'foot-knee'});
});

test('hanches raides déclarées : mobilité active avant l’étirement tenu',()=>{
  const data=player();data.athletic.answers.stiff=['hip'];
  const hip=AP.deficits(data.athletic).find(d=>d.area==='hip');
  expect(hip.ids.slice(0,2)).toEqual(['hip-90-90-liftoff','quadruped-hip-car']);
  expect(hip.why).toBe('hanches raides');
});

test('écran Quick rehab : les deux blocs en tête se lancent au niveau atteint',async({page})=>{
  const data=player();data.rehab={levels:{'foot-knee':1},log:[]};
  await seed(page,data,'routines/rehab');
  const tiles=page.locator('.routine-grid .preset-workout');
  await expect(tiles.nth(0)).toContainText('Pieds, chevilles et genou dans l’axe');
  await expect(tiles.nth(0)).toContainText('Renforcer');
  await expect(tiles.nth(1)).toContainText('Hanches mobiles et fortes');
  await expect(tiles.nth(1)).toContainText('Explorer');
  await tiles.nth(0).click();
  await expect(page).toHaveURL(/#preview/);
  const st=await state(page);
  expect(st.draft).toMatchObject({source:'rehab',protocolId:'foot-knee',rehabLevel:1});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

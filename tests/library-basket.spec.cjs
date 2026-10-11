const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const BP=require('../basket-pathway.js');
const SK=require('../basket-skills.js');
const AP=require('../athletic-profile.js');
global.window=global.window||{};
require('../exercise-media.js');require('../drill-sources.js');
const media=global.window.RehaabMedia,sources=global.window.RehaabSources;

const all=[...PT.catalog,...SK.drills];
// Fiches du lot 13 : elles portent toutes le champ transfer (« sur le terrain »).
const fresh=all.filter(e=>e.transfer);

test('catalogue basket : identifiants uniques, matériel connu, fiches courtes et utiles',()=>{
  const ids=all.map(e=>e.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(PT.catalog.filter(e=>e.transfer).length).toBeGreaterThanOrEqual(60);
  expect(SK.drills.filter(e=>e.transfer).length).toBeGreaterThanOrEqual(50);
  const known=new Set(PT.equipment.map(e=>e.id));
  for(const e of all) expect(e.needs.every(n=>known.has(n)),e.id).toBe(true);
  for(const e of fresh){
    expect(e.instructions.length,e.id).toBeLessThanOrEqual(3);
    for(const s of e.instructions) expect(s.split(/\s+/).length,`${e.id} : ${s}`).toBeLessThanOrEqual(12);
    expect(e.transfer.length,e.id).toBeGreaterThan(15);
    expect((e.cues||[]).length,e.id).toBeGreaterThan(0);
  }
  // Toutes les qualités annoncées existent.
  for(const e of PT.catalog.filter(e=>e.qualities)) for(const q of e.qualities) expect(JP.qualityLabels[q],`${e.id} : ${q}`).toBeTruthy();
  // Deux nouveaux domaines skills.
  expect(Object.keys(SK.areas)).toEqual(expect.arrayContaining(['defense','moves']));
  expect(SK.drills.filter(d=>d.area==='defense').length).toBeGreaterThanOrEqual(8);
  expect(SK.drills.filter(d=>d.area==='moves').length).toBeGreaterThanOrEqual(8);
});

test('charge articulaire classée pour chaque nouvel exercice de jambes',()=>{
  for(const e of PT.catalog.filter(e=>e.transfer&&e.regions.some(r=>['knee','ankle','hip'].includes(r)))){
    for(const r of ['knee','ankle','hip']) if(e.regions.includes(r)) expect(['low','moderate','high'],`${e.id} ${r}`).toContain(JP.load(e,r));
  }
  // Le meneur type : gêne sous la rotule à 4/10. Les sauts répétés sont écartés, l'isométrie sur slant board reste.
  const knee=[{region:'knee',severity:4}];
  const by=id=>PT.catalog.find(e=>e.id===id);
  expect(JP.tolerates(by('tuck-jump'),knee)).toBe(false);
  expect(JP.tolerates(by('drop-lunge'),knee)).toBe(false);
  expect(JP.tolerates(by('slant-iso-squat'),knee)).toBe(true);
  expect(JP.tolerates(by('sled-march'),knee)).toBe(true);
  expect(JP.tolerates(by('sl-hip-thrust'),knee)).toBe(true);
});

test('les qualités des nouvelles fiches pèsent dans le choix des exercices',()=>{
  expect(JP.qualitiesOf(PT.catalog.find(e=>e.id==='sled-push'))).toEqual(expect.arrayContaining(['firststep','speed']));
  // Ancienne fiche : toujours lue dans la table.
  expect(JP.qualitiesOf('accel-10')).toEqual(expect.arrayContaining(['speed','firststep']));
  // Les listes du bilan athlétique ne citent que des exercices existants.
  for(const [q,stages] of Object.entries(AP.focusLists)) for(const id of stages.flat()) expect(all.some(e=>e.id===id),`${q} : ${id}`).toBe(true);
  for(const step of BP.steps) for(const day of step.days) for(const slot of day.slots) for(const id of slot.ids) expect(PT.catalog.some(e=>e.id===id),`${step.id}${day.key} : ${id}`).toBe(true);
});

test('le parcours prend le nouveau matériel quand il est possédé, sinon il garde l’existant',()=>{
  const make=owned=>{const s=PT.initialState();s.profile.onboarded=true;s.profile.experience='regular';s.profile.impactReady=true;s.profile.safeties=true;s.owned=owned;s.checkIn.equipment=owned;s.player=JP.validatePlayer({position:'meneur'});s.pathway=BP.create({startStep:2});return s;};
  const base=['bodyweight','dumbbells','kettlebell','bench','bands','court'];
  const plain=BP.sessionPlan(PT,JP,make(base),make(base).pathway,'A');
  const trap=BP.sessionPlan(PT,JP,make(base.concat('trapbar')),make(base).pathway,'A');
  expect(plain.exercises.some(e=>e.id==='trapbar-deadlift')).toBe(false);
  expect(trap.exercises.some(e=>e.id==='trapbar-deadlift')).toBe(true);
});

test('séance Vivacité : sans saut avant l’étape 2, avec appuis rapides ensuite',()=>{
  const make=step=>{const s=PT.initialState();s.profile.onboarded=true;s.profile.experience='regular';s.profile.impactReady=true;s.owned=['bodyweight','court'];s.checkIn.equipment=s.owned;s.pathway=BP.create({startStep:step});return s;};
  const early=BP.quickPlan(PT,JP,make(1),'vivacite');
  expect(early.error).toBeUndefined();
  expect(early.exercises.some(e=>e.impact)).toBe(false);
  expect(early.exercises.length).toBeGreaterThanOrEqual(3);
  const later=BP.quickPlan(PT,JP,make(3),'vivacite');
  expect(later.exercises.some(e=>e.impact)).toBe(true);
  expect(later.estimatedMinutes).toBe(15);
});

test('skills : anciennes sauvegardes valides, défense et moves dans les séances',()=>{
  const old={profile:{answers:{weakHand:0},tests:{},date:'2026-09-01'},levels:{handle:2,shoot:1,finish:1,footwork:1},program:null,log:[],hoopDate:null};
  const v=SK.validate(old);
  expect(v.levels).toEqual({handle:2,shoot:1,finish:1,footwork:1,defense:1,moves:1});
  const s=PT.initialState();s.owned=['bodyweight','court'];s.checkIn.equipment=s.owned;
  s.player=JP.validatePlayer({position:'meneur'});
  s.skills=SK.saveProfile(null,{answers:{onBall:0,closeout:0,helpD:0,boxout:0,counter:2,readFoot:2,combos:2},tests:{}});
  const plan=SK.session(PT,s,{minutes:45});
  expect(plan.exercises.some(e=>e.skillArea==='defense')).toBe(true);
});

test('médias : plus aucune image générée, démos précachées, sources « Vu chez »',()=>{
  const sw=fs.readFileSync(require.resolve('../sw.js'),'utf8');
  for(const [id,m] of Object.entries(media)){
    expect(m.generated,id).toBeUndefined();
    expect(String(m.card||''),id).not.toMatch(/media\/cards\//);
    expect(String(m.frames||''),id).not.toMatch(/^generated\//);
    if(m.video&&m.video.includes('/yt/')) expect(sw.includes(`'./${m.video}'`),`${id} précaché`).toBe(true);
  }
  expect(sw).toContain("'./drill-sources.js'");
  const creators=new Set(Object.values(sources).flat().map(s=>s.creator));
  expect(creators.size).toBeGreaterThanOrEqual(5);
  for(const list of Object.values(sources)) for(const s of list) expect(s.url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]+&t=\d+s$/);
});

test('écran : bibliothèque filtrée par qualité et créateur, fiche « Sur le terrain »',async({page})=>{
  const s=PT.initialState();s.profile.onboarded=true;s.profile.name='Test';
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('seeded','1');}},{data:s,key:PT.STORAGE_KEY});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#library');
  await page.getByLabel('Qualité basket').selectOption('firststep');
  await page.getByRole('button',{name:/Poussée de traîneau rapide/}).click();
  await expect(page.locator('.court-transfer')).toContainText('premier');
  await page.getByLabel('Qualité basket').selectOption('all');
  const creator=[...new Set(Object.values(sources).flat().map(x=>x.creator))].sort((a,b)=>a.localeCompare(b,'fr'))[0];
  await page.getByLabel('Créateur').selectOption(creator);
  const count=Number((await page.locator('.library-count').textContent()).match(/\d+/)[0]);
  expect(count).toBe(Object.values(sources).filter(l=>l.some(x=>x.creator===creator)).length);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

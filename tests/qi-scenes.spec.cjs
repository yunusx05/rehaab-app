const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const QI=require('../basket-qi.js');
const BS=require('../basket-scenes.js');

test('scènes : actions valides, miroirs cohérents, 4 niveaux', ()=>{
  expect(BS.SCENES.length).toBeGreaterThanOrEqual(30);
  for(const s of BS.SCENES){
    expect(s.options).toContain(s.answer);
    for(const o of s.options) expect(BS.ACTIONS[o],`${s.id} ${o}`).toBeTruthy();
    expect(s.why.length).toBeGreaterThan(40);
  }
  expect(new Set(BS.SCENES.map(s=>s.level))).toEqual(new Set([1,2,3,4]));
  // Variante miroir : même modèle, réponse inversée quand elle a un côté.
  const mirror=a=>a.replace(/left|right/,m=>m==='left'?'right':'left');
  for(const s of BS.SCENES.filter(s=>s.mirror==='left')){
    const twin=BS.byId(s.id.replace('-left','-right'));
    expect(twin.answer).toBe(mirror(s.answer));
  }
  expect(BS.SCENES.filter(s=>s.level===4).every(s=>s.timed)).toBe(true);
});

test('progression : niveau débloqué à 8 sur 10, scènes ratées revues le lendemain, journal QI valide', ()=>{
  let qi=QI.initialQi();
  const l1=BS.SCENES.filter(s=>s.level===1);
  for(let n=0;n<10;n++){const s=l1[n%l1.length];qi=BS.record(qi,s,n<8?s.answer:'shoot'===s.answer?'drive-left':'shoot',{now:'2026-10-10'}).qi;}
  expect(BS.level(qi)).toBe(2);
  const missed=BS.SCENES.find(s=>s.id==='help-comes-left');
  qi=BS.record(qi,missed,'finish',{now:'2026-10-10'}).qi;
  expect(BS.due(qi,'2026-10-10').map(s=>s.id)).not.toContain('help-comes-left');
  expect(BS.due(qi,'2026-10-11').map(s=>s.id)).toContain('help-comes-left');
  // Les scènes à revoir passent en tête de la série du jour.
  const due=BS.due(qi,'2026-10-11').map(s=>s.id),set=BS.nextSet(qi,{now:'2026-10-11'}).scenes.map(s=>s.id);
  expect(set.slice(0,due.length)).toEqual(expect.arrayContaining(due.filter((id,i)=>due.findIndex(x=>BS.byId(x).template===BS.byId(id).template)===i)));
  // Les réponses passent la validation du QI (sauvegarde) et comptent dans le journal.
  expect(QI.validateQi(qi).answers.filter(a=>a.mode==='scene').length).toBe(11);
});

async function seed(page){
  const s=PT.initialState();s.profile.onboarded=true;s.player=JP.validatePlayer({position:'meneur'});
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('seeded','1');}},{data:s,key:PT.STORAGE_KEY});
}
test('écran 3D : image figée, décision, rejeu expliqué, réponse enregistrée', async({page})=>{
  await seed(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:320,height:740});
  await page.goto('/#qi');
  await page.getByRole('button',{name:/Lis ton défenseur/}).click();
  await expect(page.locator('.scene-3d canvas')).toHaveCount(1,{timeout:15000});
  // Joueurs réalistes chargés (pas le repli stylisé).
  await expect(page.locator('.scene-3d')).toHaveAttribute('data-model','real',{timeout:15000});
  await expect(page.locator('.scene-status.is-freeze')).toBeVisible({timeout:8000});
  await page.locator('.scene-option').first().click();
  await expect(page.locator('.scene-feedback')).toBeVisible();
  await expect(page.locator('.scene-option.is-answer')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.waitForTimeout(400);
  const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).qi.answers.filter(a=>a.mode==='scene').length,PT.STORAGE_KEY);
  expect(saved).toBe(1);
  await page.getByRole('button',{name:/Scène suivante/}).click();
  await expect(page.locator('.scene-status.is-freeze')).toBeVisible({timeout:8000});
  expect(errors).toEqual([]);
});

test('sans WebGL : vue de dessus avec les mêmes indices', async({page})=>{
  await seed(page);
  await page.addInitScript(()=>{const orig=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...a){return /webgl/.test(type)?null:orig.call(this,type,...a);};});
  await page.goto('/#qi-scene');
  await expect(page.locator('.scene-2d')).toBeVisible({timeout:15000});
});

test('jamais de série vide : scènes du jour reproposées quand tout le niveau a été vu', ()=>{
  let qi=QI.initialQi();const d='2026-10-11';
  for(const s of BS.SCENES.filter(s=>s.level===1)) qi=BS.record(qi,s,s.answer,{now:d}).qi;
  const set=BS.nextSet(qi,{now:d});
  expect(set.scenes.length).toBe(5);
  expect(set.replay).toBe(true);
  expect(BS.nextSet(QI.initialQi(),{now:d}).replay).toBe(false);
});

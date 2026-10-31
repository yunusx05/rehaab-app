const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const BP=require('../basket-pathway.js');
const AP=require('../athletic-profile.js');

function joueur(){
  const s=PT.initialState();s.profile.onboarded=true;s.profile.name='Yunus';
  s.player=JP.validatePlayer({position:'meneur',archetypes:['createur']});s.pathway=BP.create({startStep:2});
  // Bilan : une réponse (souffle « cuit ») et deux mesures de saut, la seconde en progrès.
  let a=AP.create?AP.create():{answers:{},tests:{}};a={...a,answers:{...(a.answers||{}),engine:'cooked',jump:'less'}};
  a=AP.recordTest(a,'vertical',{value:40},'2026-09-01');a=AP.recordTest(a,'vertical',{value:44},'2026-10-01');
  s.athletic=a;return s;
}
async function open(page,data,route,width){
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.setViewportSize({width,height:860});await page.goto('/#'+route);
}

test('photos de l’interface : présentes, précachées, sourcées', ()=>{
  const root=path.join(__dirname,'..'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),src=JSON.parse(fs.readFileSync(path.join(root,'media/ui/SOURCES.json'),'utf8'));
  for(const f of fs.readdirSync(path.join(root,'media/ui/hub'))){
    expect(sw).toContain(`'./media/ui/hub/${f}'`);
    expect(Object.values(src).some(x=>x.file===`media/ui/hub/${f}`),f).toBe(true);
  }
});

test('accueil, hub Plan et Moi : photos, carte joueur fidèle au bilan, sans débordement de 320 à 1440 px', async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const data=joueur();
  for(const width of [320,430,1440]){
    await open(page,data,'today',width);
    await expect(page.locator('.week-hub .today-plan')).toHaveCount(1);
    await expect(page.locator('.home-blocks .home-tile')).toHaveCount(4);
    await expect(page.locator('.radar-block')).toHaveCount(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.goto('/#pathway');
    await expect(page.locator('.plan-arsenal .image-tile')).toHaveCount(8);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.goto('/#profile');
    await expect(page.getByRole('heading',{name:'Moi.'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  }
  const card=page.locator('.player-card');
  await expect(card).toContainText('YUNUS');
  await expect(card.locator('.player-card-number')).toHaveText('1');
  // Souffle : « à travailler » d'après la réponse ; détente : mesurée et en progrès. Aucune note chiffrée inventée.
  const souffle=card.locator('li',{hasText:'Souffle'});
  await expect(souffle).toContainText('À travailler');await expect(souffle).toContainText('d’après ta réponse');
  const detente=card.locator('li',{hasText:'Détente'});
  await expect(detente.locator('.stat-trend.is-up')).toHaveCount(1);
  await expect(detente).toContainText('test');
  // Toile d'araignée : 6 qualités + le tir.
  await expect(card.locator('.player-radar .radar-label')).toHaveCount(7);
  await expect(card.locator('.player-radar')).toContainText('Tir');
  await expect(page.getByRole('heading',{name:'Mes questionnaires'})).toBeVisible();
  expect(await card.locator('.player-card-stats').textContent()).not.toMatch(/\b\d{2}\s*\/\s*99\b|OVR/);
  expect(errors).toEqual([]);
});

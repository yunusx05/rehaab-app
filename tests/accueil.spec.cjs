// Lot 23 : accueil sans défilement, « Ma semaine » au centre, blocs warm-up / étirements / quick rehab, toile → carte joueur, activation du bas du corps.
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const BP=require('../basket-pathway.js');
const AP=require('../athletic-profile.js');
const RW=require('../rehab-warmup.js');

const home=['bodyweight','dumbbells','kettlebell','barbell','bench','bands','bike','court'];
function player(){
  const data=PT.initialState();
  data.profile.onboarded=true;data.profile.name='Yunus';data.profile.experience='returning';
  data.owned=home;data.checkIn.equipment=home;
  data.player=JP.validatePlayer({position:'meneur',archetypes:['slasher'],layoff:'long'});
  data.pathway=BP.create();
  data.athletic={...AP.create(),answers:{jump:'much',firststep:'slow',brake:'stable',landing:'quiet',contact:'solid',engine:'match',strength:'regular',squat:'heels',stiff:['ankle'],mindset:'careful'}};
  return data;
}
async function seed(page,data,size={width:390,height:844}){
  await page.setViewportSize(size);
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('seeded','1');}},{data,key:PT.STORAGE_KEY});
}
const state=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);

test('activation du bas du corps : du pied à la hanche, chaque jour différente, sans impact si le genou fait mal',()=>{
  const data=player();
  const plan=RW.warmupPlan(PT,JP,data,'activation');
  expect(plan.error).toBeUndefined();
  expect(plan.title).toBe('Warm Up · Activation bas du corps');
  expect(plan.exercises.length).toBeGreaterThanOrEqual(7);
  expect(plan.estimatedMinutes).toBeLessThanOrEqual(15);
  // L'ordre : montée en température, mobilité, pieds/chevilles, puis hanches.
  const ids=plan.exercises.map(e=>e.id);
  expect(RW.POOLS.mobLegs).toContain(ids[1]);
  const foot=ids.findIndex(id=>['tibialis','single-calf','calf','ankle-mob'].includes(id)),hip=ids.findIndex(id=>['single-bridge','monster-walk','hip-abduction','clamshell','bridge'].includes(id));
  expect(foot).toBeGreaterThan(1);expect(hip).toBeGreaterThan(foot);
  expect(plan.exercises.filter(e=>e.unilateral).length).toBeGreaterThanOrEqual(2);
  const tomorrow=RW.warmupPlan(PT,JP,data,'activation',{date:PT.dateKey(new Date(Date.now()+86400000))});
  expect(tomorrow.exercises.map(e=>e.id)).not.toEqual(ids);
  // Remise en route sans impacts : pas de rebonds.
  const quiet={...data,checkIn:{...data.checkIn,constraints:['no-impact']}};
  expect(RW.warmupPlan(PT,JP,quiet,'activation').exercises.some(e=>e.impact)).toBe(false);
});

for(const size of [{width:390,height:844},{width:375,height:667}])
test(`accueil : tout tient dans l'écran sans défiler (${size.width}×${size.height})`,async({page})=>{
  await seed(page,player(),size);
  await page.goto('/#today');
  await expect(page.locator('.week-hub')).toBeVisible({timeout:20000});
  // Plus de grande carte photo de séance : la séance du jour vit dans « Ma semaine ».
  await expect(page.locator('.today-plan.has-photo')).toHaveCount(0);
  await expect(page.locator('.week-hub .week-strip')).toBeVisible();
  await expect(page.locator('.week-hub .today-plan').getByRole('button',{name:/Préparer ma séance/})).toBeVisible();
  await expect(page.locator('.home-blocks .home-tile')).toHaveCount(4);
  // La toile de progression est sous « Ma séance » ; Lire le jeu et Ma carte ne sont plus des tuiles.
  await expect(page.locator('.radar-block .player-radar.is-mini')).toBeVisible();
  await expect(page.locator('.home-blocks').getByRole('button',{name:/Lire le jeu|Ma carte/})).toHaveCount(0);
  await page.waitForTimeout(700);
  const m=await page.evaluate(()=>({scroll:document.documentElement.scrollHeight,inner:innerHeight,tiles:document.querySelector('.home-blocks').getBoundingClientRect().bottom,nav:document.querySelector('.bottom-nav').getBoundingClientRect().top}));
  expect(m.scroll).toBeLessThanOrEqual(m.inner+1);
  expect(m.tiles).toBeLessThanOrEqual(m.nav);
});

test('accueil : les blocs ouvrent leurs entraînements, l’activation se lance, la toile ouvre la carte joueur',async({page})=>{
  await seed(page,player());
  await page.goto('/#today');
  const tiles=page.locator('.home-blocks');
  await expect(tiles).toBeVisible({timeout:20000});

  await tiles.getByRole('button',{name:/Warm-up/}).click();
  await expect(page.getByRole('heading',{name:'Avant de jouer.'})).toBeVisible();
  await expect(page.locator('.routine-grid .preset-workout').first()).toContainText('Activation bas du corps');
  await expect(page.locator('.routine-grid .preset-workout')).toHaveCount(RW.warmups.length);
  await page.getByRole('button',{name:'Retour'}).click();

  await tiles.getByRole('button',{name:/Étirements/}).click();
  await expect(page.getByRole('heading',{name:'Après l’effort.'})).toBeVisible();
  await expect(page.locator('.routine-grid')).toContainText('Étirements ciblés');
  await page.getByRole('button',{name:'Retour'}).click();

  await tiles.getByRole('button',{name:/Quick rehab/}).click();
  await expect(page.getByRole('heading',{name:'Une douleur, un protocole.'})).toBeVisible();
  await expect(page.locator('.routine-grid')).toContainText('Trouver mon protocole');
  await page.getByRole('button',{name:'Retour'}).click();

  // La toile (sous « Ma séance ») montre la progression ; un appui ouvre la carte joueur.
  await expect(page.locator('.radar-block .radar-shape')).toHaveCount(1);
  await expect(page.locator('.radar-block-list li')).toHaveCount(7);
  await page.locator('.radar-block').click();
  await expect(page.locator('.player-card')).toBeVisible();
  await expect(page.locator('.player-card .player-radar')).toBeVisible();
  await page.getByRole('button',{name:'Retour'}).click();

  await tiles.getByRole('button',{name:/Activation/}).click();
  await expect.poll(async()=>(await state(page)).draft?.warmupId).toBe('activation');
});

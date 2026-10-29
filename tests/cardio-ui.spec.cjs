const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const BP=require('../basket-pathway.js');
const BC=require('../basket-cardio.js');

const home=['bodyweight','bike','rope','court'];
function joueur(){
  const s=PT.initialState();
  s.profile.onboarded=true;s.profile.name='Yunus';s.profile.experience='regular';s.profile.impactReady=true;
  s.owned=home;s.checkIn.equipment=home;
  s.player=JP.validatePlayer({position:'meneur'});
  s.pathway=BP.create({startStep:3});
  s.seasonPlan={resetWeeks:0};
  return s;
}
const seed=(page,data)=>page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('seeded','1');}},{data,key:PT.STORAGE_KEY});

test('planning : le cardio apparaît, le joueur règle la fréquence et le nombre de séances suit',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await seed(page,joueur());
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#calendar');
  await expect(page.getByRole('heading',{name:'Mon planning.'})).toBeVisible();
  await expect(page.locator('.calendar-item',{hasText:'Cardio · corde à sauter'}).first()).toBeVisible();
  await expect(page.locator('.calendar-item',{hasText:'Cardio · course fractionnée'}).first()).toBeVisible();
  // Réglage dans « Ma semaine type » : 0 retire le cardio du planning.
  await page.getByText('Ma semaine type').click();
  const row=page.locator('.topline',{hasText:'Cardio (corde, course) / semaine'});
  await expect(row.getByRole('button',{name:'2'})).toHaveAttribute('aria-pressed','true');
  await row.getByRole('button',{name:'0'}).click();
  await expect(page.locator('.calendar-item',{hasText:'Cardio ·'})).toHaveCount(0);
  await row.getByRole('button',{name:'1'}).click();
  await expect(page.locator('.calendar-item',{hasText:'Cardio ·'})).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('séance cardio : l’aperçu s’ouvre, démarre et arrive à l’écran « Prêt ? » sans erreur',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const s=joueur();
  const plan=BC.plan(PT,JP,s,'rope');
  expect(plan.error).toBeUndefined();
  s.draft=plan;
  await seed(page,s);
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#preview');
  await expect(page.getByRole('heading',{name:'Cardio · corde à sauter'})).toBeVisible();
  await expect(page.getByText('Niveau 1 sur 4')).toBeAttached(); // dans « Pourquoi cette séance », repliée
  // Comme toute séance : le bilan du coach (« Rien à signaler ») déverrouille le démarrage.
  await page.getByRole('button',{name:'Rien à signaler'}).click();
  await page.getByRole('button',{name:'Démarrer la séance'}).click();
  await expect(page.getByRole('button',{name:'Je suis prêt'})).toBeVisible();
  expect(errors).toEqual([]);
});

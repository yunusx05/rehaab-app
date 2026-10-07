const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const BP=require('../basket-pathway.js');

const home=['bodyweight','dumbbells','kettlebell','barbell','bench','bands','bike','court'];
function player(){
  const data=PT.initialState();
  data.profile.onboarded=true;data.profile.name='Test';data.profile.experience='returning';
  data.owned=home;data.checkIn.equipment=home;
  data.player=JP.validatePlayer({position:'meneur',archetypes:['slasher'],layoff:'long'});
  data.pathway=BP.create();
  return data;
}
async function seed(page,data,route){
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(data));localStorage.setItem('rh_coach_token','secret');sessionStorage.setItem('test-seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.goto('/#'+route);await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
async function state(page){await page.waitForTimeout(300);return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}
async function checkin(page,{pain=true,level=4}={}){
  await page.getByRole('button',{name:'Fatigué',exact:true}).click();
  await page.getByRole('button',{name:'Moyenne',exact:true}).click();
  await page.getByRole('button',{name:'Légères',exact:true}).click();
  const painQ=page.locator('.coach-q',{hasText:'Une douleur ?'});
  if(pain){
    await painQ.getByRole('button',{name:'Oui',exact:true}).click();
    await painQ.getByRole('button',{name:'Genou',exact:true}).click();
    await painQ.getByLabel(/Intensité/).fill(String(level));
  } else await painQ.getByRole('button',{name:'Non',exact:true}).click();
  const hier=page.locator('.coach-q',{hasText:'Basket hier ?'});
  await hier.getByRole('button',{name:'Match',exact:true}).click();
  await hier.getByRole('button',{name:'Dur',exact:true}).click();
  await page.locator('.coach-q',{hasText:'Basket prévu bientôt ?'}).getByRole('button',{name:'Non',exact:true}).click();
}

test('coach : bilan envoyé avec l’historique, séance allégée appliquée sans la zone douloureuse',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  const data=player();
  data.sessions.push({id:'s1',date:PT.dateKey(new Date(Date.now()-864e5)),title:'Fondations · Force',source:'pathway',focus:'muscle',format:'classic',minutes:40,effort:7,exercises:[PT.catalog.find(e=>e.id==='goblet')],entries:{goblet:[]},completedAt:new Date().toISOString(),partial:false,nextDay:'same',nextDayPending:false});
  let sent=null;
  await page.route('**/api/coach',async route=>{sent=route.request().postDataJSON();await route.fulfill({json:{message:'Match dur hier et genou sensible : on allège.',questions:['La douleur est-elle apparue pendant le match ?'],plan:{decision:'light',intensity:'reduced',setsFactor:.5,restFactor:1.2,minutes:25,avoidRegions:[],avoidImpact:true,rehabRegion:'',why:'Fatigue et genou sensible.'}}});});
  await seed(page,data,'today');
  await expect(page.locator('.bottom-nav button')).toHaveText(['Aujourd’hui','Parcours','Coach','QI','Profil']);
  await page.locator('.coach-card').getByRole('button',{name:/Faire mon bilan/}).click();
  await expect(page.getByRole('heading',{name:'Comment tu te sens ?'})).toBeVisible();
  await page.getByRole('button',{name:/Envoyer au coach/}).click();
  await expect(page.getByRole('alert')).toContainText('Réponds à chaque question');
  await checkin(page);
  await page.getByRole('button',{name:/Envoyer au coach/}).click();
  await expect(page.locator('.bubble.coach')).toContainText('on allège');
  await expect(page.locator('.bubble.coach')).toContainText('pendant le match');
  // Le coach reçoit le bilan en clair et la séance faite hier dans l'app.
  expect(sent.token).toBe('secret');
  expect(sent.messages[0].text).toContain('genou à 4/10');
  expect(sent.context.recentSessions[0]).toMatchObject({daysAgo:1,title:'Fondations · Force',effort:7});
  expect(sent.context.plannedSession.exercises.length).toBeGreaterThan(0);
  // Garde-fou : la zone douloureuse est épargnée même si l'IA l'oublie.
  await expect(page.locator('.coach-plan')).toContainText('Zones épargnées : Genou');
  await page.screenshot({path:'test-results/coach-reponse.png',fullPage:true});
  await page.getByRole('button',{name:/Appliquer à ma séance/}).click();
  await expect(page.getByRole('button',{name:'Démarrer la séance'})).toBeVisible();
  const saved=await state(page);
  expect(saved.draft.exercises.every(e=>!e.regions.includes('knee')&&!e.impact)).toBe(true);
  expect(saved.coachLog).toHaveLength(1);expect(saved.coachLog[0].applied).toBe(true);
  expect(saved.checkIn.energy).toBe('low');
  await page.goto('/#today');
  await expect(page.locator('.coach-card.done')).toContainText('Séance allégée');
  expect(errors).toEqual([]);
});

test('coach : douleur forte = repos imposé, même si l’IA propose de s’entraîner',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('**/api/coach',route=>route.fulfill({json:{message:'Allez, séance normale !',questions:[],plan:{decision:'normal',intensity:'normal',setsFactor:1,restFactor:1,minutes:30,avoidRegions:[],avoidImpact:false,rehabRegion:'',why:'En forme.'}}}));
  await seed(page,player(),'coach');
  await checkin(page,{level:8});
  await page.getByRole('button',{name:/Envoyer au coach/}).click();
  await expect(page.locator('.coach-plan h2')).toHaveText('Repos');
  await page.getByRole('button',{name:/OK, repos aujourd’hui/}).click();
  expect((await state(page)).draft).toBeNull();
});

test('coach : hors ligne, règles simples de repli',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('**/api/coach',route=>route.abort());
  await seed(page,player(),'coach');
  await checkin(page,{pain:false});
  await page.getByRole('button',{name:/Envoyer au coach/}).click();
  await expect(page.locator('.bubble.coach')).toContainText('hors ligne');
  await expect(page.locator('.coach-plan h2')).toHaveText('Séance allégée');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

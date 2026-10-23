// Lot 19 « séance fluide » : rien ne part avant « Je suis prêt », les côtés s'enchaînent seuls, « Fait » sans questions,
// vidéo sans contrôles natifs, matériel annoncé, séance validée sur l'accueil, barre du bas sans transform.
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');

function base(){const data=PT.initialState();data.profile.onboarded=true;data.profile.name='Test';data.profile.experience='regular';data.owned=['bodyweight','dumbbells','bench'];data.checkIn.equipment=data.owned;return data;}
function plan(data,ids,{seconds,sets=1}={}){
  const exercises=ids.map(id=>{const e=PT.makePrescription(PT.catalog.find(x=>x.id===id),'classic',30,PT.context(data));e.sets=sets;if(seconds)e.seconds=seconds;e.rest=20;return e;});
  return {id:'fluide',title:'Séance fluide',exercises,format:'classic',focus:'muscle',source:'generated',check:data.checkIn,warmupSeconds:0,entries:{},status:'preview',reasons:[]};
}
// Même état que « Démarrer la séance » : chrono à l'arrêt, écran Prêt ?.
function started(data,p){const d=PT.startDraft(p,data);return {...d,ready:false,clockStarted:null,stageStarted:null,timer:{...d.timer,endAt:null}};}
async function seed(page,data,route){
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#'+route);await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
async function state(page){await page.waitForTimeout(300);return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}

test('séance : rien ne tourne avant « Je suis prêt », puis côté gauche → change de côté → côté droit, seul',async({page})=>{
  test.setTimeout(60000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const data=base();data.draft=started(data,plan(data,['side-plank'],{seconds:3}));
  await seed(page,data,'session');
  await expect(page.locator('.gear-list')).toContainText('poids du corps');
  await page.waitForTimeout(1200);
  expect((await state(page)).draft.clockStarted).toBeNull();
  await page.getByRole('button',{name:'Je suis prêt',exact:true}).click();
  await expect(page.getByRole('timer')).toHaveAttribute('aria-label',/^Prépare-toi/);
  await page.getByRole('button',{name:'C’est parti',exact:true}).click();
  await expect(page.locator('.side-badge')).toHaveText('Côté gauche');
  await expect(page.locator('.live-countdown')).toContainText('Change de côté',{timeout:8000});
  await expect(page.locator('.side-badge')).toHaveText('Côté droit',{timeout:9000});
  // Fin du second côté : série validée seule, puis l'écran de bilan (dernière série).
  await expect(page.getByRole('heading',{name:'Bien joué.'})).toBeVisible({timeout:9000});
  expect((await state(page)).draft.entries['side-plank'][0]).toMatchObject({done:true,seconds:'3'});
  expect(errors).toEqual([]);
});

test('séance : unilatéral en répétitions, « Fait » vaut pour un côté, puis l’autre',async({page})=>{
  const data=base();const p=plan(data,['reverse-lunge'],{sets:2});data.draft=started(data,p);
  await seed(page,data,'session');
  await page.getByRole('button',{name:'Je suis prêt',exact:true}).click();
  await page.getByRole('button',{name:'C’est parti',exact:true}).click();
  await expect(page.locator('.side-badge')).toHaveText('Côté gauche');
  await expect(page.locator('.live-why')).not.toBeEmpty();
  await page.getByRole('button',{name:'Fait · côté gauche',exact:true}).click();
  await expect(page.locator('.live-countdown')).toContainText('Change de côté');
  await page.getByRole('button',{name:'C’est parti',exact:true}).click();
  await expect(page.locator('.side-badge')).toHaveText('Côté droit');
  await page.getByRole('button',{name:'Fait',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.rest-screen')).toBeVisible();
  const row=(await state(page)).draft.entries['reverse-lunge'][0];
  expect(row.done).toBe(true);expect(Number(row.left)).toBeGreaterThan(0);expect(row.left).toBe(row.right);
});

test('séance : « Fait » sans charge connue valide quand même, sans ouvrir la saisie',async({page})=>{
  const data=base();const p=plan(data,['db-press'],{sets:2});data.draft=started(data,p);data.draft.entries['db-press'].forEach(r=>r.weight='');
  await seed(page,data,'session');
  await page.getByRole('button',{name:'Je suis prêt',exact:true}).click();
  await page.getByRole('button',{name:'C’est parti',exact:true}).click();
  await page.getByRole('button',{name:'Fait',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.rest-screen')).toBeVisible();
  expect((await state(page)).draft.entries['db-press'][0]).toMatchObject({done:true,weight:'',result:'passed'});
});

test('vidéo : en boucle, sans contrôles natifs, un seul bouton pause',async({page})=>{
  const data=base();data.draft=started(data,plan(data,['curl']));
  await seed(page,data,'session');
  await page.getByRole('button',{name:'Je suis prêt',exact:true}).click();
  const video=page.locator('.live-visual video');
  await expect(video).toHaveCount(1);
  expect(await video.evaluate(v=>({controls:v.hasAttribute('controls'),loop:v.loop,muted:v.muted}))).toEqual({controls:false,loop:true,muted:true});
  await expect(page.locator('.live-visual .demo-pause')).toBeVisible();
  await expect(page.locator('.live-visual .demo-controls')).toHaveCount(0);
});

test('aperçu : le matériel de la séance est annoncé avant de démarrer',async({page})=>{
  const data=base();const p=plan(data,['curl','db-press']);p.precheck={status:'ok'};data.draft=p;
  await seed(page,data,'preview');
  const gear=page.locator('.gear-list');
  await expect(gear).toContainText('Haltères');await expect(gear).toContainText('Banc');
  await gear.getByRole('button',{name:/Haltères/}).click();
  await expect(gear).toContainText('1/2 prêt');
});

test('accueil : la séance du jour apparaît validée, et la barre du bas n’utilise plus de transform',async({page})=>{
  const data=base();data.sessions=[{id:'s1',date:PT.dateKey(),title:'Force basket',source:'pathway',minutes:42,effort:7,exercises:[],entries:{a:[{done:true},{done:true}]},partial:false}];
  await seed(page,data,'today');
  const card=page.locator('.done-today');
  await expect(card).toContainText('Séance du jour validée');await expect(card).toContainText('Force basket');await expect(card).toContainText('2 séries');
  expect(await page.locator('.bottom-nav').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
  await card.getByRole('button',{name:'Voir le détail'}).click();
  await expect(page).toHaveURL(/#history\/s1$/);
});

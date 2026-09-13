const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');

function fixture({timed=false,format='classic'}={}){
  const data=PT.initialState();data.profile.onboarded=true;data.profile.name='Test';data.profile.experience='regular';
  data.owned=['bodyweight','dumbbells','bench'];data.checkIn.equipment=data.owned;
  const e=PT.makePrescription(PT.catalog.find(e=>e.id===(timed?'plank':'curl')),format,30,PT.context(data));e.sets=2;e.seconds=30;
  const plan={id:'live-test',title:'Circuit de vérification',exercises:[e],format,focus:'muscle',source:'generated',check:data.checkIn,warmupSeconds:60,entries:{},status:'preview',reasons:[]};
  data.draft=PT.startDraft(plan,data);return data;
}
async function seed(page,data,route='session'){
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('test-seeded','1');}}, {data,key:PT.STORAGE_KEY});
  await page.goto('/#'+route);await expect(page.locator('.personal-app')).toBeVisible();
}
async function state(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}

test('catalogue : filtres combinés, aperçu vidéo, favoris et recherche sans accents',async({page})=>{
  await page.setViewportSize({width:390,height:844});const data=PT.initialState();data.profile.onboarded=true;
  await seed(page,data,'library');
  await page.getByLabel('Muscle',{exact:true}).selectOption('arms');
  await page.getByLabel('Matériel',{exact:true}).selectOption('dumbbells');
  await page.getByLabel('Rechercher un exercice',{exact:true}).fill('marteau');
  await expect(page.locator('.library-tile')).toHaveCount(1);
  await page.locator('.library-tile>.home-action').click();
  await expect(page.locator('.library-tile.expanded video')).toBeVisible();
  await expect.poll(()=>page.locator('.library-tile.expanded video').evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);
  await page.getByRole('button',{name:'J’aime',exact:true}).click();
  await page.reload();
  await page.getByLabel('Filtrer',{exact:true}).selectOption('liked');
  await expect(page.locator('.library-tile')).toHaveCount(1);
  await page.getByRole('button',{name:'Effacer les filtres'}).click();
  await page.getByLabel('Rechercher un exercice').fill('developpe');
  await expect(page.locator('.library-tile').first()).toBeVisible();
  await noOverflow(page);await page.screenshot({path:'test-results/catalogue-mobile.png',fullPage:true});
});

test('séance : action fixe, résultats validés, repos, pause persistée, bilan et récompense unique',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});await seed(page,fixture());
  await page.getByRole('button',{name:'Échauffement effectué',exact:true}).click();
  await expect(page.getByText('Exercice',{exact:false}).first()).toBeVisible();
  await expect(page.getByRole('timer')).toBeVisible();
  await expect(page.locator('.bottom-nav')).toBeHidden();
  const primary=page.getByRole('button',{name:'Terminé',exact:true});
  const box=await primary.boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(844);
  await page.screenshot({path:'test-results/seance-mobile.png'});
  await primary.click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Valider cette série'}).click();await expect(page.getByRole('alert')).toHaveText('Renseigne les répétitions réellement faites.');
  await page.getByLabel('Répétitions réalisées').fill('12');
  await page.getByLabel(/Charge \(/).fill('7.5');
  await page.getByRole('button',{name:'Oui, proprement',exact:true}).click();
  await page.getByLabel('Combien de répétitions aurais-tu encore pu faire ?').selectOption('2');
  await page.getByRole('button',{name:'Valider cette série'}).click();
  await expect(page.getByRole('timer')).toHaveAttribute('aria-label',/^Repos/);
  await expect.poll(async()=>(await state(page)).draft.entries.curl[0].done).toBe(true);
  await page.getByRole('button',{name:'Mettre en pause',exact:true}).click();
  const before=await state(page);await page.reload();
  await expect(page.getByRole('button',{name:'Reprendre la séance',exact:true})).toBeVisible();
  expect((await state(page)).draft.timer.remaining).toBe(before.draft.timer.remaining);
  await page.getByRole('button',{name:'Reprendre la séance',exact:true}).click();
  await page.getByRole('button',{name:'Passer à l’exercice 1',exact:true}).click();
  await primary.click();
  await page.getByLabel('Répétitions réalisées').fill('10');await page.getByLabel(/Charge \(/).fill('7.5');
  await page.getByRole('button',{name:'Oui, de justesse',exact:true}).click();await page.getByRole('button',{name:'Valider cette série'}).click();
  await expect(page.getByRole('heading',{name:'Bien joué.'})).toBeVisible();
  expect((await state(page)).draft.clockStarted).toBe(null);
  await page.getByRole('button',{name:'Effort 8 sur 10',exact:true}).click();
  await page.getByRole('button',{name:'Enregistrer ma séance',exact:true}).click();
  await expect(page.getByText('+50 points de régularité',{exact:true})).toBeVisible();
  await page.reload();const final=await state(page);
  expect(final.sessions).toHaveLength(1);expect(final.sessions[0].effort).toBe(8);expect(final.draft).toBeNull();
  expect(PT.context(final).hardRecently).toBe(true);expect(PT.context(final).low).toBe(true);
  const plan=PT.generate(final,{...final.checkIn,minutes:45,format:'hiit'});expect(plan.format).toBe('classic');expect(plan.exercises.every(e=>e.sets<=2)).toBe(true);
  await page.getByRole('button',{name:'Progression',exact:true}).click();
  await expect(page.locator('.earned-badge.unlocked')).toHaveCount(1);
  await noOverflow(page);expect(errors).toEqual([]);
});

test('petit écran : chronomètre de travail, dialogue clavier et retour à la séance',async({page})=>{
  await page.setViewportSize({width:320,height:568});await seed(page,fixture({timed:true,format:'hiit'}));
  await page.getByRole('button',{name:'Échauffement effectué',exact:true}).click();
  await expect(page.getByRole('timer')).toHaveAttribute('aria-label',/^Travail : 0:/);
  await noOverflow(page);await page.getByRole('button',{name:'Terminé',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();await noOverflow(page);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Terminé',exact:true}).click();await page.getByLabel('Secondes réalisées',{exact:true}).fill('20');
  await page.getByRole('button',{name:'Valider cette série'}).click();
  expect((await state(page)).draft.entries.plank[0].seconds).toBe('20');
});

test('démonstrations : réduction des animations et repli si une vidéo manque',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});const data=PT.initialState();data.profile.onboarded=true;
  await seed(page,data,'library');await page.getByLabel('Rechercher un exercice').fill('marteau');
  await expect(page.getByRole('button',{name:'Animer les aperçus'})).toBeVisible();
  await page.locator('.library-tile>.home-action').click();
  await expect(page.getByRole('button',{name:'Lire la démo'})).toBeVisible();
  expect(await page.locator('.library-tile.expanded video').evaluate(v=>v.paused)).toBe(true);
  await page.route('**/missing-demo.mp4',route=>route.abort());
  await page.getByLabel('Ma démonstration GIF / MP4',{exact:true}).fill('https://example.org/missing-demo.mp4');
  await page.getByRole('button',{name:'Enregistrer la démonstration',exact:true}).click();
  await expect(page.getByText('Démonstration indisponible',{exact:true})).toBeVisible();
  await expect(page.locator('.library-tile.expanded .instruction-list')).toBeVisible();
});

test('adaptation : effort récent seulement, aucune hausse automatique et règles de douleur conservées',()=>{
  const data=fixture();data.draft=null;
  const old=new Date();old.setDate(old.getDate()-3);
  const entry={id:'old',date:PT.dateKey(old),minutes:10,title:'Passée',effort:9,exercises:[],entries:{}};
  data.sessions=[entry];expect(PT.context(data).hardRecently).toBe(false);
  entry.date=PT.dateKey();expect(PT.context(data).low).toBe(true);
  data.symptoms=[{id:'pain',region:'knee',active:true,severity:8,date:PT.dateKey()}];
  expect(PT.generate(data).error).toBeTruthy();
  expect(PT.importBundle(JSON.stringify(PT.exportBundle(data))).state.sessions[0].effort).toBe(9);
});

test('hors connexion : catalogue, sauvegarde et lecture partielle des vidéos embarquées',async({page,context})=>{
  test.setTimeout(60000);
  const data=PT.initialState();data.profile.onboarded=true;
  await seed(page,data,'library');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await expect.poll(()=>page.evaluate(async()=>!!(await caches.match('/media/videos/curl.mp4')))).toBe(true);
  await context.setOffline(true);await page.reload();
  await expect(page.getByRole('heading',{name:/mouvements/i})).toBeVisible();
  await page.getByLabel('Rechercher un exercice').fill('marteau');await page.locator('.library-tile>.home-action').click();
  await expect.poll(()=>page.locator('.library-tile.expanded video').evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);
  const result=await page.evaluate(async()=>{const r=await fetch('/media/videos/curl.mp4',{headers:{Range:'bytes=100-199'}});return {status:r.status,length:(await r.arrayBuffer()).byteLength,range:r.headers.get('Content-Range')};});
  expect(result.status).toBe(206);expect(result.length).toBe(100);expect(result.range).toMatch(/^bytes 100-199\//);
  await context.setOffline(false);
});

test('rejouer un favori réinitialise le bilan et les chronos sans toucher au programme',()=>{
  const data=fixture(),prior={...data.draft,reviewing:true,blockTimer:{remaining:5},stageElapsed:120,clockStarted:null};
  const next=PT.startDraft(prior,data);
  expect(next.reviewing).toBe(false);expect(next.blockTimer).toBeNull();expect(next.stageElapsed).toBe(0);expect(next.timer.kind).toBe('warmup');
  expect(next.exercises.map(e=>e.id)).toEqual(prior.exercises.map(e=>e.id));expect(data.programWeek).toBe(1);
});

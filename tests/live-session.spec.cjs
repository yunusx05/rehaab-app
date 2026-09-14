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
async function setVisibility(page,value){await page.evaluate(value=>{Object.defineProperty(document,'visibilityState',{value,configurable:true});document.dispatchEvent(new Event('visibilitychange'));},value);}
// A muscle zone groups both body sides, so its bounding-box centre can fall on another zone: tap a point inside one side.
async function tapMuscle(page,label,[x,y]){const point=await page.getByRole('button',{name:label,exact:true}).evaluate((el,[x,y])=>{const p=el.ownerSVGElement.createSVGPoint();p.x=x;p.y=y;const s=p.matrixTransform(el.getScreenCTM());return {x:s.x,y:s.y};},[x,y]);await page.mouse.click(point.x,point.y);}

for(const width of [320,350,390,430,1280])test(`bibliothèque : stabilité du personnage à ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});const data=PT.initialState();data.profile.onboarded=true;
  await seed(page,data,'library');await page.evaluate(()=>document.fonts.ready);
  const bounds=()=>page.locator('.muscle-explorer').evaluate(el=>{
    const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
    return {card:rect(el),body:rect(el.querySelector('.body-map'))};
  });
  const initial=await bounds();
  const stable=async()=>{
    const current=await bounds();
    for(const part of ['card','body'])for(const key of ['x','y','width','height'])expect(Math.abs(current[part][key]-initial[part][key]),`${part}.${key}`).toBeLessThanOrEqual(1);
    expect(await page.locator('.muscle-copy h2').evaluate(el=>el.scrollHeight<=el.clientHeight+1&&el.scrollWidth<=el.clientWidth+1)).toBe(true);
    await noOverflow(page);
  };
  for(const [label,point] of [['Bras',[72,108]],['Pectoraux',[106,82]],['Quadriceps',[102,204]],['Abdominaux',[110,125]]]){
    await tapMuscle(page,label,point);await expect(page.getByRole('button',{name:label,exact:true})).toHaveAttribute('aria-pressed','true');await stable();
  }
  await tapMuscle(page,'Abdominaux',[110,125]);await stable();
  await page.getByRole('button',{name:'Voir de dos'}).click();await stable();
  await tapMuscle(page,'Ischio-jambiers',[102,204]);await stable();
  await page.screenshot({path:`test-results/muscle-stable-${width}.png`});
  await page.getByRole('button',{name:'Tout afficher',exact:true}).click();await stable();
  await expect(page.getByRole('button',{name:'Tout afficher',exact:true})).toHaveCount(0);
});

test('catalogue : filtres combinés, aperçu vidéo, favoris et recherche sans accents',async({page})=>{
  await page.setViewportSize({width:390,height:844});const data=PT.initialState();data.profile.onboarded=true;
  await seed(page,data,'library');
  await tapMuscle(page,'Bras',[72,108]);
  await expect(page.getByRole('button',{name:'Bras',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByLabel('Matériel',{exact:true}).selectOption('dumbbells');
  await page.getByLabel('Rechercher un exercice',{exact:true}).fill('marteau');
  await expect(page.locator('.library-tile')).toHaveCount(1);
  await page.locator('.library-tile>.home-action').click();
  await expect(page.locator('.library-tile.expanded video')).toBeVisible();
  await expect.poll(()=>page.locator('.library-tile.expanded video').evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);
  await page.getByRole('button',{name:'J’aime',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:'Favoris',exact:true}).click();
  await expect(page.locator('.library-tile')).toHaveCount(1);
  await page.getByRole('button',{name:'Effacer les filtres'}).click();
  await page.getByLabel('Rechercher un exercice').fill('developpe');
  await expect(page.locator('.library-tile').first()).toBeVisible();
  await noOverflow(page);await page.screenshot({path:'test-results/catalogue-mobile.png',fullPage:true});
});

test('bibliothèque : carte des muscles au clavier et filtres rapides',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:320,height:568});const data=PT.initialState();data.profile.onboarded=true;
  await seed(page,data,'library');
  const count=async()=>Number((await page.locator('.library-count').textContent()).match(/\d+/)[0]);
  const all=await count();
  const arms=page.getByRole('button',{name:'Bras',exact:true});
  await arms.focus();await page.keyboard.press('Enter');
  await expect(arms).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('heading',{name:'Bras',exact:true})).toBeVisible();
  await expect.poll(count).toBeLessThan(all);expect(await count()).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Voir de dos'}).click();
  await expect(page.getByRole('button',{name:'Ischio-jambiers',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Tout afficher'}).click();
  await expect.poll(count).toBe(all);
  const cardio=page.getByRole('button',{name:'Cardio',exact:true});
  await cardio.click();await expect(cardio).toHaveAttribute('aria-pressed','true');
  await expect.poll(count).toBeLessThan(all);expect(await count()).toBeGreaterThan(0);
  await noOverflow(page);await page.screenshot({path:'test-results/bibliotheque-320.png',fullPage:true});
  expect(errors).toEqual([]);
});

test('démonstration : lecture muette en boucle, pause hors écran ou onglet masqué, pause manuelle respectée',async({page})=>{
  await page.setViewportSize({width:390,height:844});const data=PT.initialState();data.profile.onboarded=true;
  await seed(page,data,'library');
  await page.getByLabel('Rechercher un exercice').fill('marteau');
  await page.locator('.library-tile>.home-action').click();
  const video=page.locator('.library-tile.expanded .demo video');
  await expect.poll(()=>video.evaluate(v=>!v.paused&&v.muted&&v.loop&&v.playsInline)).toBe(true);
  await setVisibility(page,'hidden');
  await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(true);
  await setVisibility(page,'visible');
  await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(false);
  await video.evaluate(v=>v.pause());
  await expect(page.getByRole('button',{name:'Lire la démo'})).toBeVisible();
  await setVisibility(page,'hidden');await setVisibility(page,'visible');
  await page.waitForTimeout(500);
  expect(await video.evaluate(v=>v.paused)).toBe(true);
  await page.getByRole('button',{name:'Lire la démo'}).click();
  await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(false);
  await page.evaluate(()=>{document.querySelector('.personal-app').style.paddingBottom='3000px';scrollTo(0,document.documentElement.scrollHeight);});
  await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(true);
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

test('séance : précédent, suivant et exercice à venir sans valider de résultat',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});await seed(page,fixture());
  await expect(page.locator('.next-up')).toContainText('Pour commencer');
  await page.getByRole('button',{name:'Échauffement effectué',exact:true}).click();
  await expect(page.locator('.live-step')).toContainText('Série 1 / 2');
  await expect(page.getByRole('button',{name:'Série précédente'})).toBeDisabled();
  await expect(page.locator('.next-up')).toContainText('Série 2 / 2');
  await page.getByRole('button',{name:'Passer cette série'}).click();
  await expect(page.locator('.live-step')).toContainText('Série 2 / 2');
  await expect(page.getByRole('button',{name:'Passer cette série'})).toBeDisabled();
  await expect(page.locator('.next-up')).toHaveCount(0);
  const skipped=await state(page);expect(skipped.draft.cursor).toBe(1);expect(skipped.draft.entries.curl.every(r=>!r.done)).toBe(true);
  await page.getByRole('button',{name:'Série précédente'}).click();
  await expect(page.locator('.live-step')).toContainText('Série 1 / 2');
  await page.getByRole('button',{name:'Mettre en pause',exact:true}).click();
  const shown=await page.getByRole('timer').getAttribute('aria-label');
  await page.waitForTimeout(1600);
  expect(await page.getByRole('timer').getAttribute('aria-label')).toBe(shown);
  await page.getByRole('button',{name:'Reprendre le chrono',exact:true}).click();
  await expect.poll(()=>page.getByRole('timer').getAttribute('aria-label')).not.toBe(shown);
  await noOverflow(page);await page.screenshot({path:'test-results/seance-commandes.png'});expect(errors).toEqual([]);
});

test('accueil sportif : la séance active est reprise, jamais remplacée',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});const data=fixture();
  await seed(page,data,'today');
  await expect(page.getByRole('heading',{name:/À toi de jouer/i})).toBeVisible();
  await expect(page.getByRole('button',{name:/Reprendre la séance/})).toBeVisible();
  await page.getByRole('button',{name:'Préparer cette séance',exact:true}).click();
  await expect(page).toHaveURL(/#session$/);
  await expect(page.getByText('Ta séance en cours est conservée.')).toBeVisible();
  expect((await state(page)).draft.id).toBe(data.draft.id);
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
  await expect(page.locator('.library-tile .movement-thumb img')).toHaveCount(1);
  await expect(page.locator('.library-tile .movement-thumb video')).toHaveCount(0);
  await page.locator('.library-tile>.home-action').click();
  await expect(page.getByRole('button',{name:'Lire la démo'})).toBeVisible();
  expect(await page.locator('.library-tile.expanded video').evaluate(v=>v.paused)).toBe(true);
  await expect(page.getByLabel(/démonstration GIF/i)).toHaveCount(0);
  await page.locator('.library-tile.expanded video').evaluate(v=>v.dispatchEvent(new Event('error')));
  await expect(page.getByText('Démonstration indisponible',{exact:true})).toBeVisible();
  await expect(page.locator('.library-tile.expanded .demo img')).toHaveCount(2);
  await expect(page.locator('.library-tile.expanded .instruction-list')).toBeVisible();
});

test('médias : chaque exercice du catalogue embarque une image ou une vidéo',()=>{
  const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),root=path.join(__dirname,'..');
  const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'exercise-media.js'),'utf8'),sandbox);
  const missing=PT.catalog.filter(e=>{const m=sandbox.window.RehaabMedia[e.id];return ![m?.video,m?.poster,m?.card,m?.frames&&`media/${m.frames}/0.jpg`].filter(Boolean).some(p=>fs.existsSync(path.join(root,p)));}).map(e=>e.id);
  expect(missing).toEqual([]);
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
  test.setTimeout(90000);
  const data=PT.initialState();data.profile.onboarded=true;
  await seed(page,data,'library');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await expect.poll(()=>page.evaluate(async()=>!!(await caches.match('/media/videos/curl.mp4'))),{timeout:30000}).toBe(true);
  await expect.poll(()=>page.evaluate(async()=>!!(await caches.match('/sport-components.jsx'))&&!!(await caches.match('/media/fonts/cabinet-500.woff2')))).toBe(true);
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

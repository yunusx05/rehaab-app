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
  await page.goto('/#'+route);await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
// L'app regroupe ses écritures (250 ms) : on attend la sauvegarde avant de la lire.
async function state(page){await page.waitForTimeout(300);return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
async function setVisibility(page,value){await page.evaluate(value=>{Object.defineProperty(document,'visibilityState',{value,configurable:true});document.dispatchEvent(new Event('visibilitychange'));},value);}
// A muscle zone groups both body sides, so its bounding-box centre can fall on another zone: tap a point inside one side.
async function tapMuscle(page,label,[x,y]){const point=await page.getByRole('button',{name:label,exact:true}).evaluate((el,[x,y])=>{const p=el.ownerSVGElement.createSVGPoint();p.x=x;p.y=y;const s=p.matrixTransform(el.getScreenCTM());return {x:s.x,y:s.y};},[x,y]);await page.mouse.click(point.x,point.y);}

test('séance : action fixe, résultats validés, repos, pause persistée, bilan et récompense unique',async({page})=>{
  test.setTimeout(90000); // trois chargements complets de l'app, chacun relance le précache du service worker
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});await seed(page,fixture());
  await page.getByRole('button',{name:'Échauffement effectué',exact:true}).click();
  await expect(page.getByText('Exercice',{exact:false}).first()).toBeVisible();
  // Série en répétitions : l'objectif s'affiche en grand, pas un chrono qui monte.
  await expect(page.locator('.live-target')).toContainText('répétitions');
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
  // Le repos a son propre écran : on sait qu'on récupère et ce qui vient ensuite.
  await expect(page.locator('.rest-screen')).toContainText('Repos');
  await expect(page.locator('.rest-next')).toContainText('Série 2 sur 2');
  await expect.poll(async()=>(await state(page)).draft.entries.curl[0].done).toBe(true);
  await page.getByRole('button',{name:'Mettre en pause',exact:true}).click();
  const before=await state(page);await page.reload();
  await expect(page.getByRole('button',{name:'Reprendre la séance',exact:true})).toBeVisible({timeout:20000});
  expect((await state(page)).draft.timer.remaining).toBe(before.draft.timer.remaining);
  await page.getByRole('button',{name:'Reprendre la séance',exact:true}).click();
  await page.getByRole('button',{name:'Passer le repos',exact:true}).click();
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
  await noOverflow(page);expect(errors).toEqual([]);
});

test('séance : précédent, suivant et exercice à venir sans valider de résultat',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});await seed(page,fixture({timed:true}));
  await expect(page.locator('.next-up')).toContainText('Pour commencer');
  await page.getByRole('button',{name:'Échauffement effectué',exact:true}).click();
  await expect(page.locator('.live-position')).toContainText('Série 1 sur 2');
  await expect(page.getByRole('button',{name:'Série précédente'})).toBeDisabled();
  await expect(page.locator('.next-up')).toContainText('Série 2 / 2');
  await page.getByRole('button',{name:'Passer cette série'}).click();
  await expect(page.locator('.live-position')).toContainText('Série 2 sur 2');
  await expect(page.getByRole('button',{name:'Passer cette série'})).toBeDisabled();
  await expect(page.locator('.next-up')).toHaveCount(0);
  const skipped=await state(page);expect(skipped.draft.cursor).toBe(1);expect(skipped.draft.entries.plank.every(r=>!r.done)).toBe(true);
  await page.getByRole('button',{name:'Série précédente'}).click();
  await expect(page.locator('.live-position')).toContainText('Série 1 sur 2');
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
  // Une séance en cours masque la séance du jour : on ne peut que la reprendre.
  await expect(page.locator('.today-plan')).toHaveCount(0);
  await page.getByRole('button',{name:/Reprendre la séance/}).click();
  await expect(page).toHaveURL(/#session$/);
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

// Portée volontairement restreinte : depuis le lot « programmes », le catalogue contient des
// exercices sans illustration (demande explicite de l'utilisateur). Le test vérifie donc que
// chaque média DÉCLARÉ pointe vers un fichier réellement présent, et que les exercices sans
// média restent utilisables grâce à leur repli textuel (consignes).
test('médias : chaque média déclaré pointe vers un fichier existant',()=>{
  const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),root=path.join(__dirname,'..');
  const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'exercise-media.js'),'utf8'),sandbox);
  const declared=PT.catalog.filter(e=>sandbox.window.RehaabMedia[e.id]);
  expect(declared.length).toBeGreaterThan(50);
  const missing=declared.filter(e=>{const m=sandbox.window.RehaabMedia[e.id];return ![m?.video,m?.poster,m?.card,m?.frames&&`media/${m.frames}/0.webp`].filter(Boolean).some(p=>fs.existsSync(path.join(root,p)));}).map(e=>e.id);
  expect(missing).toEqual([]);
});

test('catalogue : les exercices sans illustration gardent un repli textuel exploitable',()=>{
  const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),root=path.join(__dirname,'..');
  const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'exercise-media.js'),'utf8'),sandbox);
  const orphans=PT.catalog.filter(e=>!sandbox.window.RehaabMedia[e.id]);
  const weak=orphans.filter(e=>!Array.isArray(e.instructions)||e.instructions.length<2||e.instructions.some(t=>typeof t!=='string'||t.trim().length<15)||!e.name);
  expect(weak.map(e=>e.id)).toEqual([]);
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

test('hors connexion : accueil, sauvegarde et lecture partielle des vidéos embarquées',async({page,context})=>{
  test.setTimeout(90000);
  const data=PT.initialState();data.profile.onboarded=true;
  await seed(page,data,'today');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await expect.poll(()=>page.evaluate(async()=>!!(await caches.match('/media/videos/curl.mp4'))),{timeout:30000}).toBe(true);
  await expect.poll(()=>page.evaluate(async()=>!!(await caches.match('/compiled/sport-components.js'))&&!!(await caches.match('/media/fonts/cabinet-500.woff2')))).toBe(true);
  await context.setOffline(true);await page.reload();
  await expect(page.getByRole('heading',{name:/À toi de jouer/i})).toBeVisible({timeout:20000});
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

test('séance : position, écran de repos réglable, bips de chrono et plus de mode vocal',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    // Espion audio : chaque bip crée un oscillateur, on relève sa fréquence.
    window.__tones=[];const Real=window.AudioContext;
    window.AudioContext=class extends Real{createOscillator(){const o=super.createOscillator();const start=o.start.bind(o);o.start=(...a)=>{window.__tones.push(o.frequency.value);return start(...a);};return o;}};
  });
  await page.setViewportSize({width:390,height:844});
  const data=fixture({timed:true});data.draft.exercises[0].seconds=4;data.draft.exercises[0].rest=30;
  await seed(page,data);
  await expect(page.getByText(/annonces vocales/i)).toHaveCount(0);
  await expect(page.locator('.live-position')).toContainText('Échauffement');
  await page.getByRole('button',{name:'Échauffement effectué',exact:true}).click();
  await expect(page.locator('.live-position')).toContainText('Exercice 1 sur 1');
  await expect(page.locator('.live-position')).toContainText('Série 1 sur 2');
  await expect(page.locator('.live-progress .ex-seg.current i')).toHaveCount(2);
  // Chrono de travail de 4 s : bip de départ (880 Hz), 3-2-1 (660 Hz), fin (990 puis 1320 Hz).
  await expect.poll(()=>page.evaluate(()=>window.__tones.join(',')),{timeout:8000}).toContain('660,660,660,990,1320');
  expect(await page.evaluate(()=>window.__tones[0])).toBe(880);
  await page.getByRole('button',{name:'Terminé',exact:true}).click();
  await page.getByRole('button',{name:'Fait comme prévu'}).click();
  const rest=page.locator('.rest-screen');
  await expect(rest).toBeVisible();
  await expect(page.locator('.live-command')).toHaveCount(0);
  const seconds=async()=>{const [m,s]=(await rest.getByRole('timer').locator('strong').textContent()).split(':').map(Number);return m*60+s;};
  const before=await seconds();
  await rest.getByRole('button',{name:'+15 s'}).click();
  expect(await seconds()).toBeGreaterThanOrEqual(before+14);
  await rest.getByRole('button',{name:'−15 s'}).click();await rest.getByRole('button',{name:'−15 s'}).click();
  expect(await seconds()).toBeLessThanOrEqual(before-14);
  await page.screenshot({path:'test-results/seance-repos.png'});
  await page.getByRole('button',{name:'Passer le repos',exact:true}).click();
  await expect(page.locator('.rest-screen')).toHaveCount(0);
  await expect(page.locator('.live-position')).toContainText('Série 2 sur 2');
  await noOverflow(page);expect(errors).toEqual([]);
});

test('consignes : 3 étapes maximum, 12 mots maximum par étape',()=>{
  const long=PT.catalog.filter(e=>e.instructions.length>3||e.instructions.some(l=>l.split(/\s+/).length>12)).map(e=>e.id);
  expect(long).toEqual([]);
});

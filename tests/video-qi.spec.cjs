const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const QI=require('../basket-qi.js');

// Faux lecteur YouTube : le temps avance de 0,5 s toutes les 50 ms pendant la lecture. window.__yt donne la main au test.
const FAKE_YT=`window.YT={Player:class{constructor(el,o){this.t=o.playerVars.start||0;this.playing=false;this.rate=1;this.muted=false;this.opts=o;window.__yt=this;
  const f=document.createElement('iframe');f.title='lecteur factice';el.replaceWith(f);
  this.iv=setInterval(()=>{if(this.playing)this.t=Math.round((this.t+0.5*this.rate)*100)/100;},50);
  setTimeout(()=>o.events.onReady({target:this}),20);}
  getCurrentTime(){return this.t;} seekTo(t){this.t=t;} playVideo(){this.playing=true;} pauseVideo(){this.playing=false;}
  mute(){this.muted=true;} unMute(){this.muted=false;} setPlaybackRate(r){this.rate=r;} destroy(){clearInterval(this.iv);}}};
  window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady();`;
async function seed(page,data,route){
  await page.route('https://www.youtube.com/iframe_api',r=>r.fulfill({contentType:'text/javascript',body:FAKE_YT}));
  await page.route('https://i.ytimg.com/**',r=>r.fulfill({status:204}));
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('test-seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.goto('/#'+route);await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
async function state(page){await page.waitForTimeout(300);return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}
function base(){const d=PT.initialState();d.profile.onboarded=true;d.profile.name='Test';return d;}
const clip={id:'clip-test',yt:'dQw4w9WgXcQ',start:10,pause:13,end:16,title:'Pick & roll, aide du coin',theme:'pnr-handler',prompt:'Que doit faire le porteur ?',lesson:'L’aide du coin laisse le coin ouvert.',source:'',choices:[{text:'Passer au coin',ok:true,why:'Le défenseur du coin aide sur le roll.'},{text:'Tirer',ok:false,why:'Le défenseur revient.'}]};

test('lien YouTube : formats acceptés, minutage lu, autres sites refusés',()=>{
  expect(QI.parseYouTube('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s')).toEqual({id:'dQw4w9WgXcQ',start:90});
  expect(QI.parseYouTube('https://youtu.be/dQw4w9WgXcQ?t=42')).toEqual({id:'dQw4w9WgXcQ',start:42});
  expect(QI.parseYouTube('https://www.youtube.com/shorts/dQw4w9WgXcQ').id).toBe('dQw4w9WgXcQ');
  expect(QI.parseYouTube('https://notyoutube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
  expect(QI.clipError({...clip,pause:9})).toMatch(/dans cet ordre/);
  expect(QI.clipError({...clip,choices:clip.choices.map(c=>({...c,ok:true}))})).toMatch(/une seule/);
  expect(QI.validateQi({clips:[clip,{...clip,id:'x',yt:'pas-un-id'}]}).clips).toHaveLength(1);
});

test('vrais matchs : pause à l’instant de décision, réponse enregistrée, puis la suite',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  const data=base();data.qi=QI.saveClip(data.qi,clip);
  await seed(page,data,'qi-video');
  await page.goto('/#qi-video-run/clip-test');
  await page.getByRole('button',{name:'Lancer l’action'}).click();
  await expect(page.getByRole('timer')).toContainText('s pour choisir');
  expect(await page.evaluate(()=>({t:window.__yt.t,playing:window.__yt.playing}))).toEqual({t:13,playing:false});
  await page.getByRole('button',{name:'Passer au coin'}).click();
  await expect(page.locator('.qi-feedback.is-right')).toContainText('Le défenseur du coin aide sur le roll.');
  await expect(page.getByRole('button',{name:'Revoir au ralenti'})).toBeVisible();
  expect(await page.evaluate(()=>window.__yt.t)).toBeGreaterThanOrEqual(16);
  const s=await state(page);expect(s.qi.answers.at(-1)).toMatchObject({id:'clip-test',mode:'video',theme:'pnr-handler',correct:true});
  expect(errors).toEqual([]);
});

test('extrait en fichier : vidéo native, pause à l’instant de décision, sans lecteur YouTube',async({page})=>{
  const errors=[],youtube=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/youtube|ytimg/.test(r.url()))youtube.push(r.url());});
  await page.setViewportSize({width:390,height:844});
  await seed(page,base(),'qi');
  // Vidéo synthétique (mire de test) : les extraits de base passent par YouTube, le lecteur natif reste prêt.
  await page.evaluate(c=>{window.BasketQI.videoClips.push(c);location.hash='qi-video-run/clip-file';},{...clip,id:'clip-file',file:'tests/fixtures/clip.mp4',start:0,pause:3,end:6});
  await expect(page.locator('.qi-video-host video')).toHaveAttribute('src','tests/fixtures/clip.mp4');
  await page.getByRole('button',{name:'Lancer l’action'}).click();
  await expect(page.getByRole('timer')).toContainText('s pour choisir',{timeout:8000});
  expect(await page.evaluate(()=>{const v=document.querySelector('.qi-video-host video');return {paused:v.paused,t:Math.round(v.currentTime)};})).toEqual({paused:true,t:3});
  await page.getByRole('button',{name:'Passer au coin'}).click();
  await expect(page.locator('.qi-feedback.is-right')).toBeVisible();
  expect(youtube).toEqual([]);expect(errors).toEqual([]);
});

test('vrais matchs : sans réponse avant la fin du chrono, c’est compté comme raté',async({page})=>{
  await page.clock.install();
  const data=base();data.qi=QI.saveClip(data.qi,clip);
  await seed(page,data,'qi-video-run/clip-test');
  await page.clock.runFor(500);
  await page.getByRole('button',{name:'Lancer l’action'}).click();
  await page.clock.runFor(1000);
  await expect(page.getByRole('timer')).toBeVisible();
  await page.clock.runFor(7000);
  await expect(page.locator('.qi-feedback.is-wrong')).toContainText('Trop tard');
  expect((await state(page)).qi.answers.at(-1)).toMatchObject({id:'clip-test',correct:false});
});

test('éditeur : coller un lien, marquer trois instants, enregistrer',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await seed(page,base(),'qi-video-edit');
  await page.getByLabel('Lien YouTube').fill('https://youtu.be/dQw4w9WgXcQ?t=20');
  await expect(page.locator('.qi-video-host iframe')).toBeAttached();
  const mark=async(label,t)=>{await page.evaluate(t=>{window.__yt.t=t;},t);await page.locator('.clip-marker').filter({hasText:label}).getByRole('button',{name:'Maintenant'}).click();};
  await mark('Début',20);await mark('Instant de décision',24.5);await mark('Fin',29);
  await page.getByRole('button',{name:'Ajouter à ma vidéothèque'}).click();
  await expect(page.getByRole('alert')).toHaveText('Écris au moins deux réponses.');
  await page.getByLabel('Titre').fill('Contre-attaque 3 contre 2');
  await page.getByLabel('Réponse 1',{exact:true}).fill('Fixer et donner');await page.getByLabel('Réponse 2',{exact:true}).fill('Finir seul');
  await page.getByRole('button',{name:'Ajouter à ma vidéothèque'}).click();
  await expect(page.getByRole('heading',{name:'Vrais matchs.'})).toBeVisible();
  const saved=(await state(page)).qi.clips;
  expect(saved).toHaveLength(1);expect(saved[0]).toMatchObject({yt:'dQw4w9WgXcQ',start:20,pause:24.5,end:29,title:'Contre-attaque 3 contre 2'});
  expect(saved[0].choices).toHaveLength(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

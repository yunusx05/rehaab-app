/* Lot 18 : étirements, échauffement et retour au calme guidés, récupération ciblée, imprévus, intensité match. */
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const RW=require('../rehab-warmup.js');
const SK=require('../basket-skills.js');

const home=['bodyweight','dumbbells','bench','bands','court','ball'];
const tools=[...home,'massagegun','foamroller','tens'];
function athlete({owned=home,pains=[],profile=true}={}){
  const data=PT.initialState();
  data.profile.onboarded=true;data.profile.name='Test';
  data.owned=owned;data.checkIn.equipment=owned;
  if(profile) data.player=JP.validatePlayer({position:'meneur',archetypes:['slasher'],layoff:'long'});
  data.symptoms=pains.map((p,i)=>({id:`s${i}`,side:'right',onset:'known',redFlags:false,note:'',date:PT.dateKey(),active:true,followups:[],...p}));
  return data;
}
async function seed(page,data,route){
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('test-seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.goto('/#'+route);await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
async function state(page){await page.waitForTimeout(300);return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
const day=n=>{const d=new Date(Date.UTC(2026,9,1+n));return d.toISOString().slice(0,10);};

test('catalogue : rouleau et électrostimulation au matériel, tous les mouvements des routines existent',()=>{
  expect(PT.equipment.map(e=>e.id)).toEqual(expect.arrayContaining(['foamroller','tens']));
  const ids=new Set(PT.catalog.map(e=>e.id));
  Object.entries(RW.POOLS).forEach(([k,list])=>list.forEach(id=>expect(ids.has(id),`${k}:${id}`).toBe(true)));
  Object.entries(RW.bodyZones).forEach(([z,v])=>['release','mobile','stretch','tens'].forEach(k=>v[k].forEach(id=>expect(ids.has(id),`${z}:${id}`).toBe(true))));
  expect(PT.catalog.filter(e=>e.stretch==='dynamic').length).toBeGreaterThanOrEqual(12);
  expect(PT.catalog.filter(e=>e.stretch==='static').length).toBeGreaterThanOrEqual(15);
  // L'électrostimulation n'est jamais tirée au sort dans une séance générée, et porte ses contre-indications.
  const s=athlete({owned:tools});
  for(let i=0;i<20;i++) expect(PT.generate(s,{...s.checkIn,equipment:tools,focus:'mobility',minutes:45}).exercises.some(e=>e.tool==='tens')).toBe(false);
  PT.catalog.filter(e=>e.tool==='tens').forEach(e=>expect(e.warning).toContain('pacemaker'));
});

test('warm-up : même structure, mouvements différents d’un jour à l’autre, avec des étirements dynamiques',()=>{
  const s=athlete();
  RW.warmups.forEach(w=>{
    const days=[0,1,2,3,4,5,6].map(n=>RW.warmupPlan(PT,JP,s,w.id,{date:day(n)}));
    days.forEach(p=>{expect(p.error).toBeUndefined();expect(new Set(p.exercises.map(e=>e.id)).size).toBe(p.exercises.length);});
    expect(new Set(days.map(p=>p.exercises.map(e=>e.id).join())).size,w.id).toBeGreaterThanOrEqual(4);
    const mobile=new Set([...RW.POOLS.mobLegs,...RW.POOLS.mobUpper]);
    days.forEach(p=>expect(p.exercises.filter(e=>mobile.has(e.id)).length,w.id).toBeGreaterThanOrEqual(2));
  });
  // Même jour, même échauffement : on peut le relancer sans surprise.
  expect(RW.warmupPlan(PT,JP,s,'practice',{date:day(3)}).exercises.map(e=>e.id)).toEqual(RW.warmupPlan(PT,JP,s,'practice',{date:day(3)}).exercises.map(e=>e.id));
  // Retours au calme : étirements tenus.
  RW.cooldowns.forEach(c=>{const p=RW.warmupPlan(PT,JP,s,c.id);expect(p.error).toBeUndefined();expect(p.exercises.filter(e=>e.stretch==='static'||['calf-stretch','hamstring','hip-flexor','couch-stretch','pigeon','childs-pose','downdog'].includes(e.id)).length).toBeGreaterThanOrEqual(3);});
});

test('séance : échauffement guidé au début et retour au calme à la fin, adaptés à la séance',()=>{
  const s=athlete();
  const legs=PT.generate(s,{...s.checkIn,equipment:home,focus:'muscle',minutes:45});
  const r=RW.attachRoutines(PT,JP,s,legs);
  expect(r.warmupMoves.length).toBeGreaterThanOrEqual(3);
  expect(r.warmupMoves.every(e=>e.measure==='seconds'&&e.sets===1)).toBe(true);
  expect(r.warmupSeconds).toBeGreaterThan(120);
  expect(r.cooldownMoves.length).toBeGreaterThanOrEqual(4);
  expect(r.cooldownMoves[r.cooldownMoves.length-1].id).toBe('breath');
  // Pas de routine ajoutée à une rehab, un warm-up ou une récup : elles en sont déjà une.
  const w=RW.warmupPlan(PT,JP,s,'practice');
  expect(RW.attachRoutines(PT,JP,s,w).warmupMoves).toEqual([]);
  // Haut du corps : étirements du haut du corps en fin de séance.
  const upper={...legs,exercises:legs.exercises.map(()=>PT.catalog.find(e=>e.id==='db-press')).slice(0,1).concat(PT.catalog.filter(e=>['band-row','pushup'].includes(e.id)))};
  const u=RW.sessionRoutines(PT,JP,s,upper);
  expect(u.cooldown.some(e=>['doorway-chest','lat-stretch','cross-body','triceps-stretch'].includes(e.id))).toBe(true);
});

test('récup ciblée : chaque ressenti donne une séance, outils seulement s’ils sont possédés, douleurs respectées',()=>{
  for(const owned of [['bodyweight'],tools]) for(const feel of Object.keys(RW.feelings)){
    const s=athlete({owned});
    const p=RW.recoveryPlan(PT,JP,s,{feel,zones:feel==='tension'?['upperback','neck']:['calves','quads'],minutes:20});
    expect(p.error,`${feel}`).toBeUndefined();
    expect(p.source).toBe('recovery');
    p.exercises.forEach(e=>expect(e.needs.every(n=>owned.includes(n))).toBe(true));
    expect(p.exercises.some(e=>e.tool==='tens')).toBe(owned.includes('tens'));
  }
  const s=athlete({owned:tools});
  expect(RW.recoveryPlan(PT,JP,s,{feel:'heavy',zones:['calves'],tens:false}).exercises.some(e=>e.tool==='tens')).toBe(false);
  expect(RW.recoveryPlan(PT,JP,s,{feel:'heavy',zones:['calves']}).exercises.some(e=>e.id==='legs-up-wall')).toBe(true);
  // Un outil par zone au plus.
  const sore=RW.recoveryPlan(PT,JP,s,{feel:'sore',zones:['quads']});
  expect(sore.exercises.filter(e=>['foamroller','massagegun'].includes(e.tool)).length).toBe(1);
  // Genou douloureux : rien d'intolérable pour le genou.
  const knee=athlete({owned:tools,pains:[{region:'knee',severity:4}]});
  RW.recoveryPlan(PT,JP,knee,{feel:'sore',zones:['quads','calves']}).exercises.forEach(e=>expect(JP.tolerates(e,knee.symptoms)).toBe(true));
  expect(RW.recoveryPlan(PT,JP,athlete({pains:[{region:'back',severity:8}]}),{feel:'tired'}).error).toBeTruthy();
});

test('intensité match : tirs sous fatigue avec panier, jamais dans une séance skills ordinaire, refusée sur douleur',()=>{
  const s=athlete();s.skills=SK.blank();
  const no=SK.matchSession(PT,s,{minutes:30});
  expect(no.error).toBeUndefined();expect(no.exercises.some(e=>e.needs.includes('hoop'))).toBe(false);
  s.skills.hoopDate=PT.dateKey();
  const hoop=SK.matchSession(PT,s,{minutes:30});
  expect(hoop.source).toBe('match-intensity');
  expect(hoop.exercises.at(-1).id).toBe('mi-suicide-ft');
  expect(hoop.exercises.filter(e=>e.measure==='shots').length).toBeGreaterThanOrEqual(2);
  expect(hoop.estimatedMinutes).toBeLessThanOrEqual(36);
  for(let i=0;i<5;i++) expect(SK.session(PT,s,{minutes:60}).exercises.some(e=>e.intense)).toBe(false);
  const sore=athlete({pains:[{region:'knee',severity:4}]});sore.skills=SK.blank();
  expect(SK.matchSession(PT,sore,{minutes:30}).error).toBeTruthy();
});

test('écran : imprévu « grosse fatigue » → récup douce, pas un soin de douleur',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  await seed(page,athlete({owned:tools}),'mishap');
  await expect(page.getByRole('heading',{name:'Qu’est-ce qui se passe ?'})).toBeVisible();
  for(const label of ['Pas assez de temps','Grosse fatigue','Courbatures','Jambes lourdes','Une douleur','Pas de salle ni de matériel']) await expect(page.getByRole('button',{name:new RegExp(label)})).toBeVisible();
  await noOverflow(page);
  await page.getByRole('button',{name:/Grosse fatigue/}).click();
  await expect(page.getByLabel(/Finir par 15 min d’électrostimulation/)).toBeChecked();
  await page.getByRole('button',{name:/Lancer ma récup/}).click();
  await expect(page.getByRole('heading',{name:'Récup · Grosse fatigue'})).toBeVisible();
  const st=await state(page);
  expect(st.draft.source).toBe('recovery');
  expect(st.draft.exercises.some(e=>e.role==='rehab')).toBe(false);
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('écran : étirements ciblés sur le personnage, plusieurs zones, face et dos',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  await seed(page,athlete({owned:['bodyweight','foamroller']}),'stretch/tension');
  await page.getByRole('button',{name:'Quadriceps',exact:true}).press('Enter');
  await page.getByRole('button',{name:'Voir de dos'}).click();
  await page.getByRole('button',{name:'Mollets',exact:true}).press('Enter');
  await expect(page.getByRole('button',{name:'Quadriceps ✕'})).toBeVisible();
  await noOverflow(page);
  await page.getByRole('button',{name:'Voir ma séance'}).click();
  await expect(page.getByRole('heading',{name:'Récup · Tension'})).toBeVisible();
  const st=await state(page);
  expect(st.draft.recoveryZones).toEqual(['quads','calves']);
  expect(st.draft.exercises.some(e=>e.tool==='foamroller')).toBe(true);
  expect(errors).toEqual([]);
});

test('écran : séance avec échauffement guidé mouvement par mouvement',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  const data=athlete();
  data.draft=PT.generate(data,{...data.checkIn,equipment:home,focus:'muscle',minutes:30});
  data.draft.precheck={date:PT.dateKey(),status:'ok'};
  await seed(page,data,'preview');
  await expect(page.getByRole('heading',{name:/Échauffement guidé/})).toBeVisible();
  await expect(page.getByRole('heading',{name:/Retour au calme/})).toBeVisible();
  await page.getByRole('button',{name:/Démarrer la séance/}).click();
  await page.getByRole('button',{name:'Je suis prêt',exact:true}).click();
  await page.getByRole('button',{name:'C’est parti',exact:true}).click();
  await expect(page.locator('.live-position strong')).toContainText('Échauffement · 1 sur');
  const first=await page.locator('.live-heading h1').textContent();
  await page.getByRole('button',{name:'Mouvement suivant'}).first().click();
  await expect(page.locator('.live-position strong')).toContainText('Échauffement · 2 sur');
  expect(await page.locator('.live-heading h1').textContent()).not.toBe(first);
  await noOverflow(page);
  expect(errors).toEqual([]);
});

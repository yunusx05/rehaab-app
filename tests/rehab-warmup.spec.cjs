const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const RW=require('../rehab-warmup.js');

const home=['bodyweight','dumbbells','bench','bands','court','vest','sliders','partner'];
function athlete({owned=home,pains=[],profile=true,experience='beginner'}={}){
  const data=PT.initialState();
  data.profile.onboarded=true;data.profile.name='Test';data.profile.experience=experience;
  data.owned=owned;data.checkIn.equipment=owned;
  if(profile) data.player=JP.validatePlayer({position:'meneur',archetypes:['slasher'],layoff:'long'});
  data.symptoms=pains.map((p,i)=>({id:`s${i}`,side:'right',onset:'known',redFlags:false,note:'',date:PT.dateKey(),active:true,followups:[],...p}));
  return data;
}
async function seed(page,data,route){
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('test-seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.goto('/#'+route);await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
async function state(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}

test('matériel : gilet lesté et disques slide disponibles et sauvegardables',()=>{
  expect(PT.equipment.map(e=>e.id)).toEqual(expect.arrayContaining(['vest','sliders']));
  const data=athlete({owned:['bodyweight','vest','sliders']});
  expect(()=>PT.validateState(data)).not.toThrow();
  const usable=PT.catalog.filter(e=>e.needs.some(n=>['vest','sliders'].includes(n))&&PT.allowed(e,data,data.checkIn,PT.context(data)));
  expect(usable.length).toBeGreaterThanOrEqual(8);
  // Le gilet ne charge jamais un saut.
  expect(PT.catalog.filter(e=>e.needs.includes('vest')&&(e.impact||e.pattern==='jump'))).toEqual([]);
});

test('chaque protocole et chaque niveau donne une vraie séance, avec ou sans matériel',()=>{
  const ids=new Set(PT.catalog.map(e=>e.id));
  RW.protocols.forEach(p=>p.levels.forEach(level=>level.forEach(slot=>(Array.isArray(slot)?slot:slot.ids).forEach(id=>expect(ids.has(id),`${p.id}:${id}`).toBe(true)))));
  expect(RW.protocols.length).toBeGreaterThanOrEqual(16);
  for(const owned of [['bodyweight'],home]) for(const profile of [true,false]){
    const data=athlete({owned,profile});
    RW.protocols.forEach(p=>[0,1,2].forEach(level=>{
      const plan=RW.rehabPlan(PT,JP,data,p.id,level,15);
      expect(plan.error,`${p.id} niveau ${level}`).toBeUndefined();
      expect(plan.exercises.length).toBeGreaterThanOrEqual(2);
      expect(new Set(plan.exercises.map(e=>e.id)).size).toBe(plan.exercises.length);
      plan.exercises.forEach(e=>expect(e.needs.every(n=>owned.includes(n))).toBe(true));
    }));
  }
});

test('la zone ciblée garde son protocole, les autres douleurs restent protégées',()=>{
  // Épaule douloureuse : l'ancien moteur excluait tout mouvement d'épaule ; le protocole épaule doit exister.
  const data=athlete({pains:[{region:'shoulder',severity:4},{region:'knee',severity:5}]});
  const plan=RW.rehabPlan(PT,JP,data,'shoulder',0,15);
  expect(plan.exercises.length).toBeGreaterThanOrEqual(3);
  expect(plan.exercises.some(e=>e.regions.includes('shoulder'))).toBe(true);
  plan.exercises.forEach(e=>expect(JP.tolerates(e,data.symptoms.filter(s=>s.region==='knee'))).toBe(true));
  // Les mouvements restent autorisés pendant la séance (aucune redirection vers « douleur »).
  plan.exercises.forEach(e=>expect(PT.allowed(e,data,plan.check)).toBe(true));
});

test('arrêt : signe inquiétant ou douleur à 7/10 ne donnent aucun exercice',()=>{
  const data=athlete();
  expect(RW.pick({zone:'knee',where:'knee-patellar',severity:3,onset:'sub',flags:['swelling']},data).stop).toBe(true);
  expect(RW.pick({zone:'knee',where:'knee-patellar',severity:7,onset:'sub',flags:[]},data).stop).toBe(true);
  const blocked=athlete({pains:[{region:'knee',severity:8}]});
  expect(RW.rehabPlan(PT,JP,blocked,'knee-patellar',0,15).error).toBeTruthy();
  expect(RW.warmupPlan(PT,JP,blocked,'practice').error).toBeTruthy();
});

test('questionnaire : niveau de départ et protocole deviné',()=>{
  const data=athlete();
  expect(RW.pick({zone:'knee',where:'knee-patellar',severity:5,onset:'chronic',flags:[]},data).level).toBe(0);
  expect(RW.pick({zone:'knee',where:'knee-control',severity:0,onset:'prevention',flags:[]},data).level).toBe(1);
  expect(RW.pick({zone:'knee',where:'unknown',severity:3,onset:'sub',flags:[],triggers:['jump','land']},data).protocol.id).toBe('knee-patellar');
  expect(RW.pick({zone:'foot',where:'unknown',severity:3,onset:'sub',flags:[],triggers:['morning']},data).protocol.id).toBe('plantar');
  // Pré-remplissage depuis une douleur déjà signalée.
  const pre=RW.prefill(athlete({pains:[{region:'ankle',severity:4,side:'left'}]}));
  expect(pre).toMatchObject({zone:'foot',severity:4,side:'left',known:true});
});

test('progression : deux séances à 2/10 font monter, plus de 5/10 fait redescendre',()=>{
  let r=RW.record(null,{protocolId:'achilles',level:0,painAfter:2,sessionId:'a'});
  expect(r.level).toBe(0);
  r=RW.record(r.rehab,{protocolId:'achilles',level:0,painAfter:1,sessionId:'b'});
  expect(r.level).toBe(1);expect(r.change).toBe(1);
  r=RW.record(r.rehab,{protocolId:'achilles',level:1,painAfter:6,sessionId:'c'});
  expect(r.level).toBe(0);expect(r.change).toBe(-1);
  // Lendemain « pire » : pas de montée.
  const worse=RW.record(RW.record(null,{protocolId:'groin',level:0,painAfter:1,sessionId:'x'}).rehab,{protocolId:'groin',level:0,painAfter:1,sessionId:'y'},[{id:'x',nextDay:'worse'}]);
  expect(worse.level).toBe(0);
});

test('warm-up basket : appuis et sauts gardés le jour du match, retirés si le genou fait mal',()=>{
  const data=athlete({owned:['bodyweight','court']});
  data.events=[{id:'m',date:PT.dateKey(),type:'match',title:'Match',completed:false}];
  const plan=RW.warmupPlan(PT,JP,data,'match');
  expect(plan.exercises.some(e=>e.impact)).toBe(true);
  expect(plan.warmupSeconds).toBe(0);
  plan.exercises.forEach(e=>expect(PT.allowed(e,data,plan.check)).toBe(true));
  const sore=athlete({owned:['bodyweight','court'],pains:[{region:'knee',severity:4}]});
  RW.warmups.forEach(w=>{const p=RW.warmupPlan(PT,JP,sore,w.id);expect(p.error).toBeUndefined();expect(p.exercises.filter(e=>e.impact)).toEqual([]);});
});

test('déduction : 10 min de rehab retirent environ 10 min, jamais sous 10 min, ancres gardées',()=>{
  const data=athlete();
  const plan=PT.generate(data,{...data.checkIn,minutes:50,focus:'muscle',format:'classic',date:PT.dateKey()});
  expect(plan.error).toBeUndefined();
  plan.exercises[0].pinned=true;
  const total=p=>p.warmupSeconds+60+PT.estimateSeconds(p.exercises,p.format);
  const credit={minutes:10,labels:['Tendon rotulien'],exerciseIds:[plan.exercises[1].id],warmup:false,sessionIds:['r']};
  const adjusted=RW.applyCredit(PT,plan,credit);
  expect(total(adjusted)).toBeLessThanOrEqual(total(plan)-8*60);
  expect(adjusted.exercises[0].id).toBe(plan.exercises[0].id);
  expect(adjusted.exercises.some(e=>e.id===plan.exercises[1].id)).toBe(false);
  const huge=RW.applyCredit(PT,plan,{...credit,minutes:120});
  expect(total(huge)).toBeGreaterThanOrEqual(9*60);
  // Un warm-up remplace l'échauffement intégré.
  expect(RW.applyCredit(PT,plan,{...credit,warmup:true,exerciseIds:[]}).warmupSeconds).toBe(0);
  // Crédit calculé depuis les séances du jour, une seule fois.
  const day={...data,sessions:[{id:'r',date:PT.dateKey(),title:'Rehab · Tendon rotulien',source:'rehab',minutes:10.4,exercises:[{id:'spanish-squat'}],entries:{}}]};
  expect(RW.pendingCredit(day)).toMatchObject({minutes:10,exerciseIds:['spanish-squat']});
  expect(RW.pendingCredit({...day,sessions:day.sessions.map(s=>({...s,creditHandled:true}))})).toBeNull();
  expect(RW.canCredit({...plan,source:'quick'})).toBe(false);
});

test('écran : questionnaire genou jusqu’à la séance, sans erreur ni débordement',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:320,height:640});
  await seed(page,athlete({pains:[{region:'knee',severity:4}]}),'today');
  await expect(page.getByRole('heading',{name:'QUICK REHAB'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'WARM UP'})).toBeVisible();
  await page.goto('/#rehab/knee');
  await expect(page.getByText('Pré-rempli avec la douleur déjà signalée')).toBeVisible();
  await page.getByRole('button',{name:/Juste sous la rotule/}).click();
  await noOverflow(page);
  await page.getByRole('button',{name:'Continuer'}).click();
  await page.getByRole('button',{name:'Plus de 6 semaines'}).click();
  await page.getByRole('button',{name:'Continuer'}).click();
  await page.getByRole('button',{name:'Aucun de ces signes'}).click();
  await page.getByRole('button',{name:'Voir mon protocole'}).click();
  await expect(page.getByRole('heading',{name:'Tendon rotulien (genou du sauteur)'})).toBeVisible();
  await expect(page.locator('summary',{hasText:'Sur quoi c’est basé'})).toBeVisible();
  await noOverflow(page);
  await page.getByRole('button',{name:'Voir ma séance'}).click();
  await expect(page.getByRole('heading',{name:/Rehab · Tendon rotulien/})).toBeVisible();
  await expect(page.getByText(/Échauffement ·/)).toHaveCount(0);
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('écran : signe inquiétant, pas de protocole',async({page})=>{
  await seed(page,athlete(),'rehab/hip');
  await page.getByRole('button',{name:/Aine, intérieur de cuisse/}).click();
  await page.getByRole('button',{name:'Continuer'}).click();
  await page.getByRole('button',{name:'Moins de 2 semaines'}).click();
  await page.getByRole('button',{name:'Continuer'}).click();
  await page.getByRole('button',{name:/Choc ou chute récente/}).click();
  await page.getByRole('button',{name:'Voir mon protocole'}).click();
  await expect(page.getByRole('alert')).toContainText('avis médical');
  await expect(page.getByRole('button',{name:'Voir ma séance'})).toHaveCount(0);
});

test('écran : la séance du programme propose de retirer le temps de rehab, « Oui » réduit la durée',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const data=athlete();
  const plan=PT.generate(data,{...data.checkIn,minutes:50,focus:'muscle',format:'classic',date:PT.dateKey()});
  data.draft=plan;
  data.sessions=[{id:'r1',date:PT.dateKey(),title:'Rehab · Tendon rotulien',source:'rehab',minutes:10,exercises:[{id:'spanish-squat',name:'Squat espagnol'}],entries:{},effort:4,completedAt:new Date().toISOString(),status:'finished'}];
  await seed(page,data,'preview');
  const minutes=async()=>Number((await page.locator('.plan-meta span').first().textContent()).match(/\d+/)[0]);
  const before=await minutes();
  await expect(page.getByRole('heading',{name:'Déjà 10 min aujourd’hui'})).toBeVisible();
  await page.getByRole('button',{name:'Oui, ajuster'}).click();
  await expect(page.getByText(/Ajustée :/)).toBeVisible();
  expect(await minutes()).toBeLessThanOrEqual(before-8);
  await expect(page.getByRole('heading',{name:'Déjà 10 min aujourd’hui'})).toHaveCount(0);
  const saved=await state(page);
  expect(saved.sessions[0].creditHandled).toBe(true);
  expect(errors).toEqual([]);
});

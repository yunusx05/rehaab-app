const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const BP=require('../basket-pathway.js');
const QI=require('../basket-qi.js');

const home=['bodyweight','dumbbells','kettlebell','barbell','bench','bands','bike','court'];
function player({position='meneur',archetypes=['slasher'],pains=[],owned=home,experience='returning'}={}){
  const data=PT.initialState();
  data.profile.onboarded=true;data.profile.name='Test';data.profile.experience=experience;
  data.owned=owned;data.checkIn.equipment=owned;
  data.player=JP.validatePlayer({position,archetypes,layoff:'long'});
  data.symptoms=pains.map((p,i)=>({id:`s${i}`,side:'right',onset:'known',redFlags:false,note:'',date:PT.dateKey(),active:true,followups:[],...p}));
  return data;
}
async function seed(page,data,route){
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('test-seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.goto('/#'+route);await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
// L'app regroupe ses écritures (250 ms) : on attend la sauvegarde avant de la lire.
async function state(page){await page.waitForTimeout(300);return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}

test('douleur au genou : on renforce au lieu de tout retirer',()=>{
  const data=player({pains:[{region:'knee',severity:4}]});
  // Sans profil joueur : ancienne règle, la zone est exclue en bloc. Avec profil : on garde ce qu'elle tolère.
  const legacy={...data,player:null};
  const lower=PT.catalog.filter(e=>['squat','hinge','calf'].includes(e.pattern)&&e.needs.every(n=>home.includes(n)));
  expect(lower.filter(e=>PT.allowed(e,legacy,legacy.checkIn,PT.context(legacy))).length).toBeLessThan(3);
  expect(lower.filter(e=>PT.allowed(e,data,data.checkIn,PT.context(data))).length).toBeGreaterThan(20);
  expect(lower.filter(e=>JP.tolerates(e,data.symptoms)).length).toBeGreaterThan(20);
  expect(PT.catalog.filter(e=>e.impact).some(e=>JP.tolerates(e,data.symptoms))).toBe(false);
  const plan=JP.dailyBody(PT,data,{minutes:45,random:()=>.5});
  expect(plan.exercises[0].role).toBe('rehab');
  expect(plan.exercises.every(e=>JP.tolerates(e,data.symptoms))).toBe(true);
  const blocked=player({pains:[{region:'knee',severity:8}]});
  expect(JP.dailyBody(PT,blocked).error).toMatch(/avis médical/);
});

test('le poste change les priorités et les variantes de séance',()=>{
  expect(JP.priorities({position:'meneur'})[0].id).toBe('decel');
  expect(JP.priorities({position:'pivot'})[0].id).toBe('strength');
  const p={...BP.create(),step:3};
  const guard=BP.sessionPlan(PT,JP,player({position:'meneur'}),p,'C').exercises.map(e=>e.id);
  const big=BP.sessionPlan(PT,JP,player({position:'pivot',archetypes:['rebondeur']}),p,'C').exercises.map(e=>e.id);
  expect(guard).toContain('decel-stick');expect(big).toContain('split-jump');expect(guard).not.toEqual(big);
  expect(JP.qiThemes({position:'meneur'})[0]).toBe('pnr-handler');
  expect(JP.qiThemes({position:'pivot'})[0]).toBe('pnr-screener');
});

test('parcours : toutes les séances se construisent, étape 1 sans sprint ni saut maximal',()=>{
  for(const owned of [['bodyweight'],home,PT.equipment.map(e=>e.id)]){
    const data=player({owned});
    for(const step of BP.steps){
      const p={...BP.create(),step:step.id};
      for(const day of step.days){const plan=BP.sessionPlan(PT,JP,data,p,day.key);expect(plan.error,`${step.id}${day.key}`).toBeUndefined();expect(plan.exercises.length).toBeGreaterThan(1);}
    }
  }
  const first=BP.steps[0].days.flatMap(d=>BP.sessionPlan(PT,JP,player(),BP.create(),d.key).exercises);
  expect(first.some(e=>e.pattern==='footwork'||e.pattern==='jump'&&!['landing','pogo'].includes(e.id))).toBe(false);
  // Chaque exercice proposé passe aussi le contrôle fait pendant la séance.
  for(const step of BP.steps)for(const day of step.days){const data=player({pains:[{region:'knee',severity:2}]});const plan=BP.sessionPlan(PT,JP,data,{...BP.create(),step:step.id},day.key);expect(plan.exercises.filter(e=>!PT.allowed(e,data,plan.check)).map(e=>e.id)).toEqual([]);}
  const short=BP.sessionPlan(PT,JP,player(),{...BP.create(),step:2},'B',{minutes:30});
  expect(short.estimatedMinutes).toBeLessThanOrEqual(34);
});

test('parcours : on ne passe l’étape qu’avec le volume, les tests et sans douleur',()=>{
  let p=BP.create();const data=player();
  expect(BP.gate(PT,data,p).ready).toBe(false);
  for(let i=0;i<9;i++)p=BP.markCompleted(p,{step:1,week:1,day:'ABC'[i%3],sessionId:`s${i}`,date:'2026-09-01'});
  expect(BP.weekStatus(p).week).toBe(4);
  for(const [id,v] of [['calf',{left:22,right:21}],['bridge',{left:16,right:17}],['balance',{left:35,right:32}],['sideplank',{left:50,right:48}],['kneewall',{left:10,right:11}]])p=BP.recordTest(p,id,v);
  expect(BP.gate(PT,data,p).ready).toBe(true);
  expect(BP.gate(PT,player({pains:[{region:'knee',severity:3}]}),p).ready).toBe(false);
  expect(BP.gate(PT,data,BP.recordTest(p,'calf',{left:22,right:14})).ready).toBe(false);
  const next=BP.advance(p);expect(next.step).toBe(2);expect(BP.weekStatus(next).week).toBe(1);
  expect(BP.stepBack(next).step).toBe(1);
  let ladder={...BP.create(),step:5};
  ladder=BP.recordRung(ladder,1);expect(BP.ladderLevel(ladder)).toBe(0);
  ladder=BP.rungFeedback(ladder,0,'worse');expect(BP.ladderLevel(ladder)).toBe(0);
  ladder=BP.rungFeedback(BP.recordRung(ladder,1),1,'ok');expect(BP.ladderLevel(ladder)).toBe(1);
});

test('QI : une seule bonne réponse, thèmes connus, sauvegardes anciennes compatibles',()=>{
  for(const q of QI.quiz)expect(q.choices.filter(c=>c.ok),q.id).toHaveLength(1);
  for(const c of QI.clutch)expect(c.choices.filter(x=>x[1]),c.id).toHaveLength(1);
  for(const x of [...QI.quiz,...QI.place,...QI.clutch,...QI.vocab])expect(QI.themes[x.theme],x.id).toBeTruthy();
  const old=PT.initialState();delete old.player;delete old.pathway;delete old.qi;
  const restored=PT.validateState(old);
  expect(restored.player).toBeNull();expect(restored.pathway).toBeNull();expect(restored.qi.answers).toEqual([]);
  let qi=QI.initialQi();qi=QI.gradeCard(qi,'drop',true);expect(qi.cards.drop.box).toBe(2);
  expect(()=>PT.validateState({...PT.initialState(),pathway:{id:'x',step:9}})).toThrow();
});

test('parcours dans l’app : lancer une séance, la terminer, le suivi avance',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  const data=player({pains:[{region:'knee',severity:2}]});data.pathway=BP.create();
  await seed(page,data,'today');
  // Une gêne active ne remplace plus le parcours : le soin de la zone est intégré à la séance du jour.
  await expect(page.locator('.today-plan')).toContainText('soin intégré');
  await page.getByRole('button',{name:'Parcours',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Fondations.'})).toBeVisible();
  await noOverflow(page);
  await page.getByRole('button',{name:/Préparer cette séance/}).first().click();
  await expect(page.getByRole('button',{name:'Démarrer la séance'})).toBeVisible();
  const draft=(await state(page)).draft;
  expect(draft.source).toBe('pathway');expect(draft.pathwayStep).toBe(1);
  expect(draft.exercises.filter(e=>e.pathwayRole!=='soin').every(e=>JP.tolerates(e,data.symptoms))).toBe(true);
  expect(draft.exercises[0].pathwayRole).toBe('soin');
  // Séance réduite à un exercice déjà validé pour aller droit à l'enregistrement.
  const done=PT.startDraft({...draft,exercises:[draft.exercises.find(e=>e.measure==='reps')].map(e=>({...e,sets:1}))},data);
  done.status='active';done.warmupDone=true;
  Object.values(done.entries).forEach(rows=>rows.forEach(r=>{r.done=true;r.reps='10';}));
  await page.evaluate(({key,done})=>{const s=JSON.parse(localStorage.getItem(key));s.draft=done;localStorage.setItem(key,JSON.stringify(s));},{key:PT.STORAGE_KEY,done});
  await page.goto('/#session');await page.reload();
  await page.getByRole('button',{name:'Terminer la séance',exact:true}).click();
  await page.getByRole('button',{name:'Effort 6 sur 10',exact:true}).click();
  await page.getByRole('button',{name:'Enregistrer ma séance',exact:true}).click();
  await expect.poll(async()=>(await state(page)).pathway.completed.length).toBe(1);
  const final=await state(page);
  expect(final.pathway.completed[0].step).toBe(1);expect(final.programWeek).toBe(1);
  expect(errors).toEqual([]);
});

test('QI dans l’app : lecture du jour, placement et profil joueur',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:320,height:640});
  await seed(page,player(),'qi');
  await expect(page.getByRole('heading',{name:'QI basket.'})).toBeVisible();
  await noOverflow(page);
  await page.getByRole('button',{name:/C’est parti/}).click();
  await page.locator('.qi-choice').first().click();
  await expect(page.locator('.qi-feedback')).toBeVisible();
  await expect.poll(async()=>(await state(page)).qi.answers.length).toBe(1);
  await page.goto('/#qi-run/place');
  const court=page.locator('.court');await expect(court).toBeVisible();
  const box=await court.boundingBox();await court.click({position:{x:box.width*.4,y:box.height*.2}});
  await expect(page.locator('.court-you')).toBeVisible();
  await page.getByRole('button',{name:'Valider ma position'}).click();
  await expect(page.locator('.court-target')).toBeVisible();
  await noOverflow(page);
  await page.goto('/#player');
  await expect(page.getByRole('heading',{name:'Ton poste.'})).toBeVisible();
  await page.getByRole('button',{name:'5 · Pivot'}).click();
  await page.getByRole('button',{name:'Continuer'}).click();
  await page.getByRole('button',{name:/^Rebondeur/}).click();
  await page.getByRole('button',{name:'Continuer'}).click();
  await page.getByRole('button',{name:'Continuer'}).click();
  await page.getByRole('button',{name:'Voir ma journée'}).click();
  await expect.poll(async()=>(await state(page)).player.position).toBe('pivot');
  expect(errors).toEqual([]);
});

test('QI : défense dans la sélection du jour, animations cohérentes, trois profils de jeu',()=>{
  for(const position of ['meneur','ailier','pivot']){
    const items=QI.dailySet(QI.initialQi(),{position},JP.qiThemes({position})).items;
    expect(items.some(x=>QI.sideOf(x.item)==='def'),position).toBe(true);
    expect(items.some(x=>x.mode==='quiz'&&QI.sideOf(x.item)==='off'),position).toBe(true);
  }
  for(const it of [...QI.quiz,...QI.place]){
    const o=new Set(it.court.o.map(p=>String(p[0]))),d=new Set((it.court.d||[]).map(p=>String(p[0])));
    for(const f of [...(it.anim||[]),...(it.solution||[])]){
      Object.keys(f.o||{}).forEach(k=>expect(o.has(k),`${it.id} o${k}`).toBe(true));
      Object.keys(f.d||{}).forEach(k=>expect(d.has(k),`${it.id} d${k}`).toBe(true));
      if(typeof f.ball==='string')expect(o.has(f.ball),`${it.id} ballon`).toBe(true);
    }
  }
  expect(JP.validatePlayer({position:'meneur',archetypes:['slasher','createur','defenseur','shooter']}).archetypes).toHaveLength(3);
});

test('QI dans l’app : l’action se joue avant les choix, décision rapide chronométrée',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  await seed(page,player(),'qi-run/quiz');
  await expect(page.locator('.court')).toBeVisible();
  await expect(page.locator('.qi-choice')).toHaveCount(0);
  await expect(page.locator('.qi-choice').first()).toBeVisible({timeout:8000});
  await page.locator('.qi-choice').first().click();
  await expect(page.getByRole('button',{name:/Voir la bonne lecture/})).toBeVisible();
  await page.goto('/#qi-run/speed');
  await expect(page.locator('.speed-bar')).toBeVisible({timeout:10000});
  await expect(page.getByText('Temps écoulé.')).toBeVisible({timeout:10000});
  await expect.poll(async()=>(await state(page)).qi.answers.some(a=>a.mode==='speed'&&a.correct===false)).toBe(true);
  expect(errors).toEqual([]);
});

test('annuler la séance en cours reste visible, avec confirmation',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const data=player();data.pathway=BP.create();data.draft=PT.startDraft(BP.sessionPlan(PT,JP,data,data.pathway,'A'),data);
  await seed(page,data,'session');
  await page.getByRole('button',{name:'Annuler',exact:true}).click();
  await page.getByRole('button',{name:'Oui, annuler sans enregistrer'}).click();
  await expect.poll(async()=>(await state(page)).draft).toBeNull();
  expect((await state(page)).pathway).not.toBeNull();
  await expect(page.locator('.home-shortcuts')).toHaveCount(0);
});

test('douleur de hanche / aine : renforcement ciblé au lieu d’une séance vide',()=>{
  const data=player({pains:[{region:'hip',severity:5},{region:'knee',severity:4}]});
  const plan=BP.sessionPlan(PT,JP,data,BP.create(),'A');
  expect(plan.exercises.length).toBeGreaterThanOrEqual(5);
  // Le soin de la zone ouvre la séance ; hors soin, tout est toléré par la hanche et le genou.
  expect(plan.exercises[0].pathwayRole).toBe('soin');
  expect(plan.exercises.filter(e=>e.pathwayRole!=='soin').every(e=>JP.tolerates(e,data.symptoms)&&PT.allowed(e,data,plan.check))).toBe(true);
  expect(plan.exercises.some(e=>['pigeon','cossack','hip-90-90','deep-squat-hold','bulgarian'].includes(e.id))).toBe(false);
  expect(new Set(plan.exercises.map(e=>e.id)).size).toBe(plan.exercises.length);
});

test('accueil allégé : la séance du jour lance directement la séance du parcours',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  const data=player();data.pathway=BP.create();
  await seed(page,data,'today');
  const card=page.locator('.today-plan');
  await expect(card).toContainText('Étape 1 · Fondations');
  await expect(page.locator('.bottom-nav button')).toHaveText(['Aujourd’hui','Parcours','Coach','QI','Profil']);
  await expect(page.getByText('Trouver ma séance')).toHaveCount(0);
  await card.getByRole('button',{name:/Préparer ma séance/}).click();
  await expect(page.getByRole('button',{name:'Démarrer la séance'})).toBeVisible();
  expect((await state(page)).draft.source).toBe('pathway');
  await noOverflow(page);expect(errors).toEqual([]);
});

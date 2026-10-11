const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const BP=require('../basket-pathway.js');
const SK=require('../basket-skills.js');
const SH=require('../shooting.js');
const BW=require('../body-weight.js');
const SP=require('../season-plan.js');
const day=n=>{const d=new Date();d.setDate(d.getDate()-n);return PT.dateKey(d);};

test('tir : compteur, annulation, objectif par ligne, totaux, semaines, records', ()=>{
  let d=SH.fromRoutine('five-spots');
  expect(d.items[0].target).toBe(10);
  for(let i=0;i<9;i++) d=SH.shot(d,i%3!==0);
  expect(SH.totals(d)).toMatchObject({made:6,attempts:9});
  d=SH.shot(d,true);                       // 10e tir : objectif atteint, ligne suivante
  expect(d.cursor).toBe(1);
  d=SH.undo(d);                            // l'annulation revient sur la ligne précédente
  expect(d.cursor).toBe(0);expect(d.items[0].attempts).toBe(9);
  for(let i=0;i<4;i++) d=SH.shot(d,true);
  const {shooting,session}=SH.finish(SH.blank(),d);
  expect(session.items.every(i=>i.attempts>0)).toBe(true);
  expect(SH.validate(shooting).sessions).toHaveLength(1);
  const w=SH.weekly(shooting,8);
  expect(w).toHaveLength(8);expect(w[7].attempts).toBe(SH.totals(session).attempts);
  expect(SH.records(shooting).streak).toBeGreaterThanOrEqual(3);
  // Le palier de tir des skills profite de la séance.
  const sk=SK.saveProfile(null,{answers:{},tests:{}});
  const r=SK.record(sk,SH.toSkillSession(session));
  expect(r.skills.log.some(x=>x.area==='shoot'&&x.attempts===SH.totals(session).attempts)).toBe(true);
});

test('poids : moyenne 7 jours, écart au poids de jeu, garde-fous, plan plus prudent', ()=>{
  const s=PT.initialState();s.profile.height='183';s.dossier={answers:{playWeight:78}};
  s.measurements=[{id:'a',date:day(30),weight:90,waist:''},{id:'b',date:day(3),weight:88,waist:''},{id:'c',date:day(1),weight:87,waist:''}];
  const sum=BW.summary(s);
  expect(sum.avg).toBe(87.5);expect(sum.gap).toBe(9.5);
  expect(sum.protein).toEqual({min:Math.round(87.5*1.4),max:Math.round(87.5*2)});
  expect(BW.cautious(s)).toBe(true);
  // Suivi déclaré : ni écart ni prudence affichée comme objectif.
  expect(BW.summary({...s,weightPrefs:{followUp:true}}).gap).toBe(null);
  // Poids déjà bas pour la taille : pas d'objectif de perte.
  expect(BW.guard({...s,measurements:[{id:'x',date:day(0),weight:55,waist:''}]}).blocks.length).toBe(1);
  // Parcours : sauts limités à 3 séries et souffle au vélo.
  const st={...s,profile:{...s.profile,experience:'regular',impactReady:true},owned:['bodyweight','bike','court','dumbbells','outdoor']};st.checkIn={...st.checkIn,equipment:st.owned};
  const plan=BP.sessionPlan(PT,JP,st,BP.create({startStep:4}),'C');
  expect(plan.exercises.find(e=>e.pathwayRole==='cardio')?.id).toMatch(/^bike/);
  expect(plan.exercises.filter(e=>e.impact).every(e=>e.sets<=3)).toBe(true);
  expect(plan.reasons.join(' ')).toMatch(/poids de jeu/);
  // Anciennes sauvegardes valides.
  const old=PT.initialState();delete old.shooting;delete old.weightPrefs;
  expect(PT.validateState(old).shooting).toBe(null);
});

test('calendrier : une séance de tir par semaine avec un panier, jamais un jour de club', ()=>{
  const s=PT.initialState();s.dossier={answers:{hoop:'weekly',freeDays:[0,1,2,3,4],sessions:'3'}};s.basketProfile={practiceDays:[1,3],matchDay:5};
  s.seasonPlan={resetWeeks:0};s.pathway=BP.create({startStep:2});
  const w=SP.weekSchedule(s,'2026-10-12','2026-10-12');
  const t=w.days.flatMap(d=>d.items.map(x=>({...x,day:d.weekday}))).filter(x=>x.type==='shooting');
  expect(t).toHaveLength(1);expect([1,3,5]).not.toContain(t[0].day);
  expect(SP.violations(s,w)).toEqual([]);
});

test('écrans : séance de tir en direct conservée, enregistrée, pesée et courbe, sans débordement à 320 px', async({page})=>{
  const s=PT.initialState();s.profile.onboarded=true;s.player=JP.validatePlayer({position:'meneur'});s.dossier={answers:{playWeight:78}};
  s.measurements=[{id:'a',date:day(14),weight:89,waist:''},{id:'b',date:day(7),weight:88.4,waist:''}];
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('seeded','1');}},{data:s,key:PT.STORAGE_KEY});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:320,height:740});
  await page.goto('/#shooting');
  await page.getByRole('button',{name:/50 lancers francs/}).click();
  for(let i=0;i<3;i++) await page.getByRole('button',{name:'Réussi',exact:true}).click();
  await page.getByRole('button',{name:'Raté',exact:true}).click();
  await expect(page.locator('.shot-count')).toContainText('3/4');
  await page.waitForTimeout(400);await page.reload();
  await expect(page.locator('.shot-count')).toContainText('3/4');   // la séance en cours survit au rechargement
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Terminer la séance'}).click();
  await expect(page.getByRole('heading',{name:/75 % cette semaine/})).toBeVisible();
  await expect(page.locator('.shot-map')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.goto('/#weight');
  await page.getByLabel('Pesée du jour (kg)').fill('87,6');
  await page.getByRole('button',{name:'Enregistrer ma pesée'}).click();
  await expect(page.locator('.chart-line')).toHaveCount(1);
  await expect(page.getByText(/au-dessus de ton poids de jeu/)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const PD=require('../player-dossier.js');
const BP=require('../basket-pathway.js');
const JP=require('../player-profile.js');
const SK=require('../basket-skills.js');
const SP=require('../season-plan.js');

// Le meneur type : 24 mois d'arrêt, +10 kg, gêne sous la rotule à 3/10, club le mardi, match le samedi, libre lundi, mercredi, vendredi.
const persona={
  morpho:{age:27,height:183,weight:88,playWeight:78,hand:'right',takeoff:'left',reach:'net'},
  game:{position:'meneur',archetypes:['createur','slasher'],levelPeak:'regional',years:12,weapons:['crossover'],strengths:['handle'],weaknesses:['firststep','engine','brake'],club:'yes',practiceDays:[1],matchDay:5,season:'pre',hoop:'weekly'},
  health:{history:['ankle'],ankleSprains:'2-3',pains:['knee'],'pain-knee-where':'knee-patellar','pain-knee-side':'right','pain-knee-severity':3,triggers:['jump'],morning:'short',flags:['none']},
  goals:{mainGoal:'comeback',measurable:['rim'],deadline:'season',priorities:['vertical','speed','injury'],fear:'some'},
  break:{layoffMonths:24,layoffReason:'work',dropped:['jump']},
  life:{sessions:'3',freeDays:[0,2,4],maxMinutes:'60',equipment:['dumbbells','bands']}
};
const MONDAY='2026-10-12';
function meneur(){let s=PT.initialState();s.profile.name='Y';for(const [c,a] of Object.entries(persona))s=PD.saveChapter(s,c,a);s.pathway=BP.create({startStep:1,now:'2026-10-05'});return s;}
const items=w=>w.days.flatMap(d=>d.items.map(x=>({...x,day:d.weekday})));

test('meneur type : remise en route d’abord, sans saut, expliquée', ()=>{
  const s=meneur(),b=SP.build(s,MONDAY);
  expect(b.current.id).toBe('reset');
  expect(b.resetWeeks).toBeGreaterThanOrEqual(2);
  expect(b.need.reasons.join(' ')).toMatch(/24 mois/);
  expect(b.need.reasons.join(' ')).toMatch(/genou 3\/10/);
  expect(b.need.reasons.join(' ')).toMatch(/10 kg/);
  const w=SP.weekSchedule(s,MONDAY,MONDAY);
  expect(items(w).filter(x=>x.physical).map(x=>x.day).sort()).toEqual([0,2,4]);
  expect(items(w).every(x=>x.legs!=='heavy')).toBe(true);
  expect(SP.violations(s,w)).toEqual([]);
});

test('calendrier : pas de jambes lourdes la veille du match, pas de skills le jour du club, 48 h entre deux séances de jambes', ()=>{
  const s=meneur();s.seasonPlan={resetWeeks:0};s.symptoms=[];s.pathway=BP.create({startStep:3,now:'2026-10-05'});
  s.skills=SK.saveProfile(null,{answers:{},tests:{}});
  const w=SP.weekSchedule(s,MONDAY,MONDAY),all=items(w);
  expect(all.filter(x=>x.legs==='heavy').some(x=>x.day===4)).toBe(false); // vendredi, veille du samedi
  expect(all.filter(x=>x.type==='skills').some(x=>x.day===1||x.day===5)).toBe(false);
  const heavy=all.filter(x=>x.legs==='heavy').map(x=>x.day).sort();
  for(let i=1;i<heavy.length;i++) expect(heavy[i]-heavy[i-1]).toBeGreaterThanOrEqual(2);
  expect(SP.violations(s,w)).toEqual([]);
  // Déplacement refusé, puis accepté.
  const heavyKey=all.find(x=>x.legs==='heavy').key;
  const no=SP.reschedule(s,MONDAY,heavyKey,'2026-10-16');
  expect(no.ok).toBe(false);expect(no.why).toMatch(/Veille de match/);
  const light=all.find(x=>x.physical&&x.legs==='light');
  const yes=SP.reschedule(s,MONDAY,light.key,'2026-10-18');
  expect(yes.ok).toBe(true);
  const moved=SP.weekSchedule({...s,calendar:yes.calendar},MONDAY,MONDAY);
  expect(items(moved).find(x=>x.key===light.key).day).toBe(6);
  expect(SP.violations(s,moved)).toEqual([]);
});

test('règles respectées sur 600 semaines tirées au hasard', ()=>{
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let n=0;n<600;n++){
    const s=PT.initialState();
    s.basketProfile={practiceDays:[0,1,2,3,4,5,6].filter(()=>rnd()<0.25),matchDay:rnd()<0.7?Math.floor(rnd()*7):null,season:'in'};
    if(s.basketProfile.matchDay!==null)s.basketProfile.practiceDays=s.basketProfile.practiceDays.filter(d=>d!==s.basketProfile.matchDay);
    s.dossier={answers:{freeDays:[0,1,2,3,4,5,6].filter(()=>rnd()<0.6),sessions:String(2+Math.floor(rnd()*4))}};
    s.seasonPlan={resetWeeks:0};s.pathway=BP.create({startStep:1+Math.floor(rnd()*5),now:'2026-10-05'});
    if(rnd()<0.5)s.skills=SK.saveProfile(null,{answers:{},tests:{}});
    const w=SP.weekSchedule(s,MONDAY,MONDAY);
    expect(SP.violations(s,w),JSON.stringify(s.basketProfile)+JSON.stringify(s.dossier)).toEqual([]);
  }
});

test('jour manqué : décalé au prochain jour compatible, sinon sauté sans rattrapage forcé', ()=>{
  const s=meneur();
  const w=SP.weekSchedule(s,MONDAY,MONDAY),first=items(w).find(x=>x.day===0);
  const r=SP.missed(s,MONDAY,first.key,MONDAY);
  expect(r.ok).toBe(true);
  if(r.skipped) expect(r.why).toMatch(/sans rattrapage/);
  else expect(SP.violations(s,SP.weekSchedule({...s,calendar:r.calendar},MONDAY,MONDAY))).toEqual([]);
  // Bilan : rien à juger avant le début du plan.
  expect(SP.review(s,'2026-09-28').before).toBe(true);
  expect(SP.review(s,'2026-09-28').suggestions).toEqual([]);
  const ics=SP.ics(s,MONDAY,4);
  expect(ics).toContain('BEGIN:VCALENDAR');
  expect((ics.match(/BEGIN:VEVENT/g)||[]).length).toBeGreaterThanOrEqual(8);
});

test('imprévu : annuler ou reporter la séance du jour, puis la rétablir', ()=>{
  const s=meneur();
  const day=SP.weekSchedule(s,MONDAY,MONDAY).days.find(d=>d.items.some(x=>x.status==='planned'));
  const now=day.date,keys=day.items.filter(x=>x.status==='planned').map(x=>x.key);
  const cancel=SP.excuse(s,'cancel',now);
  expect(cancel.ok).toBe(true);
  const c={...s,calendar:cancel.calendar},wc=SP.weekSchedule(c,now,now);
  expect(wc.days.find(d=>d.date===now).items).toEqual([]);
  expect(wc.days.flatMap(d=>d.items).some(x=>keys.includes(x.key))).toBe(false);
  expect(SP.excusedToday(c,now).action).toBe('cancel');
  const back={...c,calendar:SP.unexcuse(c,now)};
  expect(SP.excusedToday(back,now)).toBe(null);
  expect(SP.weekSchedule(back,now,now).days.find(d=>d.date===now).items.map(x=>x.key)).toEqual(SP.weekSchedule(s,now,now).days.find(d=>d.date===now).items.map(x=>x.key));
  const post=SP.excuse(s,'postpone',now);
  expect(post.ok).toBe(true);
  const p={...s,calendar:post.calendar},wp=SP.weekSchedule(p,now,now);
  expect(wp.days.find(d=>d.date===now).items).toEqual([]);
  wp.days.flatMap(d=>d.items).filter(x=>keys.includes(x.key)).forEach(x=>expect(x.date>now).toBe(true));
  expect(SP.violations(p,wp)).toEqual([]);
  // Une sauvegarde relue garde l'imprévu.
  expect(SP.validateCalendar(JSON.parse(JSON.stringify(p.calendar))).excused.keys).toEqual(keys);
  expect(SP.excuse({...s,calendar:post.calendar},'cancel',now).ok).toBe(false);
});

test('architecte : son choix passe en tête du créneau, un identifiant inconnu ou non toléré est ignoré', ()=>{
  const s=meneur();s.owned=['bodyweight','dumbbells','bands','slantboard'];s.checkIn.equipment=s.owned;
  s.seasonPlan=SP.validate({architect:{choices:{'1A0':'slant-iso-squat','1A1':'inconnu-xyz','1C2':'tuck-jump'}}});
  const plan=BP.sessionPlan(PT,JP,s,s.pathway,'A');
  expect(plan.exercises.find(e=>e.architect)?.id).toBe('slant-iso-squat');
  expect(plan.exercises.some(e=>e.id==='inconnu-xyz')).toBe(false);
  const c=BP.sessionPlan(PT,JP,s,s.pathway,'C');
  expect(c.exercises.some(e=>e.id==='tuck-jump')).toBe(false); // genou sensible : refusé par le moteur
  // Anciennes sauvegardes : pas de plan, pas de calendrier.
  const old=PT.initialState();delete old.seasonPlan;delete old.calendar;delete old.weeklyReviews;
  const v=PT.validateState(old);
  expect(v.seasonPlan).toBe(null);expect(v.weeklyReviews).toEqual([]);
});

test('serveur : mode plan, liste fermée par créneau', async()=>{
  const handler=require('../api/coach.js');
  const saved=global.fetch;process.env.GEMINI_API_KEY='test';
  global.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({message:'Plan prêt.',priorities:[{label:'Freinage',why:'Genou'}],accents:[],rules:['Pas de sauts répétés'],choices:[{slot:'1A0',id:'slant-iso-squat'},{slot:'1A1',id:'hack-id'},{slot:'xx',id:'pogo'}]})}]}}]})});
  let out;const res={setHeader(){},status(){return this;},json(v){out=v;}};
  await handler({method:'POST',body:{mode:'plan',context:{slots:{'1A0':[{id:'slant-iso-squat'},{id:'spanish-squat'}],'1A1':[{id:'goblet'}]}},messages:[{role:'user',text:'plan'}]}},res);
  global.fetch=saved;
  expect(out.choices).toEqual({'1A0':'slant-iso-squat'});
  expect(out.rules).toEqual(['Pas de sauts répétés']);
});

test('écran : calendrier à 320 px, lancement de la séance du jour, plan de saison et architecte simulé', async({page})=>{
  const s=meneur();s.profile.onboarded=true;
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('seeded','1');}},{data:s,key:PT.STORAGE_KEY});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:320,height:740});
  await page.goto('/#calendar');
  await expect(page.getByRole('heading',{name:'Mon planning.'})).toBeVisible();
  await expect(page.locator('.calendar-day')).toHaveCount(7);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.goto('/#plan');
  await expect(page.getByText('Tu es ici')).toBeVisible();
  await page.route('**/api/coach',route=>route.fulfill({json:{message:'On calme le tendon avant tout.',priorities:[{label:'Tendon rotulien',why:'Gêne à 3/10 sous la rotule.'}],accents:[{phase:'Remise en route',text:'Isométries chaque jour.'}],rules:['Genou : pas de sauts répétés avant validation du tendon.'],choices:{'1A0':'spanish-squat'}}}));
  await page.getByRole('button',{name:'Demander à l’architecte'}).click();
  await expect(page.getByText('Tendon rotulien')).toBeVisible();
  await expect(page.getByText('Genou : pas de sauts répétés')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.goto('/#today');
  await expect(page.locator('.week-strip')).toBeVisible();
  expect(errors).toEqual([]);
});

test('planning libre : un jour qui casse une règle demande confirmation, puis la séance y va avec une alerte', ()=>{
  const s=meneur();
  const week=SP.weekSchedule(s,MONDAY,MONDAY),heavy=items(week).find(x=>x.physical);
  expect(heavy).toBeTruthy();
  const friday=SP.at(MONDAY,5); // jour du match du samedi
  const refused=SP.reschedule(s,MONDAY,heavy.key,friday);
  expect(refused.ok).toBe(false);expect(refused.canForce).toBe(true);
  expect(SP.ruleBreakAt(s,MONDAY,heavy.key,friday)).toMatch(/Jour de match/);
  const forced=SP.reschedule(s,MONDAY,heavy.key,friday,{force:true});
  expect(forced.ok).toBe(true);expect(forced.forced).toBe(true);
  const after={...s,calendar:forced.calendar},placed=items(SP.weekSchedule(after,MONDAY,MONDAY)).find(x=>x.key===heavy.key);
  expect(placed.date).toBe(friday);expect(placed.warning).toMatch(/Jour de match/);
  expect(SP.violations(after,SP.weekSchedule(after,MONDAY,MONDAY))).toEqual([]);
  // Sauvegarde : le choix forcé survit à la validation ; « laisser l'app choisir » le retire.
  expect(SP.validateCalendar(JSON.parse(JSON.stringify(forced.calendar))).forced[MONDAY]).toContain(heavy.key);
  const back={...s,calendar:SP.unmove(after,MONDAY,heavy.key)};
  expect(items(SP.weekSchedule(back,MONDAY,MONDAY)).find(x=>x.key===heavy.key).date).toBe(heavy.date);
});
test('planning libre : changer ses jours d’entraînement replace les séances', ()=>{
  const s=meneur();s.dossier={...s.dossier,answers:{...s.dossier.answers,freeDays:[1,3,6]}};
  const days=items(SP.weekSchedule(s,MONDAY,MONDAY)).filter(x=>x.physical&&!x.moved).map(x=>x.day);
  expect(days.length).toBeGreaterThan(0);
  expect(days.every(d=>[1,3,6].includes(d))).toBe(true);
});

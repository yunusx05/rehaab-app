// Lot « équilibre » : planning muscu + skills unifié, jambe faible, coordination, remise à zéro, onglet nutrition.
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const PD=require('../player-dossier.js');
const BP=require('../basket-pathway.js');
const JP=require('../player-profile.js');
const AP=require('../athletic-profile.js');
const SK=require('../basket-skills.js');
const SP=require('../season-plan.js');
const BN=require('../basket-nutrition.js');

const MONDAY='2026-10-19';
// Joueur en étape 2, 4 séances physiques voulues, club mardi et jeudi, match samedi, 3 séances skills par semaine.
function player(){
  const s=PT.initialState();s.profile={...s.profile,name:'Y',onboarded:true,age:27,height:183,weight:82};
  s.owned=['bodyweight','dumbbells','bench','box','ball','court'];s.checkIn.equipment=s.owned;
  s.pathway=BP.create({startStep:2,now:'2026-09-01'});
  s.dossier={...PD.blank(),answers:{sessions:'4',maxMinutes:'75',freeDays:[0,1,2,3,4,5,6]},date:'2026-09-01'};
  s.basketProfile={practiceDays:[1,3],matchDay:5};
  s.skills=SK.saveProfile(SK.blank(),{answers:{}});s.skills.program.perWeek=3;
  return s;
}
const all=w=>w.days.flatMap(d=>d.items.map(x=>({...x,day:d.weekday})));
async function seed(page,data,route){
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('test-seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.goto('/#'+route);await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
async function state(page){await page.waitForTimeout(300);return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);}
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}

test('planning : les skills gardent leurs 3 séances, au besoin en version courte après la muscu',()=>{
  const s=player(),w=SP.weekSchedule(s,MONDAY,MONDAY);
  expect(w.skills).toEqual({wanted:3,placed:3});
  const combined=all(w).filter(x=>x.combined);
  combined.forEach(x=>{expect(x.minutes).toBeGreaterThanOrEqual(20);expect(all(w).some(y=>y.physical&&y.day===x.day)).toBe(true);});
  expect(all(w).filter(x=>x.type==='skills').every(x=>![1,3,5].includes(x.day))).toBe(true);
  expect(SP.violations(s,w)).toEqual([]);
});

test('planning : jour réglé sur muscu, skills, les deux ou repos',()=>{
  const s=player();
  s.calendar=SP.setDayMode(s,'2026-10-21','skills');            // mercredi : skills seulement (cette semaine)
  s.calendar=SP.setDayMode(s,'2026-10-20','both',{every:true}); // mardi : muscu + skills chaque semaine, même jour de club
  s.calendar=SP.setDayMode(s,'2026-10-25','off',{every:true});  // dimanche : repos
  const w=SP.weekSchedule(s,MONDAY,MONDAY),day=n=>all(w).filter(x=>x.day===n);
  expect(day(2).every(x=>x.type==='skills'||x.type==='care')).toBe(true);
  expect(day(2).some(x=>x.type==='skills')).toBe(true);
  expect(day(1).some(x=>x.physical)&&day(1).some(x=>x.type==='skills')).toBe(true);
  expect(day(6).filter(x=>x.type!=='care')).toEqual([]);
  expect(all(w).filter(x=>x.type==='skills').length).toBe(3);
  expect(day(1).filter(x=>x.type==='skills').length).toBe(1);
  // Le réglage hebdomadaire s'applique aussi à la semaine suivante, pas le réglage ponctuel.
  expect(SP.dayMode(s,'2026-10-27')).toBe('both');
  expect(SP.dayMode(s,'2026-10-28')).toBe('auto');
  // Déplacer de la muscu sur un jour « skills » : alerte, puis placement forcé possible.
  const key=all(w).find(x=>x.physical).key,r=SP.reschedule(s,MONDAY,key,'2026-10-21');
  expect(r.ok).toBe(false);expect(r.why).toMatch(/Skills/);expect(r.canForce).toBe(true);
  expect(SP.validateCalendar({week:{'1':'both','9':'muscu'},dates:{'2026-10-21':'nope'}})).toMatchObject({week:{'1':'both'},dates:{}});
});

test('jambe droite en retrait : un exercice pour elle seule les jours de jambes, consigne sur les autres',()=>{
  const s=player();s.basketProfile=null;s.athletic={...AP.create(),answers:{weakLeg:'right'},date:'2026-10-10'};
  for(const day of ['A','C']){
    const p=BP.sessionPlanCore(PT,JP,s,s.pathway,day),weak=p.exercises.filter(e=>e.weakSide==='right');
    expect(weak.length,day).toBe(1);
    expect(weak[0].name).toMatch(/jambe droite seule/);
    expect(p.reasons.join(' ')).toMatch(/Jambe droite en retrait/);
  }
  expect(BP.sessionPlanCore(PT,JP,s,s.pathway,'B').exercises.some(e=>e.weakSide)).toBe(false);
  // Les tests priment sur le ressenti : saut une jambe à 20 % d'écart côté gauche.
  s.athletic.tests={hop:[{left:120,right:150,date:'2026-10-10'}]};
  expect(AP.weakLeg(s.athletic)).toMatchObject({side:'left',source:'tests'});
  expect(AP.weakLeg({...AP.create(),answers:{weakLeg:'none'}})).toBe(null);
});

test('coordination : nouveau domaine, échauffement de chaque séance skills tant qu’elle n’est pas un point fort',()=>{
  const s=PT.initialState();s.owned=['bodyweight','ball','court'];
  s.skills=SK.saveProfile(SK.blank(),{answers:{weakHand:0}});
  expect(s.skills.levels.coordination).toBe(1);
  expect(SK.session(PT,s,{minutes:45}).exercises[0].skillArea).toBe('coordination');
  // Réception et plot notés « Difficile » : la coordination devient le cœur de la séance.
  s.skills=SK.saveProfile(SK.blank(),{answers:{catchTwo:0,coneHands:0,feetHands:0}});
  expect(SK.session(PT,s,{minutes:45}).exercises.filter(e=>e.skillArea==='coordination').length).toBeGreaterThanOrEqual(3);
  s.skills=SK.saveProfile(SK.blank(),{answers:{catchTwo:2,coneHands:2,feetHands:2,weakHand:0}});
  expect(SK.session(PT,s,{minutes:45}).exercises[0].skillArea).toBe('handle');
});

test('remise à zéro : profil et tests effacés, matériel et historique gardés (sauf demande)',()=>{
  const s=player();s.athletic={...AP.create(),date:'2026-10-10'};s.sessions=[{id:'a',date:'2026-10-10',title:'x',minutes:30,entries:{},exercises:[]}];
  s.nutrition=BN.save(s,{goal:'gain'}).nutrition;
  const r=PT.resetProfile(s);
  expect(r.profile.onboarded).toBe(false);expect(r.profile.name).toBe('Y');
  ['pathway','athletic','dossier','skills','basketProfile','nutrition','calendar','seasonPlan'].forEach(k=>expect(r[k],k).toBe(null));
  expect(r.owned).toEqual(s.owned);expect(r.sessions.length).toBe(1);
  expect(PT.resetProfile(s,{all:true}).sessions).toEqual([]);
  expect(()=>PT.validateState(PT.resetProfile(s,{all:true}))).not.toThrow();
});

test('nutrition : repères, horaires autour de la séance, compléments adaptés',()=>{
  let s=player();
  expect(BN.plan(s).ok).toBe(false);
  s=BN.save(s,{...BN.prefill(s),goal:'recomp',formula:'male',activity:'light',trainTime:'evening',meals:'3',diet:['halal'],digestion:'sensitive',fish:'0',sleep:'mid',caffeine:'some',fasting:'ramadan',health:['kidney']});
  const p=BN.plan(s);
  expect(p.ok).toBe(true);
  expect(p.macros.protein).toBe(165);
  expect(p.energy.target).toBeLessThan(p.energy.total);
  expect(p.training[0].time).toBe('16 h30');
  expect(p.supplements.find(x=>x.id==='creatine').verdict).toBe('doctor');
  expect(p.supplements.find(x=>x.id==='omega3').note).toMatch(/halal/);
  expect(p.supplements.find(x=>x.id==='whey').note).toMatch(/isolate/);
  expect(p.foods.avoid.join(' ')).toMatch(/oignon/);
  expect(p.fasting.length).toBeGreaterThan(0);
  const ted=BN.plan(BN.save(s,{...s.nutrition.answers,health:['ted']}));
  expect(ted.energy).toBe(null);expect(ted.blocked).toBeTruthy();
});

test('écrans : planning réglable par jour, onglet nutrition avec questionnaire, remise à zéro, sans débordement à 390 px',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const s=player();
  await seed(page,s,'calendar');
  await expect(page.locator('.calendar-balance')).toContainText('skills');
  const firstFree=page.locator('.calendar-day-mode').first();
  await firstFree.selectOption('skills');
  expect(Object.values((await state(page)).calendar.dates)).toContain('skills');
  await noOverflow(page);
  await page.locator('.bottom-nav button',{hasText:'Nutrition'}).click();
  await page.getByRole('button',{name:/Faire le questionnaire/}).click();
  for(const label of ['Perdre du gras','Masculine','Assis la plupart du temps','Le soir (après 18 h)','3 repas','Halal','Pas de souci','Une fois','7 h ou plus','1 à 2 par jour','Non'])
    await page.getByRole('button',{name:label,exact:true}).first().click();
  await page.getByRole('button',{name:/Voir mes conseils/}).click();
  await expect(page.locator('.nutri-kcal')).toBeVisible();
  await expect(page.locator('.nutri-supp')).toHaveCount(8);
  await noOverflow(page);
  await page.locator('.bottom-nav button',{hasText:'Moi'}).click();
  await page.getByText('Repartir à zéro').click();
  await page.getByRole('button',{name:'Réinitialiser mon profil'}).click();
  await page.getByRole('button',{name:'Oui, repartir à zéro'}).click();
  const after=await state(page);
  expect(after.profile.onboarded).toBe(false);expect(after.nutrition).toBe(null);
  expect(await page.evaluate(()=>!!localStorage.getItem('rh_personal_reset_backup_v1'))).toBe(true);
});

test('imprévu : depuis l’accueil, reporter ou annuler la séance du jour, puis la rétablir',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const s=player(),day=SP.weekSchedule(s,MONDAY,MONDAY).days.find(d=>d.items.some(x=>x.status==='planned'&&x.type!=='care'));
  await page.clock.setFixedTime(new Date(`${day.date}T10:00:00`));
  await page.setViewportSize({width:390,height:844});await seed(page,s,'today');
  await page.getByRole('button',{name:'Un imprévu aujourd’hui ?'}).click();
  await page.getByRole('button',{name:/Autre empêchement/}).click();
  await page.getByRole('button',{name:'Reporter',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Séance reportée.'})).toBeVisible();
  let saved=await state(page);expect(saved.calendar.excused.action).toBe('postpone');
  expect(SP.weekSchedule(saved,day.date,day.date).days.find(d=>d.date===day.date).items).toEqual([]);
  await page.getByRole('button',{name:'Finalement, je peux m’entraîner'}).click();
  await expect(page.getByRole('button',{name:'Un imprévu aujourd’hui ?'})).toBeVisible();
  saved=await state(page);expect(saved.calendar.excused).toBe(null);
  await page.getByRole('button',{name:'Un imprévu aujourd’hui ?'}).click();
  await page.getByRole('button',{name:/Autre empêchement/}).click();
  await page.getByRole('button',{name:'Annuler',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Séance annulée.'})).toBeVisible();
  await noOverflow(page);await page.screenshot({path:'test-results/imprevu-accueil.png'});expect(errors).toEqual([]);
});

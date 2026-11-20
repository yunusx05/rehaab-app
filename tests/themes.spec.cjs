// Lot 45 : « Mes thèmes ». Chaque thème (muscu, skills, tir, vivacité, cardio, circuit) s'allume, s'éteint ou se met en pause ;
// le planning se refait sans lui, sans casser les règles de charge. Tir éteint = plus aucun tir dans les skills ni dans les blocs ; Extra le garde.
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const PD=require('../player-dossier.js');
const BP=require('../basket-pathway.js');
const JP=require('../player-profile.js');
const SP=require('../season-plan.js');
const SK=require('../basket-skills.js');

const MONDAY='2026-10-12';
const all=w=>w.days.flatMap(d=>d.items);
const HOME=['bodyweight','dumbbells','kettlebell','barbell','bench','bands','bike','rope','vest','sliders','box','ball','court'];
// Tir en point faible : sans le thème, la séance skills doit trouver un autre point de départ.
const ANSWERS={weakHand:1,eyesUp:1,pressure:1,moves:1,speedDribble:1,catchShoot:0,pullup:0,freeThrow:0,range:0,onMove:0,weakFinish:1,contactFinish:1,floater:1,footFinish:1,explosive:1,tripleThreat:1,stops:1};

// Sa semaine : lun/mer/ven muscu à la maison, mar skills (club), jeu shooting (club), sam skills, dim repos, 60 min max.
function joueur(){
  const s=PT.initialState();
  s.profile.onboarded=true;s.profile.experience='regular';s.profile.impactReady=true;
  s.owned=HOME;s.checkIn.equipment=HOME;
  s.player=JP.validatePlayer({position:'meneur'});
  s.pathway=BP.create({startStep:2,now:'2026-10-05'});
  s.dossier={...PD.blank(),answers:{sessions:'3',maxMinutes:'60',freeDays:[0,1,2,3,4,5],practiceDays:[1,3]},date:'2026-10-05'};
  s.basketProfile={practiceDays:[1,3]};
  s.skills=SK.saveProfile(null,{answers:ANSWERS});
  s.calendar={...SP.blankCalendar(),week:{0:'muscu',1:'skills',2:'muscu',3:'shooting',4:'muscu',5:'skills',6:'off'}};
  return s;
}
const off=(s,id,opts)=>({...s,themes:SP.setTheme(s,id,false,{now:MONDAY,...opts})});
const shotIds=list=>list.filter(e=>SK.isShot(SK.byId(e.id)||e)).map(e=>e.id);

test('tir éteint : plus de séance de tir, ni de tir dans les skills, les blocs ou l’intensité match ; Extra le garde',()=>{
  const s=joueur(),before=SP.weekSchedule(s,MONDAY,MONDAY);
  expect(all(before).some(x=>x.type==='shooting')).toBe(true);
  const o=off(s,'shooting'),w=SP.weekSchedule(o,MONDAY,MONDAY);
  expect(all(w).some(x=>x.type==='shooting')).toBe(false);
  expect(SP.violations(o,w)).toEqual([]);
  // Jeudi était réglé sur « Shooting » : il repasse en Auto (le réglage reste gardé pour plus tard).
  expect(w.days[3].mode).toBe('auto');
  expect(o.calendar.week[3]).toBe('shooting');
  expect(SP.modesFor(o,MONDAY).shooting).toBeUndefined();
  expect(all(w).filter(x=>x.type==='skills').every(x=>!/tir/.test(x.label))).toBe(true);
  // Séance skills avec panier : aucun tir, aucun lancer franc.
  const hoop={...o,skills:{...o.skills,hoopDate:'2026-10-13'}};
  const with_=SK.session(PT,{...s,skills:hoop.skills},{minutes:60,date:'2026-10-13'});
  expect(shotIds(with_.exercises).length).toBeGreaterThan(0);
  const sess=SK.session(PT,hoop,{minutes:60,date:'2026-10-13'});
  expect(sess.error).toBeUndefined();
  expect(shotIds(sess.exercises)).toEqual([]);
  expect(sess.title).toBe('Skills · dribble, lay-up');
  expect(sess.exercises.length).toBeGreaterThanOrEqual(3);
  const match=SK.matchSession(PT,hoop,{minutes:30,date:'2026-10-13'});
  expect(shotIds(match.exercises||[])).toEqual([]);
  // Bloc après la muscu du haut du corps : dribble puis appuis.
  const block=SK.block(PT,hoop,{exercises:[],minutes:15,date:'2026-10-13'});
  if(block) expect(shotIds(block.exercises)).toEqual([]);
  // Extra : la séance à la carte « Tir » reste disponible.
  const extra=SK.areaSession(PT,hoop,{theme:'shoot',minutes:30,date:'2026-10-13'});
  expect(extra.error).toBeUndefined();
  expect(shotIds(extra.exercises).length).toBeGreaterThan(0);
});

test('chaque thème éteint disparaît du planning, sans règle cassée ; le soin reste',()=>{
  const s=joueur();
  s.symptoms=[{region:'knee',severity:2,active:true,date:'2026-10-10'}];
  const types={muscu:['pathway','muscu'],skills:['skills'],shooting:['shooting'],vivacite:['vivacite'],cardio:['cardio'],circuit:['cardio']};
  for(const id of Object.keys(SP.THEMES)){
    const o=off(s,id),w=SP.weekSchedule(o,MONDAY,MONDAY),items=all(w);
    const gone=id==='circuit'?items.filter(x=>x.kind==='wod'):id==='cardio'?items.filter(x=>x.type==='cardio'&&x.kind!=='wod'):items.filter(x=>types[id].includes(x.type));
    expect(gone,id).toEqual([]);
    expect(SP.violations(o,w),id).toEqual([]);
    expect(items.some(x=>x.type==='care'),id).toBe(true);
  }
});

test('pause : le thème revient seul la semaine qui suit la fin de la pause ; sauvegarde relue',()=>{
  const s=joueur(),now='2026-10-15'; // jeudi
  const themes=SP.setTheme(s,'shooting',false,{weeks:1,now});
  expect(themes.off.shooting.until).toBe('2026-10-25'); // dimanche de la semaine suivante
  const o={...s,themes};
  expect(all(SP.weekSchedule(o,'2026-10-19','2026-10-19')).some(x=>x.type==='shooting')).toBe(false);
  expect(all(SP.weekSchedule(o,'2026-10-26','2026-10-26')).some(x=>x.type==='shooting')).toBe(true);
  // Données inconnues ignorées, anciennes sauvegardes sans thèmes : tout allumé.
  expect(SP.validateThemes({off:{shooting:{until:'nope'},laser:{until:null}}})).toEqual({off:{shooting:{until:null}},dismissed:[]});
  expect(PT.validateState({...PT.initialState(),themes:{off:{skills:{until:null}}}}).themes.off.skills).toEqual({until:null});
  expect(SP.themeOn(PT.validateState(PT.initialState()),'skills')).toBe(true);
});

test('jour libéré : repos, avec une seule suggestion qu’on accepte ou qu’on écarte',()=>{
  // Jeudi sans club : le jour libéré peut recevoir une séance skills (un jour de club, l'app n'en ajoute jamais).
  const base=joueur();base.basketProfile={practiceDays:[1]};base.dossier.answers.practiceDays=[1];
  const clubThursday=off(joueur(),'shooting');
  expect(SP.themeSuggestion(clubThursday,MONDAY,MONDAY)).toBe(null);
  const o=off(base,'shooting');
  const sug=SP.themeSuggestion(o,MONDAY,MONDAY);
  expect(sug).toBeTruthy();
  expect(sug.id).toBe('skills');
  expect(sug.why).toMatch(/séance en moins|repos/);
  const yes=SP.applyThemeSuggestion(o,'skills');
  expect(yes.skills.program.perWeek).toBe(o.skills.program.perWeek+1);
  const w=SP.weekSchedule(yes,MONDAY,MONDAY);
  expect(SP.violations(yes,w)).toEqual([]);
  const no={...o,themes:SP.dismissThemeSuggestion(o,sug.key)};
  expect(SP.themeSuggestion(no,MONDAY,MONDAY)).toBe(null);
  // Tout allumé : rien à proposer.
  expect(SP.themeSuggestion(base,MONDAY,MONDAY)).toBe(null);
});

const seed=(page,data)=>page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('s')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('s','1');}},{data,key:PT.STORAGE_KEY});
const saved=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),PT.STORAGE_KEY);

test('écran : éteindre le tir montre ce qui change, refait le planning, et « Annuler » remet tout ; muscu éteinte sans erreur',async({page})=>{
  test.setTimeout(90000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  await page.clock.install({time:new Date('2026-10-12T09:00:00')});
  const s=joueur();s.basketProfile={practiceDays:[1]};s.dossier.answers.practiceDays=[1];
  await seed(page,s);
  await page.goto('/#calendar');
  await expect(page.locator('.calendar-cell')).toHaveCount(7);
  await expect(page.locator('.calendar-item',{hasText:'Séance de tir'})).toHaveCount(1);
  await page.getByRole('button',{name:/Mes thèmes/}).first().click();
  await expect(page.getByRole('heading',{name:'Mes thèmes.'})).toBeVisible();
  const row=page.locator('.theme-row.theme-shooting');
  await row.getByRole('switch').click();
  await expect(row.locator('.theme-preview')).toContainText('Séance de tir');
  await row.getByRole('button',{name:'2 sem.'}).click();
  await row.getByRole('button',{name:'Mettre en pause'}).click();
  await expect(row.getByRole('switch')).toHaveAttribute('aria-checked','false');
  await expect(row).toContainText('En pause jusqu’au');
  await expect.poll(async()=>((await saved(page)).themes||{off:{}}).off.shooting?.until).toBe('2026-10-25');
  // Suggestion : le jeudi libéré peut recevoir une séance skills.
  await expect(page.locator('.theme-suggestion').first()).toContainText('séance skills');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Voir mon planning'}).click();
  await expect(page.locator('.calendar-item',{hasText:'Séance de tir'})).toHaveCount(0);
  await expect(page.locator('.themes-off')).toContainText('Tir en pause');
  // Annuler depuis « Mes thèmes ».
  await page.locator('.themes-off').click();
  await page.locator('.theme-row.theme-shooting').getByRole('switch').click();
  await expect(page.locator('.theme-undo')).toContainText('rallumé');
  await page.locator('.theme-undo').getByRole('button',{name:'Annuler'}).click();
  await expect(page.locator('.theme-row.theme-shooting').getByRole('switch')).toHaveAttribute('aria-checked','false');
  // Muscu éteinte : avertissement, puis accueil et parcours sans erreur.
  const muscu=page.locator('.theme-row.theme-muscu');
  await muscu.getByRole('switch').click();
  await expect(muscu.locator('.notice.warning')).toContainText('se met en pause');
  await muscu.getByRole('button',{name:'Éteindre'}).click();
  await page.goto('/#today');
  await expect(page.locator('.personal-app')).toBeVisible();
  await expect(page.locator('.themes-off')).toContainText('Muscu éteint');
  await page.goto('/#pathway');
  await page.goto('/#calendar');
  await expect(page.locator('.calendar-item',{hasText:'Force'})).toHaveCount(0);
  expect(errors).toEqual([]);
});

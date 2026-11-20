// Lot 44 : (1) le circuit training ne disparaît plus du planning quand aucun jour ne respecte toutes les règles,
// et peut avoir un jour fixe ; (2) la barre du bas reste en bas : seule la zone de contenu défile, jamais la page.
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const PD=require('../player-dossier.js');
const BP=require('../basket-pathway.js');
const JP=require('../player-profile.js');
const SP=require('../season-plan.js');
const BC=require('../basket-cardio.js');

const MONDAY='2026-10-12';
const all=w=>w.days.flatMap(d=>d.items.map(x=>({...x,day:d.weekday})));
const HOME=['bodyweight','dumbbells','kettlebell','barbell','bench','bands','bike','rope','vest','sliders','box','ball','court'];
function joueur({maxMinutes='60'}={}){
  const s=PT.initialState();
  s.profile.onboarded=true;s.profile.experience='regular';s.profile.impactReady=true;
  s.owned=HOME;s.checkIn.equipment=HOME;
  s.player=JP.validatePlayer({position:'meneur'});
  s.pathway=BP.create({startStep:2,now:'2026-10-05'});
  s.dossier={...PD.blank(),answers:{sessions:'3',maxMinutes,freeDays:[0,1,2,3,4,5],practiceDays:[1,3]},date:'2026-10-05'};
  s.basketProfile={practiceDays:[1,3]};
  s.calendar={...SP.blankCalendar(),week:{0:'muscu',1:'skills',2:'muscu',3:'shooting',4:'muscu',5:'skills',6:'off'}};
  return s;
}

test('circuit : durée max courte → il reste au programme, raccourci, avec une alerte, jamais un jour de jambes lourdes',()=>{
  for(const m of ['30','45','50']){
    const s=joueur({maxMinutes:m}),w=SP.weekSchedule(s,MONDAY,MONDAY),wod=all(w).filter(x=>x.kind==='wod');
    expect(wod,`max ${m}`).toHaveLength(1);
    expect(wod[0].warning).toBeTruthy();
    expect(wod[0].minutes).toBeGreaterThanOrEqual(15);
    const day=w.days[wod[0].day];
    expect(day.club.match).toBe(false);
    expect(day.items.some(x=>x.legs==='heavy')).toBe(false);
    expect(w.warnings.some(x=>/Circuit/.test(x))).toBe(false);
    // Le circuit placé faute de mieux porte l'alerte : il ne rend pas fautives les autres séances.
    expect(SP.violations(s,w)).toEqual([]);
  }
});

test('circuit : jamais un jour de match, une veille ou un lendemain de match, même faute de mieux',()=>{
  const s=joueur();s.events=[{type:'match',date:'2026-10-17'}];
  const w=SP.weekSchedule(s,MONDAY,MONDAY),wod=all(w).filter(x=>x.kind==='wod');
  for(const x of wod) expect([4,5,6]).not.toContain(x.day);
});

test('circuit : jour fixe choisi (Ma semaine type) → placé ce jour-là chaque semaine, alerte si une règle casse',()=>{
  const s={...joueur(),cardio:{perWeek:3,circuitDay:4}};
  for(const monday of [MONDAY,'2026-10-19']){
    const k=all(SP.weekSchedule(s,monday,monday)).find(x=>x.kind==='wod');
    expect(k.day).toBe(4);expect(k.fixedDay).toBe(true);
    expect(k.warning).toMatch(/jambes lourdes/); // vendredi = Force jambes
  }
  expect(BC.validate({perWeek:3,circuitDay:4}).circuitDay).toBe(4);
  expect(BC.validate({perWeek:3,circuitDay:9}).circuitDay).toBeUndefined();
  // Sans jour fixe : retour au placement auto (mercredi, après le haut du corps).
  expect(all(SP.weekSchedule(joueur(),MONDAY,MONDAY)).find(x=>x.kind==='wod').day).toBe(2);
});

test('écran : jour du circuit réglable dans Ma semaine type ; la barre du bas reste en bas quand le contenu défile',async({page})=>{
  test.setTimeout(90000);
  await page.setViewportSize({width:390,height:844});
  await page.clock.install({time:new Date('2026-10-14T09:00:00')});
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('s')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('s','1');}},{data:joueur(),key:PT.STORAGE_KEY});
  // Lot 45 : le jour du circuit se règle dans « Mes thèmes ».
  await page.goto('/#themes');
  await page.getByLabel('Jour du circuit training').selectOption('4');
  await page.getByRole('button',{name:'Voir mon planning'}).click();
  await expect(page.locator('.calendar-day').nth(4)).toContainText('Circuit training');
  await expect.poll(()=>page.evaluate(k=>(JSON.parse(localStorage.getItem(k)).cardio||{}).circuitDay,PT.STORAGE_KEY)).toBe(4);
  // La page elle-même ne défile jamais ; c'est #root qui défile.
  const m=await page.evaluate(async()=>{const r=document.getElementById('root');r.scrollTo(0,r.scrollHeight);await new Promise(x=>setTimeout(x,300));
    const nav=document.querySelector('.bottom-nav').getBoundingClientRect();return {page:window.scrollY,root:r.scrollTop,canScroll:r.scrollHeight>r.clientHeight,navBottom:nav.bottom,h:innerHeight};});
  expect(m.canScroll).toBe(true);expect(m.root).toBeGreaterThan(0);expect(m.page).toBe(0);
  expect(m.navBottom).toBeGreaterThan(m.h-40);expect(m.navBottom).toBeLessThanOrEqual(m.h);
  // Changer d'onglet ramène en haut de l'écran.
  await page.locator('.bottom-nav').getByRole('button',{name:'Plan'}).click();
  await expect.poll(()=>page.evaluate(()=>document.getElementById('root').scrollTop)).toBe(0);
});

// Retour du 18/11 (son export) : plan recommencé un mardi, mardi réglé « Muscu » ce jour-là → jambes lourdes mercredi et vendredi,
// mardi et jeudi club, samedi terrain, dimanche repos : aucun jour sûr. Le circuit doit rester visible et se placer à la main.
test('circuit sans jour sûr : visible « à placer », placement à la main avec alerte',()=>{
  const s=joueur();
  s.events=[{type:'match',date:'2026-10-17'}]; // samedi : vendredi veille, jambes lourdes poussées au mercredi
  const w=SP.weekSchedule(s,MONDAY,MONDAY);
  expect(all(w).some(x=>x.kind==='wod')).toBe(false);
  expect(w.unplaced.map(x=>x.key)).toEqual(['K5']);
  expect(w.unplaced[0].why).toMatch(/Choisis-le toi-même/);
  expect(SP.ruleBreakAt(s,MONDAY,'K5','2026-10-18')).toBeTruthy(); // dimanche = lendemain de match
  const r=SP.reschedule(s,MONDAY,'K5','2026-10-14');
  expect(r.ok).toBe(false);expect(r.canForce).toBe(true);
  const f=SP.reschedule(s,MONDAY,'K5','2026-10-14',{force:true});expect(f.ok).toBe(true);
  const w2=SP.weekSchedule({...s,calendar:SP.validateCalendar(f.calendar)},MONDAY,MONDAY),k=all(w2).find(x=>x.kind==='wod');
  expect(k.day).toBe(2);expect(k.warning).toBeTruthy();expect(w2.unplaced).toEqual([]);
});

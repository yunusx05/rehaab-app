// Lot 42 : circuit training full body une fois par semaine (style CrossFit, matériel de la maison),
// et échange de deux journées (« faire aujourd'hui la séance de demain ») sans perturber le reste de la semaine.
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

// Sa semaine réelle : lun/mer/ven muscu à la maison, mar skills (club), jeu shooting (club), sam skills, dim repos, 60 min max.
function joueur({owned=HOME}={}){
  const s=PT.initialState();
  s.profile.onboarded=true;s.profile.experience='regular';s.profile.impactReady=true;
  s.owned=owned;s.checkIn.equipment=owned;
  s.player=JP.validatePlayer({position:'meneur'});
  s.pathway=BP.create({startStep:2,now:'2026-10-05'});
  s.dossier={...PD.blank(),answers:{sessions:'3',maxMinutes:'60',freeDays:[0,1,2,3,4,5],practiceDays:[1,3]},date:'2026-10-05'};
  s.basketProfile={practiceDays:[1,3]};
  s.calendar={...SP.blankCalendar(),week:{0:'muscu',1:'skills',2:'muscu',3:'shooting',4:'muscu',5:'skills',6:'off'}};
  return s;
}

test('circuit : une fois par semaine, à la maison, jamais un jour de club ni avec des jambes lourdes, dans la durée max',()=>{
  const s=joueur(),w=SP.weekSchedule(s,MONDAY,MONDAY),wod=all(w).filter(x=>x.kind==='wod');
  expect(wod).toHaveLength(1);
  const day=w.days[wod[0].day];
  expect(day.club.practice||day.club.match).toBe(false);
  expect(['skills','shooting']).not.toContain(day.mode);
  expect(day.items.some(x=>x.legs==='heavy')).toBe(false);
  const total=day.items.filter(x=>x.type!=='care').reduce((n,x)=>n+x.minutes,0);
  expect(total).toBeLessThanOrEqual(69);
  expect(SP.violations(s,w)).toEqual([]);
  // Réglage à 0 : plus de circuit, le cardio ne bouge pas.
  const off={...s,cardio:{perWeek:3,circuit:0}};
  expect(all(SP.weekSchedule(off,MONDAY,MONDAY)).some(x=>x.kind==='wod')).toBe(false);
  expect(BC.validate({perWeek:3,circuit:0}).circuit).toBe(0);
  expect(BC.validate({perWeek:3}).circuit).toBeUndefined();
});

test('circuit : AMRAP, EMOM puis intervalles d’une semaine à l’autre, mouvements de mon matériel, durée tenue',()=>{
  const s=joueur(),formats=[];
  for(const now of ['2026-10-14','2026-10-21','2026-10-28']){
    const p=BC.wodPlan(PT,JP,s,{now,minutes:20});
    expect(p.error).toBeUndefined();
    expect(p.source).toBe('cardio');expect(p.cardioKind).toBe('wod');
    expect(p.exercises.length).toBeGreaterThanOrEqual(4);
    // Tout se fait avec le matériel possédé, sans le terrain.
    for(const e of p.exercises) expect(e.needs.every(n=>HOME.includes(n)&&n!=='court'),e.id).toBe(true);
    expect(p.estimatedMinutes).toBeLessThanOrEqual(25);
    formats.push(p.format);
  }
  expect(new Set(formats)).toEqual(new Set(['amrap','emom','hiit']));
  // AMRAP : un chrono de bloc et une seule série par mouvement (on enchaîne les tours).
  const amrap=BC.wodPlan(PT,JP,s,{now:'2026-10-14',format:'amrap',minutes:20});
  expect(amrap.blockSeconds).toBeGreaterThan(0);
  expect(amrap.exercises.every(e=>e.sets===1)).toBe(true);
});

test('circuit : sans impact (douleur du genou) → ni sauts, ni corde, ni burpees',()=>{
  const s=joueur();s.symptoms=[{id:'k',region:'knee',active:true,severity:4,date:'2026-10-13'}];
  for(const now of ['2026-10-14','2026-10-21','2026-10-28']){
    const p=BC.wodPlan(PT,JP,s,{now});
    if(p.error) continue;
    expect(p.exercises.some(e=>e.impact),p.exercises.map(e=>e.id).join()).toBe(false);
    expect(p.cardioSoft).toBe(true);
  }
});

test('échange : la séance de vendredi faite mercredi, celle de mercredi vendredi ; le reste de la semaine ne bouge pas ; annulable',()=>{
  const s=joueur(),now='2026-10-14',before=SP.weekSchedule(s,MONDAY,now);
  const key=w=>w.days.map(d=>d.items.map(x=>x.key).sort().join('+'));
  const r=SP.swapDays(s,now,'2026-10-16',now);
  expect(r.ok).toBe(true);
  const s2={...s,calendar:SP.validateCalendar(JSON.parse(JSON.stringify(r.calendar)))};
  const after=SP.weekSchedule(s2,MONDAY,now),k0=key(before),k1=key(after);
  expect(k1[2]).toBe(k0[4]);expect(k1[4]).toBe(k0[2]);
  for(const i of [0,1,3,5,6]) expect(k1[i],`jour ${i}`).toBe(k0[i]);
  // Annuler l'échange : tout revient comme avant (types de jour compris).
  const back=SP.weekSchedule({...s2,calendar:SP.unswap(s2)},MONDAY,now);
  expect(key(back)).toEqual(k0);
  expect(back.days.map(d=>d.mode)).toEqual(before.days.map(d=>d.mode));
});

test('échange : une règle cassée est signalée (club), jamais un jour passé ni une autre semaine',()=>{
  const s=joueur(),now='2026-10-14';
  const r=SP.swapDays(s,now,'2026-10-15',now); // jeudi = club
  expect(r.ok).toBe(true);
  expect(r.warnings.length).toBeGreaterThan(0);
  expect(SP.swapDays(s,now,'2026-10-13',now).ok).toBe(false);
  expect(SP.swapDays(s,now,'2026-10-20',now).ok).toBe(false);
  expect(SP.swapOptions(s,now).map(d=>d.date)).toEqual(['2026-10-15','2026-10-16','2026-10-17']);
});

test('écran : Un imprévu → Faire la séance d’un autre jour → échange appliqué et annulable depuis l’accueil',async({page})=>{
  test.setTimeout(90000);
  const s=joueur();
  await page.clock.install({time:new Date('2026-10-14T09:00:00')});
  await page.addInitScript(({data,key})=>{localStorage.setItem(key,JSON.stringify(data));},{data:s,key:PT.STORAGE_KEY});
  await page.goto('/#mishap');
  await page.getByText('Faire la séance d’un autre jour').click();
  await page.getByRole('button',{name:/Faire celle du vendredi aujourd’hui/}).click();
  await expect(page.locator('.week-hub')).toBeVisible({timeout:30000});
  await expect(page.locator('.swap-note')).toContainText('mercredi ↔ vendredi');
  await expect.poll(()=>page.evaluate(k=>!!JSON.parse(localStorage.getItem(k)).calendar.swapped,PT.STORAGE_KEY)).toBe(true);
  const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).calendar.swapped,PT.STORAGE_KEY);
  expect(saved.a).toBe('2026-10-14');expect(saved.b).toBe('2026-10-16');
  await page.locator('.swap-note').getByRole('button',{name:'Annuler l’échange'}).click();
  await expect(page.locator('.swap-note')).toHaveCount(0);
});

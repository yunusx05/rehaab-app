// Lot 25 : l'accueil et le calendrier disent la même chose. Si le planning prévoit de la muscu aujourd'hui, l'accueil ne propose pas des skills.
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const PD=require('../player-dossier.js');
const BP=require('../basket-pathway.js');
const SK=require('../basket-skills.js');
const SP=require('../season-plan.js');
const PP=require('../personal-programs.js');

const MONDAY='2026-10-19';
const ORDER=['pathway','reset','muscu','skills'];
// Étape 2, un programme muscu actif et un programme skills : le même cas que sur le téléphone.
function player(){
  const s=PT.initialState();s.profile={...s.profile,name:'Y',onboarded:true,age:27,height:183,weight:82,safeties:true};
  s.owned=['bodyweight','dumbbells','bench','box','ball','court'];s.checkIn.equipment=s.owned;
  s.pathway=BP.create({startStep:2,now:'2026-09-01'});
  s.dossier={...PD.blank(),answers:{sessions:'4',maxMinutes:'75',freeDays:[0,1,2,3,4,5,6]},date:'2026-09-01'};
  s.skills=SK.saveProfile(SK.blank(),{answers:{}});s.skills.program.perWeek=3;
  const made=PP.createProgram(s,{familyId:'fit',weeks:8,daysPerWeek:3,minutes:30,equipment:s.owned,constraints:[]});
  if(made.error)throw new Error(made.error);
  s.program=made.program;
  return s;
}
const dayOf=i=>{const d=new Date(`${MONDAY}T12:00:00`);d.setDate(d.getDate()+i);return PT.dateKey(d);};
// Ce que dit le calendrier de l'app pour ce jour, calculé dans l'app (même date simulée, mêmes données que l'écran).
const inApp=(page,date)=>page.evaluate(({date,key,order})=>{
  const s=JSON.parse(localStorage.getItem(key)),PTx=window.PersonalTraining,SPx=window.SeasonPlan;
  const items=SPx.weekSchedule(s,date,date).days.find(d=>d.date===date).items.filter(x=>x.status==='planned'&&order.includes(x.type));
  items.sort((x,y)=>order.indexOf(x.type)-order.indexOf(y.type));
  return {kind:PTx.todayPlan(s,date).kind,primary:items[0]||null};
},{date,key:PT.STORAGE_KEY,order:ORDER});
// Une seule page pour toute la semaine : l'horloge est avancée d'un jour, puis la page est rechargée.
async function start(page,s){
  await page.clock.install({time:new Date(`${dayOf(0)}T09:00:00`)});
  await page.addInitScript(({data,key})=>{localStorage.setItem(key,JSON.stringify(data));},{data:s,key:PT.STORAGE_KEY});
  await page.goto('/#today');await expect(page.locator('.week-hub')).toBeVisible({timeout:30000});
}
async function openDay(page,date,first){
  if(!first){await page.clock.setFixedTime(new Date(`${date}T09:00:00`));await page.reload();await expect(page.locator('.week-hub')).toBeVisible({timeout:30000});}
  return inApp(page,date);
}

test('accueil : le titre de la séance du jour est celui du calendrier, chaque jour de la semaine',async({page})=>{
  test.setTimeout(180000);
  const s=player();let checked=0;const seen=[];
  await start(page,s);
  for(let i=0;i<7;i++){
    const date=dayOf(i),{kind,primary}=await openDay(page,date,i===0);
    if(['train','light'].includes(kind)&&primary){
      await expect(page.locator('.week-hub .today-plan h2')).toHaveText(primary.label);
      await expect(page.locator('.week-hub .today-plan .today-plan-tag')).toContainText(`${primary.minutes} min`);
      checked++;seen.push(primary.type);
    }
  }
  expect(checked,'jours vérifiés : '+seen.join(',')).toBeGreaterThanOrEqual(2);
});

test('accueil : jour muscu au calendrier → bouton muscu, jamais « séance skills »',async({page})=>{
  test.setTimeout(180000);
  const s=player();let found=0;
  await start(page,s);
  for(let i=0;i<7;i++){
    const date=dayOf(i),{kind,primary}=await openDay(page,date,i===0);
    if(['train','light'].includes(kind)&&primary?.type==='muscu'){
      const card=page.locator('.week-hub .today-plan');
      await expect(card.getByRole('button',{name:/Préparer ma séance muscu/})).toBeVisible();
      await expect(card.getByRole('button',{name:/Lancer ma séance skills/})).toHaveCount(0);
      found++;
    }
  }
  test.skip(!found,'aucun jour muscu dans cette semaine de test');
});

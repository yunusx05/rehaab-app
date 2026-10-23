// Captures manuelles du lecteur de séance (SHOTS=<dossier> npx playwright test zz-shots-live).
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const OUT=process.env.SHOTS;test.skip(!OUT,'captures manuelles seulement');
function base(){const data=PT.initialState();data.profile.onboarded=true;data.profile.name='Yunus';data.profile.experience='regular';data.owned=['bodyweight','dumbbells','bench'];data.checkIn.equipment=data.owned;return data;}
function plan(data,ids,{seconds,sets=3}={}){
  const exercises=ids.map(id=>{const e=PT.makePrescription(PT.catalog.find(x=>x.id===id),'classic',30,PT.context(data));e.sets=sets;if(seconds&&e.measure==='seconds')e.seconds=seconds;e.rest=60;return e;});
  return {id:'shots',title:'Force bas du corps',exercises,format:'classic',focus:'muscle',source:'generated',check:data.checkIn,warmupSeconds:0,entries:{},status:'preview',reasons:[]};
}
function started(data,p){const d=PT.startDraft(p,data);return {...d,ready:false,clockStarted:null,stageStarted:null,timer:{...d.timer,endAt:null}};}
async function seed(page,data,w=390,h=844){
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('s')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('s','1');}},{data,key:PT.STORAGE_KEY});
  await page.setViewportSize({width:w,height:h});
  await page.goto('/#session');await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
const shot=(page,name)=>page.waitForTimeout(500).then(()=>page.screenshot({path:`${OUT}/${name}.png`}));
for(const [w,h,tag] of [[390,844,''],[320,640,'-320']]){
test('live reps'+tag,async({page})=>{
  test.setTimeout(60000);
  const data=base();data.draft=started(data,plan(data,['db-squat','db-press','side-plank']));
  await seed(page,data,w,h);
  await shot(page,'1-pret'+tag);
  await page.getByRole('button',{name:'Je suis prêt',exact:true}).click();
  await shot(page,'2-prepare'+tag);
  await page.getByRole('button',{name:'C’est parti',exact:true}).click();
  await shot(page,'3-travail-reps'+tag);
  await page.getByRole('button',{name:'Fait',exact:true}).click();
  await shot(page,'4-repos'+tag);
});
test('live chrono'+tag,async({page})=>{
  const data=base();data.draft=started(data,plan(data,['plank','db-squat'],{seconds:40}));
  await seed(page,data,w,h);
  await page.getByRole('button',{name:'Je suis prêt',exact:true}).click();
  await page.getByRole('button',{name:'C’est parti',exact:true}).click();
  await page.waitForTimeout(2200);
  await shot(page,'5-travail-chrono'+tag);
});
test('live bilan'+tag,async({page})=>{
  const data=base();const d=started(data,plan(data,['db-squat'],{sets:1}));d.ready=true;d.warmupDone=true;d.reviewing=true;d.elapsedBase=1260;d.entries['db-squat'][0].done=true;d.entries['db-squat'][0].reps='10';data.draft=d;
  await seed(page,data,w,h);
  await shot(page,'6-bilan'+tag);
});
}

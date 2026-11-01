// Lot 28 : skills Danny Cooper, consignes de Daryl McCoy, circuit à l'appel annoncé par la voix du coach.
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
global.window=global.window||{};
const SK=require('../basket-skills.js');
require('../drill-sources.js');
const SOURCES=global.window.RehaabSources;

const DANNY=['sk-between-shift','sk-high-low','sk-cross-hardstop','sk-grounded-feet','sk-float-space','sk-kill-dribble','sk-step-through-3','mv-flip-feet'];
function base(){const data=PT.initialState();data.profile.onboarded=true;data.profile.name='Test';data.profile.experience='regular';data.owned=['bodyweight','ball','court'];data.checkIn.equipment=data.owned;return data;}

test('8 drills Danny Cooper, crédités avec la minute de la vidéo',()=>{
  DANNY.forEach(id=>{
    const d=SK.drills.find(x=>x.id===id);
    expect(d,id).toBeTruthy();
    expect(d.transfer&&d.cues.length,id).toBeTruthy();
    expect(SOURCES[id].some(s=>s.creator==='Danny Cooper'&&/&t=\d+s$/.test(s.url)),id).toBe(true);
  });
  expect(SK.drills.find(d=>d.id==='sk-cross-hardstop').instructions.join(' ')).toMatch(/pas de sautillement/);
  expect(new Set(SK.drills.map(d=>d.id)).size).toBe(SK.drills.length);
  // Coordination : le hop step GBG en dribblant.
  expect(SK.drills.find(d=>d.id==='co-hop-step').area).toBe('coordination');
  // GBG crédité sur ses exercices de renfo (lot 27).
  expect(SOURCES['kneel-hip-press'][0].creator).toBe('GBG Hoops');
});

test('consignes Daryl McCoy sur les moves et la défense',()=>{
  const cue=id=>SK.drills.find(d=>d.id===id).cues.join(' ');
  expect(cue('mv-jab-cross')).toMatch(/ouvre ses hanches/);
  expect(cue('mv-in-out-cross')).toMatch(/ouvrir la hanche/);
  expect(cue('df-mirror')).toMatch(/hanche intérieure/);
  expect(cue('sk-change-pace')).toMatch(/se relâche/);
  expect(cue('sk-attack-foot')).toMatch(/Premier dribble devant toi/);
});

test('circuit à l’appel : la voix annonce des moves pendant le chrono',async({page})=>{
  test.setTimeout(60000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__said=[];if(window.speechSynthesis){speechSynthesis.speak=u=>{if(u.text)window.__said.push(u.text);};speechSynthesis.cancel=()=>{};}});
  const data=base();
  const drill=SK.drills.find(d=>d.id==='mv-call-circuit');
  expect(drill.calls.length).toBeGreaterThanOrEqual(6);
  const e={...PT.makePrescription(drill,'classic',30,PT.context(data)),sets:1,seconds:12,rest:20};
  const p={id:'appel',title:'Circuit à l’appel',exercises:[e],format:'classic',focus:'basket-skills',source:'skills',check:data.checkIn,warmupSeconds:0,entries:{},status:'preview',reasons:[]};
  const d=PT.startDraft(p,data);data.draft={...d,ready:false,clockStarted:null,stageStarted:null,timer:{...d.timer,endAt:null}};
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#session');await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
  await page.getByRole('button',{name:'Je suis prêt',exact:true}).click();
  await page.getByRole('button',{name:'C’est parti',exact:true}).click();
  // 5 s de « Prépare-toi », puis 12 s de travail : au moins deux annonces, toutes tirées de la liste du drill.
  await expect.poll(()=>page.evaluate(calls=>window.__said.filter(t=>calls.includes(t)).length,drill.calls),{timeout:22000}).toBeGreaterThanOrEqual(2);
  expect(errors).toEqual([]);
});

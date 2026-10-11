const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const PD=require('../player-dossier.js');
const RW=require('../rehab-warmup.js');

// Le meneur type du plan : 24 mois d'arrêt, +10 kg, gêne sous la rotule à 3/10, club le mardi, match le samedi.
const persona={
  morpho:{age:27,height:183,weight:88,playWeight:78,hand:'right',takeoff:'left',reach:'net'},
  game:{position:'meneur',archetypes:['createur','slasher'],levelPeak:'regional',years:12,weapons:['crossover','hesi','pullup'],strengths:['handle'],weaknesses:['firststep','engine','brake'],club:'yes',practiceDays:[1],matchDay:5,season:'pre',hoop:'weekly'},
  health:{history:['ankle'],ankleSprains:'2-3',pains:['knee'],'pain-knee-where':'knee-patellar','pain-knee-side':'right','pain-knee-severity':3,triggers:['jump','stairs'],morning:'short',flags:['none']},
  goals:{mainGoal:'comeback',measurable:['rim','weight'],targetWeight:80,deadline:'season',priorities:['vertical','speed','injury'],fear:'some'}
};
function filled(extra={}){
  let s=PT.initialState();s.profile.name='Yanis';
  for(const [c,a] of Object.entries(persona)) s=PD.saveChapter(s,c,a);
  for(const [c,a] of Object.entries(extra)) s=PD.saveChapter(s,c,a);
  return s;
}

test('dossier : les 4 chapitres essentiels remplissent les structures existantes',()=>{
  const s=filled({break:{layoffMonths:24,layoffReason:'work',dropped:['jump','breath']},life:{sessions:'3',freeDays:[0,2,4],maxMinutes:'60',equipment:['dumbbells','bands','massagegun']}});
  expect(s.profile.onboarded).toBe(true);
  expect(s.profile.weight).toBe('88');
  expect(s.profile.weeklyTarget).toBe(3);
  expect(s.profile.experience).toBe('returning');
  expect(s.player).toMatchObject({position:'meneur',archetypes:['createur','slasher'],layoff:'long',goals:['vertical','speed','injury']});
  expect(s.basketProfile).toMatchObject({weaknesses:['firststep','engine','brake'],practiceDays:[1],matchDay:5,season:'pre'});
  const knee=s.symptoms.find(x=>x.active&&x.region==='knee');
  expect(knee).toMatchObject({severity:3,side:'right',protocol:'knee-patellar',redFlags:false});
  expect(s.owned).toEqual(['bodyweight','dumbbells','bands','massagegun']);
  // Le résumé pour l'IA ne contient jamais le prénom.
  const text=PD.summary(s.dossier);
  expect(text).toContain('Meneur');
  expect(text).toContain('poids de jeu 78 kg');
  expect(text).not.toContain('Yanis');
  // Synthèse locale : la priorité n°1 du joueur (détente) n'est pas oubliée quand le plan commence ailleurs.
  const local=PD.localSynthesis(s);
  expect(local.priorities).toHaveLength(3);
  expect(local.risks.join(' ')).toContain('24 mois');
  expect(local.message).toContain('pas oublié');
  expect(PT.validateState(JSON.parse(JSON.stringify(s))).dossier.answers.position).toBe('meneur');
});

test('dossier : seules les questions qui concernent le joueur apparaissent',()=>{
  const ids=(c,a)=>PD.questionsFor(c,a).map(q=>q.id);
  expect(ids('break',{layoffMonths:0})).toEqual(['layoffMonths']);
  expect(ids('break',{layoffMonths:12})).toContain('kilosGained');
  expect(ids('break',{layoffMonths:12,playWeight:78})).not.toContain('kilosGained');
  const health=ids('health',{pains:['knee']});
  expect(health).toEqual(expect.arrayContaining(['pain-knee-where','pain-knee-severity','flags','triggers']));
  expect(health.some(id=>id.startsWith('pain-ankle'))).toBe(false);
  expect(ids('health',{pains:['none']})).not.toContain('flags');
  expect(ids('game',{club:'no'})).not.toContain('practiceDays');
  // « Aucune » est exclusif : il retire les autres réponses, et inversement.
  const q=PD.questions().find(x=>x.id==='pains');
  expect(PD.toggle(q,['knee'],'none')).toEqual(['none']);
  expect(PD.toggle(q,['none'],'knee')).toEqual(['knee']);
});

test('dossier : une branche abandonnée ne laisse pas de réponse cachée, une zone retirée est résolue',()=>{
  let s=filled();
  s=PD.saveChapter(s,'game',{...persona.game,club:'no'});
  expect(s.dossier.answers.practiceDays).toBeUndefined();
  expect(s.basketProfile.practiceDays).toEqual([]);
  expect(s.basketProfile.matchDay).toBeNull();
  s=PD.saveChapter(s,'health',{...persona.health,pains:['none']});
  expect(s.symptoms.filter(x=>x.active)).toHaveLength(0);
  expect(s.symptoms.find(x=>x.region==='knee').resolvedAt).toBeTruthy();
});

test('dossier : signe d’alerte → aucune séance, et anciennes sauvegardes toujours valides',()=>{
  const s=filled();
  const flagged=PD.saveChapter(s,'health',{...persona.health,flags:['swelling']});
  expect(flagged.symptoms.find(x=>x.active).redFlags).toBe(true);
  expect(PT.safety(flagged).blocked).toBe(true);
  // Sauvegarde d'avant le lot 12 : pas de clé dossier.
  const old=PT.initialState();delete old.dossier;old.profile.onboarded=true;
  expect(PT.validateState(old).dossier).toBeNull();
  // Dossier abîmé : nettoyé sans faire échouer le chargement.
  const broken={...PT.initialState(),dossier:{answers:{age:'abc',position:'inconnu',pains:['knee','lune'],weight:500},chapters:{morpho:'pas-une-date'},followups:[{question:42}]}};
  const v=PT.validateState(broken).dossier;
  expect(v.answers).toEqual({pains:['knee']});
  expect(v.chapters).toEqual({});
  expect(v.followups).toEqual([]);
});

test('pistolet de massage : en ouverture d’échauffement seulement s’il est possédé, un passage au plus par séance',()=>{
  const s=PT.initialState();s.profile.onboarded=true;
  s.owned=['bodyweight','court'];s.checkIn.equipment=s.owned;
  expect(RW.warmupPlan(PT,JP,s,'legs').exercises.some(e=>e.id==='gun-legs')).toBe(false);
  s.owned=['bodyweight','court','massagegun'];s.checkIn.equipment=s.owned;
  const w=RW.warmupPlan(PT,JP,s,'legs');
  expect(w.exercises[0]).toMatchObject({id:'gun-legs',seconds:45});
  for(let i=0;i<20;i++){
    const plan=PT.generate(s,{...s.checkIn,focus:'mobility',minutes:45});
    expect(plan.exercises.filter(e=>e.tool==='massagegun').length).toBeLessThanOrEqual(1);
  }
  // Genou douloureux : le passage sur les cuisses reste toléré, pas sur la rotule (consigne).
  const quads=PT.catalog.find(e=>e.id==='gun-quads');
  expect(JP.tolerates(quads,[{region:'knee',severity:4}])).toBe(true);
  expect(quads.instructions.join(' ')).toContain('rotule');
});

async function fresh(page,width=390){
  await page.setViewportSize({width,height:844});
  await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();
  await expect(page.locator('.brand')).toHaveText('Rehaab.',{timeout:20000});
}
const noOverflow=async page=>{const s=await page.evaluate(()=>({v:innerWidth,d:document.documentElement.scrollWidth}));expect(s.d).toBeLessThanOrEqual(s.v);};

test('écran : premier lancement → dossier, une question à la fois, sans débordement à 320 px',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await fresh(page,320);
  await expect(page.getByRole('heading',{name:'Ton dossier joueur.'})).toBeVisible();
  await noOverflow(page);
  await page.getByLabel('Comment t’appeler ?').fill('Yanis');
  await page.getByRole('button',{name:/Commencer mon dossier/}).click();
  await expect(page.getByRole('heading',{name:'Ton gabarit'})).toBeVisible();
  await page.getByLabel('Ton âge').fill('27');await page.getByRole('button',{name:'Suivant'}).click();
  await page.getByLabel('Ta taille').fill('183');await page.getByRole('button',{name:'Suivant'}).click();
  await page.getByLabel('Ton poids aujourd’hui').fill('88');await page.getByRole('button',{name:'Suivant'}).click();
  await page.getByLabel(/meilleur niveau/).fill('78');await page.getByRole('button',{name:'Suivant'}).click();
  await page.getByRole('button',{name:'Droite',exact:true}).click();
  // Choix unique : on passe seul à la question suivante.
  await expect(page.getByRole('heading',{name:/pied d’appel/})).toBeVisible();
  await page.getByRole('button',{name:'Gauche',exact:true}).click();
  await expect(page.getByRole('heading',{name:/tu touches/})).toBeVisible();
  await noOverflow(page);
  await page.getByRole('button',{name:'Le filet'}).click();
  await page.getByRole('button',{name:'Enregistrer le chapitre'}).click();
  // Chapitre essentiel suivant : ton basket.
  await expect(page.getByRole('heading',{name:'Ton basket'})).toBeVisible();
  await page.waitForTimeout(400); // écriture locale regroupée (250 ms)
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);
  expect(saved.dossier.answers).toMatchObject({age:27,height:183,weight:88,playWeight:78,reach:'net'});
  expect(saved.profile).toMatchObject({name:'Yanis',weight:'88',onboarded:false});
  expect(errors).toEqual([]);
});

test('écran : synthèse hors ligne, puis analyse du coach IA et questions de relance',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const data=filled();
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.route('**/api/coach',route=>route.abort());
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#dossier-synthese');
  await expect(page.getByRole('heading',{name:'Ce que le coach a compris.'})).toBeVisible({timeout:20000});
  await expect(page.getByText('Synthèse de l’app')).toBeVisible();
  await page.getByRole('button',{name:'Demander l’analyse du coach IA'}).click();
  await expect(page.getByText(/calculée par l’app, hors ligne/)).toBeVisible();
  let sent=null;
  await page.unroute('**/api/coach');
  await page.route('**/api/coach',async route=>{sent=route.request().postDataJSON();await route.fulfill({json:{message:'Meneur qui reprend : on pose d’abord le tendon.',priorities:[{label:'Tendon rotulien',why:'Gêne 3/10 sous la rotule en sautant.'}],risks:['+10 kg'],questions:['Combien de minutes dure ton entraînement du mardi ?']}});});
  await page.getByRole('button',{name:'Demander l’analyse du coach IA'}).click();
  await expect(page.getByText('Analyse du coach IA')).toBeVisible();
  expect(sent.mode).toBe('dossier');
  expect(sent.context.dossier).toContain('Meneur');
  expect(JSON.stringify(sent)).not.toContain('Yanis');
  await page.getByRole('textbox').fill('1 h 30, beaucoup de matchs.');
  await page.getByRole('button',{name:'Enregistrer mes réponses'}).click();
  await page.waitForTimeout(400);
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PT.STORAGE_KEY);
  expect(saved.dossier.synthesis.source).toBe('ai');
  expect(saved.dossier.followups[0]).toMatchObject({question:'Combien de minutes dure ton entraînement du mardi ?',answer:'1 h 30, beaucoup de matchs.'});
  expect(PD.summary(saved.dossier)).toContain('1 h 30');
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('écran : sommaire du dossier en tuiles photo, accessible depuis le profil',async({page})=>{
  const data=filled();
  await page.addInitScript(({data,key})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(data));sessionStorage.setItem('seeded','1');}},{data,key:PT.STORAGE_KEY});
  await page.setViewportSize({width:320,height:700});
  await page.goto('/#profile');
  await page.getByRole('button',{name:/Mon dossier joueur/}).click({timeout:20000});
  await expect(page.getByRole('heading',{name:'Ce que le coach sait de toi.'})).toBeVisible();
  await expect(page.locator('.image-tile')).toHaveCount(7);
  await expect(page.locator('.image-tile.is-done')).toHaveCount(4);
  await noOverflow(page);
  await page.screenshot({path:'test-results/dossier-320.png',fullPage:true});
});

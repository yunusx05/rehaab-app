// Lot 27 : renfo basket GBG Hoops (tout le corps) et consignes MyObjectiv.
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const RW=require('../rehab-warmup.js');
const AP=require('../athletic-profile.js');
const BP=require('../basket-pathway.js');

const NEW=['toe-rock','knee-over-toe-rock','credit-card-hop','rfe-quad-hold','heavy-calf-iso','rfe-goblet-hold','couch-lift','frog-rock','ham-pails','sl-rdl-crescent','skater-ankle-rock','step-off-3d','split-push-step','stop-go-single-leg','scissor-cut','hop-step-rhythm','hop-step-press','copenhagen-long','landmine-lateral-lunge','psoas-plank','bench-hip-flexion','reverse-plank','overhead-side-bend-ecc','plank-db-row','sa-db-press','kneel-hip-press','sl-hinge-seesaw-row'];
const full=['bodyweight','dumbbells','kettlebell','barbell','bench','bands','box','court','landmine','cable','pullup'];
function player(owned=full){
  const s=PT.initialState();
  s.profile.onboarded=true;s.profile.experience='regular';s.profile.impactReady=true;
  s.owned=owned;s.checkIn.equipment=owned;
  s.player=JP.validatePlayer({position:'meneur',archetypes:['slasher'],layoff:'none'});
  return s;
}

test('27 exercices GBG complets, versions actives des étirements',()=>{
  NEW.forEach(id=>{
    const e=PT.catalog.find(x=>x.id===id);
    expect(e,id).toBeTruthy();
    expect(e.transfer&&e.load&&e.cues.length,id).toBeTruthy();
  });
  expect(PT.catalog.find(e=>e.id==='hip-flexor').name).toMatch(/active/);
  expect(PT.catalog.find(e=>e.id==='pigeon').instructions.join(' ')).toMatch(/cercles/);
  expect(PT.catalog.find(e=>e.id==='iso-split').instructions.join(' ')).toMatch(/5 cm du sol/);
  // Les rebonds genou verrouillé chargent la cheville, pas le genou… mais restent des impacts.
  expect(PT.catalog.find(e=>e.id==='credit-card-hop').impact).toBe(true);
});

test('échauffement pieds nus, avant-match isométrique, après-match isométrique',()=>{
  const s=player();
  const bare=RW.warmupPlan(PT,JP,s,'barefoot');
  expect(bare.error).toBeUndefined();
  expect(bare.exercises.slice(0,4).map(e=>e.id)).toEqual(['toe-rock','knee-over-toe-rock','credit-card-hop','rfe-quad-hold']);
  expect(bare.reasons[0]).toMatch(/Pieds nus/);
  // Sans banc ni impacts : la routine se replie sur des mouvements au sol.
  const plain=RW.warmupPlan(PT,JP,{...player(['bodyweight']),checkIn:{...player(['bodyweight']).checkIn,constraints:['no-impact']}},'barefoot');
  expect(plain.error).toBeUndefined();expect(plain.exercises.some(e=>e.impact)).toBe(false);
  const match=RW.warmupPlan(PT,JP,s,'match');
  expect(match.exercises.filter(e=>['iso-split','soleus-wall-iso','wall-sit'].includes(e.id))).toHaveLength(2);
  expect(match.reasons.join(' ')).toMatch(/35 secondes/);
  const after=RW.warmupPlan(PT,JP,s,'after-match-iso');
  expect(after.error).toBeUndefined();
  expect(after.exercises.map(e=>e.id)).toEqual(expect.arrayContaining(['iso-split','single-wall-sit','rfe-goblet-hold']));
  expect(after.exercises.at(-1).id).toBe('breath');
});

test('parcours : réceptions 3 directions, appuis push step, Copenhague long, haut du corps GBG en pré-saison et saison',()=>{
  const s=player();
  const ids=(step,day)=>BP.sessionPlan(PT,JP,s,{...BP.create({startStep:step})},day).exercises.map(e=>e.id);
  expect(ids(2,'C')).toContain('step-off-3d');
  expect(ids(1,'C')).not.toContain('step-off-3d');
  expect(ids(3,'C')).toContain('stop-go-single-leg');
  expect(ids(3,'A')).toContain('copenhagen-long');
  const b4=ids(4,'B');
  expect(b4).toEqual(expect.arrayContaining(['sa-db-press','plank-db-row','kneel-hip-press']));
  expect(ids(4,'C')).toContain('split-push-step');
  expect(ids(5,'A')).toEqual(expect.arrayContaining(['sa-db-press','sl-hinge-seesaw-row']));
  // Les étapes de force lourde gardent leurs charges (pas de version GBG en étape 2).
  expect(ids(2,'B')).not.toContain('sa-db-press');
});

test('format 1 × 20 : une série de 20 sur la force, rien ne change pour le reste',()=>{
  expect(PT.formats.onex20).toMatch(/1 × 20/);
  const s=player(['bodyweight','dumbbells','bench']);
  const check={...s.checkIn,focus:'muscle',format:'onex20',minutes:40};
  const plan=PT.generate(s,check,{random:()=>.4});
  expect(plan.format).toBe('onex20');
  const reps=plan.exercises.filter(e=>e.kind==='strength'&&e.measure==='reps');
  expect(reps.length).toBeGreaterThan(0);
  reps.forEach(e=>expect([e.sets,e.targetMin,e.targetMax]).toEqual([1,20,20]));
  expect(plan.reasons.join(' ')).toMatch(/1 × 20/);
});

test('bilan : rebonds de cheville pied surélevé et mollet lourd tenu en tête de leurs listes',()=>{
  expect(AP.focusLists.reactive[1][0]).toBe('credit-card-hop');
  const s=player();s.athletic=AP.validateAthletic({...AP.create(),answers:{jump:'less',firststep:'depends',brake:'slide',landing:'heavy',contact:'moved',engine:'cuts',strength:'some',squat:'easy',weakLeg:'none',mindset:'careful'}});
  const kine=AP.kineBlock(s,{day:'C',count:3,available:()=>true});
  expect(kine.some(x=>x.id==='heavy-calf-iso')).toBe(true);
});

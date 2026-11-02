// Lot 29 : les exercices chargés de la vidéo hanches (canard lesté, papillon lesté, pigeon et figure 4 à la kettlebell).
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const RW=require('../rehab-warmup.js');

const home=['bodyweight','dumbbells','kettlebell','bench','bands','court'];
const NEW=['duck-walk','duck-walk-kb','butterfly-kb','box-pigeon-kb','box-figure-four-kb'];
function player(owned){
  const d=PT.initialState();d.profile.onboarded=true;d.owned=owned;d.checkIn.equipment=owned;
  d.player=JP.validatePlayer({position:'meneur',archetypes:['slasher'],layoff:'long'});return d;
}

test('5 exercices de hanche ajoutés, complets, versions chargées à la kettlebell',()=>{
  NEW.forEach(id=>{
    const e=PT.catalog.find(x=>x.id===id);
    expect(e,id).toBeTruthy();
    expect(e.transfer&&e.load&&e.cues.length,id).toBeTruthy();
    if(id.endsWith('-kb'))expect(e.needs,id).toContain('kettlebell');
  });
});

test('bloc hanches : « Charger » reprend la partie chargée de la vidéo, repli sans matériel',()=>{
  const loaded=RW.rehabPlan(PT,JP,player(home),'hips',2,15).exercises.map(e=>e.id);
  expect(loaded).toEqual(expect.arrayContaining(['duck-walk-kb','box-figure-four-kb','box-pigeon-kb','butterfly-kb']));
  const bare=RW.rehabPlan(PT,JP,player(['bodyweight']),'hips',2,15).exercises.map(e=>e.id);
  expect(bare).toEqual(expect.arrayContaining(['duck-walk','butterfly']));
  expect(bare.some(id=>id.endsWith('-kb'))).toBe(false);
  expect(RW.rehabPlan(PT,JP,player(home),'hips',1,15).exercises.map(e=>e.id)).toContain('duck-walk');
  expect(RW.rehabPlan(PT,JP,player(home),'hips',0,20).exercises.map(e=>e.id)).toContain('hip-flexor');
});

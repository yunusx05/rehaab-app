// Lot 30 : planche d'équilibre ajoutée au matériel, avec ses exercices branchés dans Quick rehab.
const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const RW=require('../rehab-warmup.js');

const NEW=['wobble-two-feet','wobble-tilts','wobble-squat','wobble-single-leg','wobble-sl-ball','wobble-step-stick'];
function player(owned){
  const d=PT.initialState();d.profile.onboarded=true;d.owned=owned;d.checkIn.equipment=owned;
  d.player=JP.validatePlayer({position:'meneur',archetypes:['slasher'],layoff:'long'});return d;
}
const ids=(owned,p,l)=>RW.rehabPlan(PT,JP,player(owned),p,l,30).exercises.map(e=>e.id);

test('la planche d’équilibre est dans la liste du matériel, avec 6 exercices complets',()=>{
  expect(PT.equipment.find(e=>e.id==='balanceboard')?.label).toBe('Planche d’équilibre');
  NEW.forEach(id=>{
    const e=PT.catalog.find(x=>x.id===id);
    expect(e,id).toBeTruthy();
    expect(e.needs,id).toEqual(['balanceboard']);
    expect(e.transfer&&e.load&&e.cues.length,id).toBeTruthy();
  });
});

test('Quick rehab : la planche passe en premier si tu l’as, sinon rien ne change',()=>{
  const board=['bodyweight','balanceboard'];
  expect(ids(board,'ankle-sprain',0)).toEqual(expect.arrayContaining(['wobble-tilts','wobble-two-feet']));
  expect(ids(board,'ankle-sprain',1)).toContain('wobble-single-leg');
  expect(ids(board,'foot-knee',0)).toContain('wobble-squat');
  expect(ids(board,'knee-control',1)).toContain('wobble-step-stick');
  ['ankle-sprain','foot-knee','knee-control'].forEach(p=>[0,1,2].forEach(l=>
    expect(ids(['bodyweight'],p,l).some(id=>id.startsWith('wobble-')),`${p} ${l}`).toBe(false)));
  expect(ids(['bodyweight'],'ankle-sprain',0)).toContain('single-leg-stand');
});

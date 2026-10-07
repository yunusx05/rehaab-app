const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const JP=require('../player-profile.js');
const BP=require('../basket-pathway.js');
const RW=require('../rehab-warmup.js');

const home=['bodyweight','dumbbells','kettlebell','barbell','bench','bands','bike','court'];
function player(symptoms=[]){
  const data=PT.initialState();
  data.profile.onboarded=true;data.profile.name='Test';data.profile.experience='returning';
  data.owned=home;data.checkIn.equipment=home;
  data.player=JP.validatePlayer({position:'meneur',archetypes:['slasher'],layoff:'long'});
  data.pathway=BP.create();
  data.symptoms=symptoms.map((s,i)=>({id:`p${i}`,active:true,date:PT.dateKey(),side:'left',onset:'new',...s}));
  return data;
}
const ids=list=>list.map(e=>e.id);

test('soin intégré : genou 3/10 = calmer en tête, renforcer en fin, le reste toléré',()=>{
  const data=player([{region:'knee',severity:3}]);
  for(const day of BP.stepById(1).days){
    const plan=BP.sessionPlan(PT,JP,data,data.pathway,day.key,{minutes:45});
    expect(plan.error).toBeUndefined();
    const ex=plan.exercises,care=ex.filter(e=>e.pathwayRole==='soin');
    expect(care.length).toBeGreaterThanOrEqual(2);
    expect(ex[0].pathwayRole).toBe('soin');expect(ex[0].carePhase).toBe('calm');
    expect(ex[ex.length-1].pathwayRole).toBe('soin');expect(ex[ex.length-1].carePhase).toBe('strength');
    // Hors soin, seuls les mouvements que le genou tolère restent.
    ex.filter(e=>e.pathwayRole!=='soin').forEach(e=>expect(JP.tolerates(e,data.symptoms)).toBe(true));
    expect(plan.reasons.join(' ')).toContain('Soin intégré');
    expect(plan.estimatedMinutes).toBeLessThanOrEqual(50);
  }
});

test('soin intégré : l’endroit précisé choisit le protocole, sinon le dernier fait dans l’app',()=>{
  const patellar=RW.careBlock(PT,JP,player(),{pains:[{region:'knee',severity:5,protocol:'knee-patellar'}],minutes:45});
  expect(patellar.protocols).toEqual(['knee-patellar']);
  expect(patellar.head.every(e=>e.careLevel===0)).toBe(true);
  const data=player();data.rehab={levels:{'knee-control':1},log:[{protocolId:'knee-control',level:1,painAfter:1,sessionId:'x',date:PT.dateKey()}]};
  expect(RW.careBlock(PT,JP,data,{pains:[{region:'knee',severity:2}],minutes:45}).protocols).toEqual(['knee-control']);
  // Genou sans précision : devant du genou, isométrique en tête.
  const plain=RW.careBlock(PT,JP,player(),{pains:[{region:'knee',severity:3}],minutes:45});
  expect(plain.protocols).toEqual(['knee-pfp']);
});

test('soin intégré : rien à 7/10 ou avec un signe inhabituel, séance identique sans douleur',()=>{
  expect(RW.careBlock(PT,JP,player(),{pains:[{region:'knee',severity:7}]}).head).toHaveLength(0);
  expect(RW.careBlock(PT,JP,player(),{pains:[{region:'ankle',severity:3,redFlags:true}]}).head).toHaveLength(0);
  const data=player();
  for(const day of BP.stepById(2).days){
    const plan=BP.sessionPlan(PT,JP,data,data.pathway,day.key);
    expect(plan.exercises.some(e=>e.pathwayRole==='soin')).toBe(false);
  }
});

test('soin intégré : séance du joueur et temps court respecté',()=>{
  const data=player([{region:'shoulder',severity:4}]);data.pathway=null;
  const plan=JP.dailyBody(PT,data,{minutes:20,random:()=>0.3});
  expect(plan.error).toBeUndefined();
  expect(plan.exercises[0].pathwayRole).toBe('soin');
  expect(plan.estimatedMinutes).toBeLessThanOrEqual(24);
  expect(ids(plan.exercises)).toContain('er-iso');
});

test('soin intégré : la douleur après la séance fait progresser le protocole',()=>{
  let rehab={levels:{},log:[]};
  for(const n of [1,2]) rehab=RW.record(rehab,{protocolId:'knee-pfp',level:0,painAfter:1,sessionId:`s${n}`,date:PT.dateKey()},[]).rehab;
  expect(rehab.levels['knee-pfp']).toBe(1);
  const data=player();data.rehab=rehab;
  const care=RW.careBlock(PT,JP,data,{pains:[{region:'knee',severity:2}],minutes:45});
  expect(care.tail.every(e=>e.careLevel===1)).toBe(true);
});

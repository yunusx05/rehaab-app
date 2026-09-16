/* Génération séquentielle et contrôle des médias, reprise sans écraser les originaux. */
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const {createRequire}=require('node:module');
const PT=require('../personal-engine.js');
const poses=require('./exercise-poses.json');
const root=path.resolve(__dirname,'..');
const home=os.homedir();
const output=process.env.REHAAB_GENERATIONS||path.join(home,"Desktop/WORKS/generation d'image IA");
const connector=path.join(process.env.APPDATA||path.join(home,'AppData/Roaming'),'npm/node_modules/@rlabs-inc/gemini-mcp');
const {GoogleGenAI}=createRequire(path.join(connector,'package.json'))('@google/genai');
if(!process.env.GEMINI_API_KEY)throw Error('GEMINI_API_KEY absente : utiliser la configuration du connecteur Gemini.');
const client=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
const imageModel=process.env.GEMINI_IMAGE_MODEL||'gemini-3-pro-image-preview';
const reviewModel=process.env.GEMINI_FLASH_MODEL||'gemini-3.6-flash';
const ledgerPath=path.join(output,'rehaab_gemini_catalogue_2026-09-16.json');
const ledger=fs.existsSync(ledgerPath)?JSON.parse(fs.readFileSync(ledgerPath,'utf8')):{created:new Date().toISOString(),imageModel,reviewModel,exercises:{}};
const save=()=>fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2));
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'exercise-media.js'),'utf8'),context);
const existing=context.window.RehaabMedia;
const staticIds=new Set(['grip-hold','dead-hang','wall-sit','calf-hold','hollow-hold','side-plank-full','bear-hold','single-leg-stand','single-leg-eyes','tandem-stand','childs-pose','downdog','pigeon','deep-squat-hold','calf-stretch','doorway-chest']);
const overrides={
 'dead-hang':['hanging from a secure pull-up bar, both arms straight, shoulders engaged, feet off the floor, body still'],
 'grip-hold':['standing tall, one dumbbell in each hand beside the thighs, arms straight, stable feet, shoulders neutral'],
 'single-leg-eyes':['balancing on one leg with eyes closed, the other foot lifted, a solid handrail immediately within reach'],
 'back-extension':['hips and thighs supported on a stable flat bench, legs secured by a visibly rigid support, torso lowered beyond the bench edge, neutral neck','raise torso ONLY until aligned with legs, not beyond; same bench and secured feet'],
 'neck-mob':['seated upright, shoulders relaxed, head facing directly forward','same seated posture, head turned comfortably to the right WITHOUT also tilting it, shoulders unchanged'],
 'burpee':['standing upright','crouched with palms flat on floor','straight-arm plank, legs extended behind','crouched with palms flat on floor again','small vertical jump, both feet just above floor, knees soft'],
 'burpee-nojump':['standing upright','crouched, hands on floor','one foot steps back toward plank, other remains forward','straight-arm plank','one foot steps forward toward hands','standing upright again, no jumping'],
 'box-jump-step':['shallow athletic dip on floor in front of low stable bench','both feet briefly airborne over front edge of bench, ascending','both feet fully supported on bench top, knees and hips flexed absorbing landing','standing tall on bench','one foot stepping down toward floor, other stays on bench'],
 'broad-jump':['athletic dip with arms back','brief flight travelling forward, no support','both feet landed on floor slightly forward, hips and knees flexed, stable'],
 'split-jump':['split squat, left leg forward, both knees flexed','small jump, legs exchanging while both feet off floor','split squat, right leg forward, both knees flexed'],
 'depth-drop':['standing on low stable bench at edge','stepping off, one foot reaching below bench, no upward jump','both feet on floor ahead of bench, knees and hips flexed to absorb landing']
};
const equipment={bodyweight:'no weights',bench:'stable flat adjustable weight bench',dumbbells:'dumbbells',barbell:'barbell',bands:'resistance band',cable:'cable pulley machine',kettlebell:'kettlebell',pullup:'secure pull-up bar',court:'clear exercise floor',outdoor:'safe outdoor path',rower:'rowing ergometer',legpress:'leg press machine',partner:'a second adult male training partner holding the ankles firmly'};
function specs(ex){
 const p=overrides[ex.id]||poses[ex.id];if(!p)throw Error('Descriptions manquantes : '+ex.id);
 if(staticIds.has(ex.id))return {mode:'static',positions:[overrides[ex.id]?.[0]||p[1]],order:[0]};
 return {mode:p.length>2?'sequence':'pair',positions:p,order:p.length>2?p.map((_,i)=>i):[1,0]};
}
function common(ex){return `Photorealistic exercise instruction image. ${ex.needs.includes('partner')?'Exactly TWO adult men, one exercising and one partner securing ankles.':'Exactly ONE adult man.'} Plain dark sports clothes, no logos, same charcoal gym style, full body visible with generous margin; use a fixed camera angle that makes the working joints and support points unambiguous. ${ex.needs.includes('outdoor')?'Safe outdoor location appropriate to the exercise.':'Quiet indoor setting.'} Exercise ${ex.name}. Exact instructions: ${ex.instructions.join(' ')}. Equipment: ${ex.needs.map(x=>equipment[x]||x).join(', ')}. Do not add equipment or change the exercise variant. ${ex.id==='front-squat'||ex.id==='close-grip-press'?'Barbell safety rack with correctly positioned spotter arms must be visible.':''} Correct anatomy, grounded support points except genuine flight phases in jumps. No text, no grid, no collage, no women. Never invent motion for an isometric hold.`;}
async function review(ex,spec,files){
 const parts=[{text:`Strict biomechanics and image consistency review. The pictures may be WRONG; never infer compliance from the description. Exercise: ${ex.name}. Instructions: ${ex.instructions.join(' ')}. Required positions in displayed order: ${spec.positions.map((p,i)=>i+': '+p).join('\n')}. Mode: ${spec.mode}. Check each pose, support points, correct equipment, anatomy, full-body crop, same man/clothes/camera across images. For dynamic pairs check ACTUAL joint differences (not lighting/camera changes). Small motion is correct for shrugs/scapula/wrists. Static holds need only one correct image. All depicted people must be adult men; partner allowed only for Nordic assisted. Return JSON {pass:boolean,issues:string[],observations:string[],correction:string}. Fail if uncertain about a material posture, variant or continuity issue. Do not approve two identical poses for a dynamic exercise.`}];
 for(const f of files)parts.push({inlineData:{mimeType:f.mimeType,data:fs.readFileSync(f.file).toString('base64')}});
 const r=await client.models.generateContent({model:reviewModel,contents:[{role:'user',parts}],config:{responseMimeType:'application/json'}});
 const value=JSON.parse(r.text);if(typeof value.pass!=='boolean'||!Array.isArray(value.issues))throw Error('Contrôle invalide');return { ...value,usage:r.usageMetadata};
}
async function image(chat,prompt,ex,frame,round,refs){
 fs.readFileSync(path.join(home,'.claude/skills/generate/models/nano-banana-2-lite.md'),'utf8');
 const r=await chat.sendMessage({message:prompt});
 const part=r.candidates?.[0]?.content?.parts.find(p=>p.inlineData?.data);
 if(!part)throw Error('Aucune image : '+(r.text||'réponse vide'));
 const mimeType=part.inlineData.mimeType;const ext=mimeType==='image/jpeg'?'jpg':'png';
 const name=`rehaab_${ex.id}_${frame}_gemini_${Date.now()}_${round}`;
 const file=path.join(output,name+'.'+ext);fs.writeFileSync(file,Buffer.from(part.inlineData.data,'base64'));
 const sidecar={model:imageModel,prompt,refs,params:{aspect:'4:3',size:'1K'},created:new Date().toISOString(),exercise:ex.id,frame,round,usage:r.usageMetadata,validation:'pending'};
 fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify(sidecar,null,2));
 return {file,mimeType,sidecar:path.join(output,name+'.json'),prompt};
}
(async()=>{
 if(!fs.existsSync(output))throw Error('Dossier de générations absent');
 const requested=process.argv.slice(2);
 const list=PT.catalog.filter(ex=>!existing[ex.id]&&ex.id!=='knee-pushup'&&(!requested.length||requested.includes(ex.id)));
 for(const ex of list){
  if(ledger.exercises[ex.id]?.status==='approved')continue;
  const spec=specs(ex);const entry=ledger.exercises[ex.id]||{id:ex.id,name:ex.name,mode:spec.mode,rounds:[]};
  ledger.exercises[ex.id]=entry;entry.status='running';save();
  // Une interruption du contrôle ne doit pas repayer des images déjà sauvegardées.
  for(const pending of entry.rounds.filter(r=>r.status==='running')){
   const complete=spec.positions.every((_,i)=>pending.files[i]&&fs.existsSync(pending.files[i].file));
   if(!complete){pending.status='interrupted';save();continue;}
   pending.review=await review(ex,spec,pending.files);
   pending.status=pending.review.pass?'approved':'rejected';
   for(const f of pending.files){const data=JSON.parse(fs.readFileSync(f.sidecar));data.validation=pending.review;fs.writeFileSync(f.sidecar,JSON.stringify(data,null,2));}
   if(pending.review.pass){entry.status='approved';entry.files=pending.files;}
   save();console.log('CONTRÔLE_REPRIS '+ex.id+' '+pending.status);
  }
  if(entry.status==='approved')continue;
  const previous=entry.rounds.at(-1)?.review;
  let correction=previous?[previous.correction,...previous.issues].join('; '):'';
  for(let round=entry.rounds.length;round<3;round++){
   const chat=client.chats.create({model:imageModel,config:{responseModalities:['TEXT','IMAGE'],imageConfig:{aspectRatio:'4:3',imageSize:'1K'}}});
   const batch={round,files:[],status:'running'};entry.rounds.push(batch);save();
   for(const [index,frame] of spec.order.entries()){
    const prompt=index===0?`${common(ex)} Pose to depict NOW: ${spec.positions[frame]}. ${correction}`:`Edit the previous image: keep EXACTLY same person, clothes, equipment, camera, background and lighting. CHANGE ONLY POSTURE to: ${spec.positions[frame]}. Follow these exercise constraints: ${ex.instructions.join(' ')}. Show the real anatomical difference, not another camera angle. ${correction}`;
    const refs=batch.files.filter(Boolean).map(f=>path.basename(f.file));
    batch.files[frame]=await image(chat,prompt,ex,frame,round,refs);save();
    console.log('IMAGE '+ex.id+' '+frame+' essai '+(round+1));
   }
   batch.review=await review(ex,spec,batch.files);batch.status=batch.review.pass?'approved':'rejected';
   for(const f of batch.files){const data=JSON.parse(fs.readFileSync(f.sidecar));data.validation=batch.review;fs.writeFileSync(f.sidecar,JSON.stringify(data,null,2));}
   if(batch.review.pass){entry.status='approved';entry.files=batch.files;save();console.log('VALIDÉ '+ex.id);break;}
   correction=batch.review.correction+' '+batch.review.issues.join('; ');save();console.log('REJETÉ '+ex.id+' '+correction);
  }
  if(entry.status!=='approved'){entry.status='needs_review';save();}
 }
 console.log('LOT_TERMINÉ '+JSON.stringify(Object.values(ledger.exercises).reduce((a,e)=>(a[e.status]=(a[e.status]||0)+1,a),{})));
})().catch(error=>{ledger.lastError={at:new Date().toISOString(),message:error.message};save();console.error(error.message);process.exitCode=1;});

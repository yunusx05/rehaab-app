const fs=require('node:fs');
const path=require('node:path');
const PT=require('../personal-engine.js');
const output="C:/Users/Anton/Desktop/WORKS/generation d'image IA";
const skill='C:/Users/Anton/.claude/skills/generate';
const ledgerFile=path.join(output,'rehaab_media_lot_2026-09-15.json');
const key=fs.readFileSync(path.join(skill,'.env'),'utf8').match(/^FAL_KEY=(.*)$/m)?.[1].trim().replace(/^['"]|['"]$/g,'');
if(!key)throw Error('FAL_KEY absente');
const headers={Authorization:'Key '+key,'Content-Type':'application/json'};
const ledger=fs.existsSync(ledgerFile)?JSON.parse(fs.readFileSync(ledgerFile,'utf8')):{usd_per_eur:1.1551,exchange_date:'2026-09-14',limit_eur:5,initial_estimated_usd:0.042039,attempts:[]};
const save=()=>fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2));
async function usage(){
 const query=new URLSearchParams({start:'2026-09-15T05:46:40Z',end:new Date().toISOString(),expand:'summary',bound_to_timeframe:'false'});
 for(const id of ['google/nano-banana-2-lite','google/nano-banana-2-lite/edit'])query.append('endpoint_id',id);
 const res=await fetch('https://api.fal.ai/v1/models/usage?'+query,{headers,signal:AbortSignal.timeout(30000)});
 if(!res.ok)throw Error('Lecture consommation impossible : '+res.status);
 const data=await res.json();if(data.has_more)throw Error('Pagination consommation inattendue');
 if(data.summary.some(x=>x.currency!=='USD'))throw Error('Devise inattendue');
 ledger.reported_usd=data.summary.reduce((a,x)=>a+Number(x.cost_total??x.cost),0);ledger.usage_checked_at=new Date().toISOString();
 // Réserve prudente pour les appels qui ne figurent pas encore dans la facturation.
 ledger.provisional_usd=ledger.initial_estimated_usd+ledger.attempts.length*0.10;
 ledger.tracked_usd=Math.max(ledger.reported_usd,ledger.provisional_usd);save();
 console.log('BUDGET '+JSON.stringify({reported_usd:ledger.reported_usd,provisional_usd:ledger.provisional_usd,eur:ledger.tracked_usd/ledger.usd_per_eur}));
 if(ledger.tracked_usd+0.10>=ledger.limit_eur*ledger.usd_per_eur)throw Error('SEUIL_BUDGET : pause prudente avant nouvel appel');
}
const style='One single photorealistic editorial exercise photograph of ONE adult man only. Dark plain athletic clothing, no logos. Charcoal studio, soft directional light. Full body and ALL floor contact points visible, wide side or three-quarter view with generous margins. Realistic anatomy and equipment. No floating limbs, no women, no text, no collage, no watermark.';
(async()=>{
 for(const id of process.argv.slice(2)){
  const exercise=PT.catalog.find(e=>e.id===id);if(!exercise)throw Error('Exercice inconnu '+id);
  for(const pose of ['start','end']){
   if(ledger.attempts.some(x=>x.id===id&&x.pose===pose&&x.status==='saved'))continue;
   await usage();fs.readFileSync(path.join(skill,'models/nano-banana-2-lite.md'),'utf8');
   const first=ledger.attempts.find(x=>x.id===id&&x.pose==='start'&&x.status==='saved');
   const model='google/nano-banana-2-lite'+(pose==='end'?'/edit':'');
   const special=id==='knee-pushup'?'CRITICAL: BOTH KNEES MUST be resting and pressing visibly INTO the exercise mat, zero gap under the knees. The knees remain grounded in BOTH positions. Lower legs rest on the mat. ':'';
   const prompt=pose==='start'?`${style} Exercise: ${exercise.name}. Exact instructions: ${exercise.instructions.join(' ')}. Show the STARTING position before the main repetition. ${special}Required equipment: ${exercise.needs.join(', ')}. Only the specific exercise, not a variation.`:`Edit this reference photograph to show the END position of one repetition of ${exercise.name}. ${exercise.instructions.join(' ')}. ${special}Keep EXACTLY the same man, clothes, equipment, room, camera, framing, and lighting. Change only the joint positions needed for this exercise. For isometric holds show the correct held posture, not fake large motion. All support points must visibly contact the floor/equipment. No extra people, no text.`;
   const params={prompt,aspect_ratio:'4:3',num_images:1,output_format:'jpeg',...(first&&pose==='end'?{image_urls:[first.url]}:{})};
   const created=new Date().toISOString();const base=`rehaab_${id}_${pose}_${created.replace(/[:.]/g,'-')}`;
   const attempt={id,pose,model,prompt,created,status:'submitted',reserved_usd:0.10};ledger.attempts.push(attempt);save();
   const res=await fetch('https://fal.run/'+model,{method:'POST',headers,body:JSON.stringify(params),signal:AbortSignal.timeout(180000)});
   const raw=await res.text();attempt.http_status=res.status;attempt.request_id=res.headers.get('x-fal-request-id');
   if(!res.ok){attempt.status='failed';attempt.error=raw;save();throw Error(raw);}
   const data=JSON.parse(raw);const url=data.images?.[0]?.url;if(!url)throw Error('Réponse sans image');
   const image=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!image.ok)throw Error('Téléchargement '+image.status);
   attempt.file=path.join(output,base+'.jpg');attempt.url=url;
   fs.writeFileSync(attempt.file,Buffer.from(await image.arrayBuffer()));
   const refs=[];
   if(first&&pose==='end'){
    fs.mkdirSync(path.join(output,'refs'),{recursive:true});
    const ref=path.join('refs',path.basename(first.file));fs.copyFileSync(first.file,path.join(output,ref));refs.push(ref);
   }
   fs.writeFileSync(path.join(output,base+'.json'),JSON.stringify({model,prompt,refs,params,created,request_id:attempt.request_id,validation:'pending',cost_usd:null},null,2));
   attempt.status='saved';save();console.log('IMAGE '+JSON.stringify({id,pose,file:attempt.file}));
  }
 }
 await usage();console.log('LOT_TERMINE');
})().catch(error=>{save();console.error(error.message);process.exitCode=1;});

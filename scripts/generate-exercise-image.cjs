const fs=require('node:fs');
const path=require('node:path');
const output='C:/Users/Anton/Desktop/WORKS/generation d\'image IA';
const model='google/nano-banana-2-lite';
const prompt='One single photorealistic exercise demonstration photograph. An adult man performing a modified push-up on his knees, at the top position: knees on an exercise mat, hands on the floor directly below shoulders, elbows extended without hyperextension, straight alignment from knees through hips to shoulders, neutral spine. Side profile view, full body and all contact points visible with generous margins. Plain dark athletic shirt, shorts and training shoes. Quiet charcoal training studio, soft directional lighting, realistic proportions and correct anatomy. Only one adult man, no women, no other people. No text, no logos, no watermark, no collage.';
(async()=>{
  fs.readFileSync('C:/Users/Anton/.claude/skills/generate/models/nano-banana-2-lite.md','utf8');
  const match=fs.readFileSync('C:/Users/Anton/.claude/skills/generate/.env','utf8').match(/^FAL_KEY=(.*)$/m);
  if(!match)throw new Error('FAL_KEY absente');
  const key=match[1].trim().replace(/^['"]|['"]$/g,'');
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const basename='rehaab_knee-pushup_start_'+stamp;
  const params={prompt,aspect_ratio:'4:3',num_images:1,output_format:'jpeg'};
  const response=await fetch('https://fal.run/'+model,{method:'POST',headers:{Authorization:'Key '+key,'Content-Type':'application/json'},body:JSON.stringify(params),signal:AbortSignal.timeout(180000)});
  const raw=await response.text();
  const log={model,prompt,refs:[],params,created:new Date().toISOString(),http_status:response.status,cost_usd:null,cost_status:'non communiqué',request_id:response.headers.get('x-fal-request-id')};
  if(!response.ok){log.error=raw;fs.writeFileSync(path.join(output,basename+'.json'),JSON.stringify(log,null,2));console.log(JSON.stringify({status:response.status,error:raw,log:basename+'.json'}));process.exitCode=1;return;}
  const result=JSON.parse(raw);log.response=result;
  if(!result.images?.[0]?.url)throw new Error('Réponse sans image');
  const download=await fetch(result.images[0].url,{signal:AbortSignal.timeout(60000)});
  if(!download.ok)throw new Error('Téléchargement image : '+download.status);
  const file=path.join(output,basename+'.jpg');fs.writeFileSync(file,Buffer.from(await download.arrayBuffer()));
  fs.writeFileSync(path.join(output,basename+'.json'),JSON.stringify(log,null,2));
  console.log(JSON.stringify({status:response.status,file,response:result,request_id:log.request_id}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});

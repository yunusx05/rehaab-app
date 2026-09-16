const fs=require('node:fs');
const text=fs.readFileSync('C:/Users/Anton/.claude/skills/generate/.env','utf8');
const match=text.match(/^FAL_KEY=(.*)$/m);
if(!match)throw new Error('FAL_KEY absente');
const key=match[1].trim().replace(/^['"]|['"]$/g,'');
(async()=>{
  for(const endpoint of ['google/nano-banana-2-lite','google/nano-banana-2-lite/edit']){
    const response=await fetch('https://api.fal.ai/v1/models/pricing?endpoint_id='+encodeURIComponent(endpoint),{headers:{Authorization:'Key '+key},signal:AbortSignal.timeout(25000)});
    console.log(endpoint,response.status,await response.text());
    if(!response.ok)break;
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});

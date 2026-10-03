const fs=require('node:fs');


const key=require('./fal-key.cjs').falKey();
const params=new URLSearchParams({start:'2026-09-15T05:46:40Z',end:new Date().toISOString(),endpoint_id:'google/nano-banana-2-lite',expand:'summary',bound_to_timeframe:'false'});
fetch('https://api.fal.ai/v1/models/usage?'+params,{headers:{Authorization:'Key '+key},signal:AbortSignal.timeout(25000)}).then(async r=>console.log(r.status,await r.text())).catch(e=>{console.error(e.message);process.exitCode=1;});

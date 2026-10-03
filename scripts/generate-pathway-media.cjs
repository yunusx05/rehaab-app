// Une photo par étape du parcours « Retour au jeu ». Même chaîne et même registre de budget que le lot 5.
// Usage : node scripts/generate-pathway-media.cjs [id ...]
const fs=require('node:fs');
const path=require('node:path');
const output=require('./fal-key.cjs').generationsDir;
const {falKey,skillDir:skill}=require('./fal-key.cjs');
const ledgerFile=path.join(output,'rehaab_media_lot_2026-10-01b.json');
const key=falKey();
if(!key)throw Error('FAL_KEY absente');
const headers={Authorization:'Key '+key,'Content-Type':'application/json'};
const ledger=JSON.parse(fs.readFileSync(ledgerFile,'utf8'));
const save=()=>fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2));
const court='Indoor basketball court with a hardwood floor, dim moody charcoal lighting.';
const studio='Charcoal grey training studio, soft directional light.';
const style=place=>`One single photorealistic editorial sports photograph of ONE adult man only. Dark plain athletic clothing, no logos, training shoes. ${place} Wide cinematic framing with generous margins, full body visible. Realistic anatomy and equipment. No women, no text, no collage, no watermark.`;
const steps={
 'step-1':[studio,'kneeling on one knee on a mat doing a slow calf and ankle strengthening hold, one hand on the floor, calm and controlled, no weights'],
 'step-2':[studio,'standing tall under a loaded barbell on his upper back in a squat rack, mid squat with the thighs near parallel, braced and strong'],
 'step-3':[court,'caught at the top of an explosive vertical jump, both arms reaching upward, feet well off the floor, body fully extended'],
 'step-4':[court,'sprinting at full speed and cutting hard to one side, outside foot planted, body leaning into the change of direction'],
 'step-5':[court,'playing basketball, holding the ball at the hip in a triple threat stance, looking up the court, ready to play']
};
(async()=>{
 const ids=process.argv.slice(2).length?process.argv.slice(2):Object.keys(steps);
 const dir=path.join(__dirname,'..','media','pathway');fs.mkdirSync(dir,{recursive:true});
 for(const id of ids){
  const [where,what]=steps[id];
  const prompt=`${style(where)} The man is ${what}.`;
  const created=new Date().toISOString();
  const attempt={id,pose:'single',model:'google/nano-banana-2-lite',prompt,created,status:'submitted'};
  ledger.attempts.push(attempt);save();
  const res=await fetch('https://fal.run/google/nano-banana-2-lite',{method:'POST',headers,body:JSON.stringify({prompt,aspect_ratio:'4:3',num_images:1,output_format:'jpeg'}),signal:AbortSignal.timeout(180000)});
  const raw=await res.text();attempt.http_status=res.status;
  if(!res.ok){attempt.status='failed';attempt.error=raw.slice(0,300);save();console.error('ECHEC',id,raw.slice(0,160));continue;}
  const url=JSON.parse(raw).images?.[0]?.url;
  const image=await fetch(url,{signal:AbortSignal.timeout(60000)});
  attempt.file=path.join(output,`rehaab_${id}_${created.replace(/[:.]/g,'-')}.jpg`);attempt.url=url;
  fs.writeFileSync(attempt.file,Buffer.from(await image.arrayBuffer()));
  attempt.status='saved';save();console.log('IMAGE',id);
 }
 console.log('TERMINE');
})().catch(e=>{save();console.error(e.message);process.exitCode=1;});

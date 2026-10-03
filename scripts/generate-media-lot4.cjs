// Lot 4 : illustrations 2 positions des exercices ajoutés avec le bilan athlétique. Même chaîne que generate-media-batch.cjs, poses décrites à la main.
const fs=require('node:fs');
const path=require('node:path');
const PT=require('../personal-engine.js');
const output=require('./fal-key.cjs').generationsDir;
const {falKey,skillDir:skill}=require('./fal-key.cjs');
const ledgerFile=path.join(output,'rehaab_media_lot_2026-10-01.json');
const key=falKey();
if(!key)throw Error('FAL_KEY absente');
const headers={Authorization:'Key '+key,'Content-Type':'application/json'};
const ledger=fs.existsSync(ledgerFile)?JSON.parse(fs.readFileSync(ledgerFile,'utf8')):{usd_per_eur:1.1551,limit_eur:3,start:new Date().toISOString(),attempts:[]};
const save=()=>fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2));
async function usage(){
 const query=new URLSearchParams({start:ledger.start,end:new Date().toISOString(),expand:'summary',bound_to_timeframe:'false'});
 for(const id of ['google/nano-banana-2-lite','google/nano-banana-2-lite/edit'])query.append('endpoint_id',id);
 const res=await fetch('https://api.fal.ai/v1/models/usage?'+query,{headers,signal:AbortSignal.timeout(30000)});
 if(!res.ok)throw Error('Lecture consommation impossible : '+res.status);
 const data=await res.json();
 ledger.reported_usd=(data.summary||[]).reduce((a,x)=>a+Number(x.cost_total??x.cost),0);
 ledger.provisional_usd=ledger.attempts.length*0.05;
 ledger.tracked_usd=Math.max(ledger.reported_usd,ledger.provisional_usd);save();
 if(ledger.tracked_usd+0.05>=ledger.limit_eur*ledger.usd_per_eur)throw Error('SEUIL_BUDGET : pause avant nouvel appel');
}
const studio='Charcoal grey training studio, soft directional light.';
const court='Indoor basketball court with a hardwood floor, dim moody charcoal lighting.';
const style=place=>`One single photorealistic editorial exercise photograph of ONE adult man only. Dark plain athletic clothing, no logos, training shoes. ${place} Full body and ALL floor contact points visible, wide side or three-quarter view with generous margins. Realistic anatomy and equipment. No women, no text, no collage, no watermark.`;
const poses={
 'a-march':[studio,'standing tall on the balls of both feet, arms bent at 90 degrees, about to start marching','one thigh raised to hip height with the toes pulled up toward the shin, standing leg straight on the ball of the foot, opposite arm forward, tall upright torso'],
 'a-skip':[court,'both feet flat on the floor directly under the hips, both knees low and almost straight, tall torso, arms bent at 90 degrees at his sides, no knee raised','skipping, one knee driven up to hip height with toes pulled up, standing foot just leaving the floor, opposite arm swung forward, tall torso'],
 'knee-drive-iso':[studio,'both hands flat on a wall, body leaning forward about 45 degrees in one straight line from head to heels, BOTH legs straight and both feet together on the floor far behind him, no knee raised','same 45 degree lean with hands on the wall, one knee driven up to hip height with toes pulled up, body still in one straight line, standing on the ball of the other foot'],
 'psoas-march':[studio,'lying on his back on a mat, a small mini resistance band looped around both feet, both legs straight pointing vertically to the ceiling, lower back flat','lying on his back, one straight leg lowered to just above the floor while the other straight leg stays vertical, the mini band clearly stretched between the feet, lower back flat on the mat'],
 'falling-start':[court,'standing tall with feet together, the whole body leaning forward as one rigid straight line about 20 degrees from vertical, arms relaxed','sprint start: a powerful first step planted under the hips, the other knee driven forward, body leaning forward about 45 degrees, arms pumping'],
 'split-start':[court,'staggered stance, front foot forward and back foot behind, torso leaning forward, weight on the front leg, opposite arm forward','explosive first step: front leg fully extended pushing off the floor, back knee driven forward and high, body leaning forward about 45 degrees, arms pumping'],
 'drop-step-start':[court,'low athletic stance, feet parallel shoulder width, knees bent, hips back, hands in front, facing the camera','hips opened 90 degrees: one foot stepped back and turned toward the running direction, body low and leaning into the new direction, starting to sprint sideways'],
 'band-resisted-start':[court,'a thick resistance band around his waist, the band running straight back to a sturdy padded post behind him, athletic sprint stance leaning forward, band slightly taut','accelerating forward against the stretched band around his waist, body leaning forward about 45 degrees, knee driven high, foot planted under the hips, band clearly stretched back to the post'],
 'vertical-jump':[studio,'countermovement: quarter squat, hips back, both arms swung back behind the body, feet flat','airborne at the top of a vertical jump, still seen from the same side profile and facing the same direction, body fully extended, both arms reaching straight overhead, feet clearly off the floor'],
 'snap-down':[studio,'standing tall on the tips of the toes, both arms raised straight overhead','quick athletic landing stance: feet flat, hips pushed back, knees bent and aligned over the toes, chest up, arms swung down and back'],
 'drop-jump':[studio,'ground contact of a drop jump: both feet landing on the floor about one metre IN FRONT of a low wooden box, knees slightly bent, arms swung back, the box empty behind him','rebounding: airborne in front of the box, about one metre forward of it, NOT above the box, body extended, arms reaching up, feet clearly off the floor, the box empty behind him'],
 'single-pogo':[studio,'standing on one leg on the ball of the foot, standing knee almost straight, other knee bent, one hand lightly touching a wall for balance','small hop on one leg: standing foot a few centimetres off the floor, ankle stiff, knee almost straight, hand lightly on the wall'],
 'approach-jump':[court,'two-foot plant at the end of a short run-up: both feet on the floor, hips loaded low, both arms swung back, a basketball hoop visible in the background','airborne high, still seen from the same side profile and facing the same direction, body extended, both arms reaching up toward the rim, feet well off the floor'],
 'single-leg-vertical':[court,'last step of a layup approach: planting one foot ahead, body slightly leaning back, arms swinging, basketball hoop in the background','one-leg takeoff in the air: takeoff leg extended below, free knee driven up high, one arm reaching up toward the basketball rim'],
 'db-jump':[studio,'quarter squat with BOTH feet flat on the floor, holding a light dumbbell in each hand hanging vertically at his sides along the thighs, hips back, chest up','airborne jump high above the floor, legs fully extended and toes pointed, the light dumbbells still hanging vertically at his sides, feet about 30 cm off the floor'],
 'lateral-decel':[court,'standing almost upright with feet close together, knees only slightly bent, mid side shuffle, arms relaxed','very wide and deep lateral braking stance: feet far apart, weight on the outside leg bent about 90 degrees with the knee directly over the foot, hips very low, inside leg fully straight to the side, torso upright'],
 'slant-squat':[studio,'standing tall with both heels raised on a thick weight plate, toes on the floor, one hand on a sturdy support','deep squat with both heels still on the weight plate, knees travelling well forward over the toes, torso upright, one hand on the support'],
 'reverse-nordic':[studio,'kneeling upright on a mat with no foot anchor, knees hip width, shins and the tops of the feet flat on the mat, torso perfectly vertical, arms crossed on the chest','whole body tilted far BACKWARD as one rigid straight line from knees to head, about 40 degrees behind vertical, head now well behind the knees, hips NOT bent, knees and shins still on the mat, arms crossed'],
 'foot-doming':[studio+' Close-up side view at floor level: only the lower leg and the bare foot fill the frame, no face.','the bare foot of a seated man resting flat and relaxed on the floor, the inner arch low and touching the floor, toes relaxed','the same bare foot actively shortened: the inner arch clearly lifted high off the floor into a dome with a visible gap under it, toes still flat and long on the floor, heel and ball of the foot still on the floor'],
 'couch-stretch':[studio,'half kneeling on a mat: the back knee on the mat tucked right into the corner where the floor meets the wall, the back shin pointing straight UP and pressed vertically against the wall, sole of the back foot facing the ceiling, front foot planted forward, torso leaning forward with hands on the front knee','same position with the back shin still pressed vertically up the wall, torso now fully upright and vertical, glutes squeezed, hips pushed slightly forward'],
 'active-slr':[studio,'lying flat on his back on a mat, BOTH legs straight and resting flat on the mat side by side, no leg raised, toes pointing up, arms at his sides','lying on his back, one leg raised straight up to about 80 degrees with the knee locked, the other leg flat on the mat, pelvis flat on the floor']
};
(async()=>{
 const ids=process.argv.slice(2).length?process.argv.slice(2):Object.keys(poses);
 for(const id of ids){
  const exercise=PT.catalog.find(e=>e.id===id);if(!exercise||!poses[id])throw Error('Exercice inconnu '+id);
  const [place,start,end]=poses[id];
  for(const pose of ['start','end']){
   if(ledger.attempts.some(x=>x.id===id&&x.pose===pose&&x.status==='saved'))continue;
   await usage();fs.readFileSync(path.join(skill,'models/nano-banana-2-lite.md'),'utf8');
   const first=ledger.attempts.find(x=>x.id===id&&x.pose==='start'&&x.status==='saved');
   if(pose==='end'&&!first)throw Error('Position de départ manquante '+id);
   const model='google/nano-banana-2-lite'+(pose==='end'?'/edit':'');
   const prompt=pose==='start'?`${style(place)} Exercise: ${exercise.name}. Position: ${start}. Show exactly this exercise and position, not a variation.`:`Edit this photograph. Keep EXACTLY the same man, face, clothing, equipment, room, camera angle, framing and lighting. Change ONLY the body posture to: ${end}. The man keeps facing the same direction and the camera stays on the same side view as in the reference. This posture change must be large and obvious at a glance compared to the reference. All support points must clearly touch the floor or equipment unless the man is jumping. No extra people, no text.`;
   const params={prompt,aspect_ratio:'4:3',num_images:1,output_format:'jpeg',...(pose==='end'?{image_urls:[first.url]}:{})};
   const created=new Date().toISOString();const base=`rehaab_${id}_${pose}_${created.replace(/[:.]/g,'-')}`;
   const attempt={id,pose,model,prompt,created,status:'submitted'};ledger.attempts.push(attempt);save();
   const res=await fetch('https://fal.run/'+model,{method:'POST',headers,body:JSON.stringify(params),signal:AbortSignal.timeout(180000)});
   const raw=await res.text();attempt.http_status=res.status;attempt.request_id=res.headers.get('x-fal-request-id');
   if(!res.ok){attempt.status='failed';attempt.error=raw;save();throw Error(raw);}
   const url=JSON.parse(raw).images?.[0]?.url;if(!url)throw Error('Réponse sans image');
   const image=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!image.ok)throw Error('Téléchargement '+image.status);
   attempt.file=path.join(output,base+'.jpg');attempt.url=url;
   fs.writeFileSync(attempt.file,Buffer.from(await image.arrayBuffer()));
   const refs=[];
   if(pose==='end'){fs.mkdirSync(path.join(output,'refs'),{recursive:true});const ref=path.join('refs',path.basename(first.file));fs.copyFileSync(first.file,path.join(output,ref));refs.push(ref);}
   fs.writeFileSync(path.join(output,base+'.json'),JSON.stringify({model,prompt,refs,params,created,request_id:attempt.request_id},null,2));
   attempt.status='saved';save();console.log('IMAGE '+id+' '+pose);
  }
 }
 await usage();console.log('LOT_TERMINE '+JSON.stringify({reported_usd:ledger.reported_usd,tracked_usd:ledger.tracked_usd}));
})().catch(error=>{save();console.error(error.message);process.exitCode=1;});

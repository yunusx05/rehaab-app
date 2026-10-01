// Lot 5 : illustrations 2 positions de tous les exercices encore sans image (anciens + Quick Rehab, Warm Up, gilet lesté, disques slide).
// Même chaîne que le lot 4 : nano-banana-2-lite pour le départ, /edit pour l'arrivée. Poses : exercise-poses.json, sinon écrites ici.
// Usage : node scripts/generate-media-lot5.cjs [id ...] [--redo id ...]
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const PT=require('../personal-engine.js');
const output="C:/Users/Anton/Desktop/WORKS/generation d'image IA";
const skill='C:/Users/Anton/.claude/skills/generate';
const ledgerFile=path.join(output,'rehaab_media_lot_2026-10-01b.json');
const key=fs.readFileSync(path.join(skill,'.env'),'utf8').match(/^FAL_KEY=(.*)$/m)?.[1].trim().replace(/^['"]|['"]$/g,'');
if(!key)throw Error('FAL_KEY absente');
const headers={Authorization:'Key '+key,'Content-Type':'application/json'};
const ledger=fs.existsSync(ledgerFile)?JSON.parse(fs.readFileSync(ledgerFile,'utf8')):{usd_per_eur:1.1551,limit_eur:22,start:new Date().toISOString(),attempts:[]};
const save=()=>fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2));
let lastUsage=0;
async function usage(force=false){
 ledger.provisional_usd=ledger.attempts.filter(x=>x.status!=='failed').length*0.05;
 if(force||Date.now()-lastUsage>60000){
  const query=new URLSearchParams({start:ledger.start,end:new Date().toISOString(),expand:'summary',bound_to_timeframe:'false'});
  for(const id of ['google/nano-banana-2-lite','google/nano-banana-2-lite/edit'])query.append('endpoint_id',id);
  const res=await fetch('https://api.fal.ai/v1/models/usage?'+query,{headers,signal:AbortSignal.timeout(30000)});
  if(res.ok){const data=await res.json();ledger.reported_usd=(data.summary||[]).reduce((a,x)=>a+Number(x.cost_total??x.cost),0);lastUsage=Date.now();}
 }
 ledger.tracked_usd=Math.max(ledger.reported_usd||0,ledger.provisional_usd);save();
 if(ledger.tracked_usd+0.05>=ledger.limit_eur*ledger.usd_per_eur)throw Error('SEUIL_BUDGET : pause avant nouvel appel');
}
const studio='Charcoal grey training studio, soft directional light.';
const court='Indoor basketball court with a hardwood floor, dim moody charcoal lighting.';
const style=place=>`One single photorealistic editorial exercise photograph of ONE adult man only. Dark plain athletic clothing, no logos, training shoes. ${place} Full body and ALL floor contact points visible, wide side or three-quarter view with generous margins. Realistic anatomy and equipment. No women, no text, no collage, no watermark.`;
const vest=' He wears a black weighted vest with small weight pockets, strapped tight around the chest.';
const sliders=' Two small round red plastic sliding discs on the floor are clearly visible under his feet.';
const band=' A green resistance band is clearly visible.';
const poses={
 'tke':[studio+band,'standing on one leg, a resistance band anchored low in front of him and looped behind the standing knee, that knee slightly bent about 30 degrees, other foot resting lightly','same stance, the standing knee now fully straightened backward against the band, thigh muscles tight, band clearly stretched'],
 'spanish-squat':[studio,'standing tall with a thick resistance band looped behind both knees and anchored to a sturdy post in front of him at knee height, shins vertical','sitting back into a squat at about 70 degrees of knee bend, shins still vertical held by the band, hips far back, torso upright, arms forward for balance'],
 'iso-split':[studio,'standing tall with feet staggered in a long lunge stance, front foot flat, back heel raised, torso upright, hands on the hips','holding a lunge: front knee bent about 90 degrees above the front ankle, back knee hovering a few centimetres above the floor, torso upright, hands on the hips'],
 'step-down':[studio,'standing on one leg on a low wooden step about 20 cm high, other leg straight and hanging off the front edge, hands on the hips','the standing knee bent and tracking over the toes, the free heel lowered to lightly touch the floor in front of the step, torso upright'],
 'wall-drill':[court,'both hands flat on a wall at shoulder height, body leaning forward about 45 degrees in one straight line, both feet on the balls of the feet behind him','same 45 degree lean against the wall, one knee driven up to hip height with toes pulled up, body still in one straight line'],
 'accel-10':[court,'two-point sprint start stance: staggered feet, body leaning forward, opposite arm forward, ready to sprint','sprinting forward hard, body leaning forward about 45 degrees, rear leg fully extended pushing off, front knee driven high, arms pumping'],
 'sprint-20':[court,'running upright at moderate speed, mid stride, relaxed arms','full sprint at top speed, tall posture, front knee high, foot striking under the hips, arms pumping strongly'],
 'crossover-start':[court,'low defensive stance facing the camera, feet wide, knees bent, hands active in front','crossover step: hips turned 90 degrees, the far foot crossing over in front of the body, leaning hard into the new direction, starting to sprint sideways'],
 'shuttle-5105':[court,'low athletic stance straddling a painted line on the court, one hand ready, a small orange cone on each side','deep low turn: one hand touching the line on the floor, outside leg bent strongly and pushing off to sprint back the other way, a cone nearby'],
 'decel-stick':[court,'sprinting forward, body leaning forward, mid stride','stopped in a low braking position: staggered feet, hips low, knees bent and aligned over the toes, chest up, arms in front for balance'],
 'lateral-bound-stick':[court,'standing on the right leg in a quarter squat, left leg off the floor, body loaded to push sideways','landed on the left leg far to the side, knee bent and directly over the foot, right leg off the floor, balanced and still'],
 'adductor-squeeze':[studio,'lying on his back on a mat, knees bent, feet flat, a small round firm cushion held loosely between the knees, arms at his sides','same position, knees squeezed firmly together on the cushion, cushion visibly compressed, thigh muscles tight'],
 'single-hop-stick':[court,'standing on one leg, slight knee bend, arms back, ready to hop forward','landed on the same leg about one metre forward, knee bent over the foot, other foot off the floor, arms out, holding still'],
 'foot-doming':[studio+' Close-up side view at floor level: only the lower leg and the bare foot fill the frame, no face, no upper body.','one bare foot resting flat and relaxed on a light wooden floor, the inner arch low and touching the floor, toes relaxed and long','the same bare foot actively shortened: the inner arch clearly lifted high off the floor into a dome with a visible dark gap under it, toes still flat on the floor, NOT curled'],
 'vest-pushup':[studio+vest,'high plank push-up position, arms straight, hands under the shoulders, body straight from head to heels','bottom of the push-up, elbows bent about 45 degrees from the body, chest a few centimetres above the floor, body still straight'],
 'vest-pullup':[studio+vest,'hanging from a pull-up bar with arms fully straight, overhand grip, legs together','pulled up with the chin above the bar, elbows bent and pulled down, body straight, no swinging'],
 'vest-split-squat':[studio+vest,'standing in a long split stance, front foot flat, back heel raised, both legs nearly straight, torso upright','lowered split squat: front knee bent 90 degrees over the ankle, back knee just above the floor, torso upright'],
 'vest-step-up':[studio+vest,'standing in front of a sturdy flat bench, one foot fully planted on top of the bench, other foot on the floor','standing tall on top of the bench on one leg, the other knee raised in front, body upright'],
 'vest-calf':[studio+vest,'balls of both feet on the edge of a sturdy step, heels dropped below the step, one hand on a wall','raised high on the toes on the edge of the step, heels well above the step, one hand on the wall'],
 'vest-march':[court+vest,'walking briskly, mid stride, upright posture, arms swinging naturally','walking briskly on the other foot, mid stride, upright, opposite arm forward'],
 'slider-ham-curl':[studio+sliders,'lying on his back, heels resting on the sliding discs, legs almost straight, hips lifted off the floor in a bridge','same bridge with hips high, heels pulled in on the discs close to the buttocks, knees bent about 90 degrees'],
 'slider-lateral-lunge':[studio+sliders,'standing tall, feet together, one foot on a sliding disc','one leg slid far out to the side on the disc and straight, the other leg bent deeply with hips back, torso upright'],
 'slider-reverse-lunge':[studio+sliders,'standing tall, feet hip width, the back foot resting on a sliding disc','back foot slid far backward on the disc, front knee bent 90 degrees over the ankle, back knee near the floor, torso upright'],
 'slider-climber':[studio+sliders,'high plank, hands under the shoulders, both feet on the sliding discs, body straight','plank with one knee pulled toward the chest by sliding the foot forward on the disc, other leg straight back'],
 'slider-adductor':[studio+sliders,'standing tall with feet together, one foot on a sliding disc, hands on the hips','the disc foot slid out wide to the side with that leg straight, standing leg slightly bent, hands on the hips'],
 'slider-bodysaw':[studio+sliders,'forearm plank with both feet on the sliding discs, body straight, elbows under the shoulders','forearm plank with the body pushed backward so the elbows are now well in front of the shoulders, feet slid back on the discs, body still straight'],
 'band-er':[studio+band,'standing side-on to a post, the band anchored at waist height, near hand holding the band across the belly, elbow bent 90 degrees and tucked against the side with a small rolled towel','same stance, forearm rotated outward away from the belly about 70 degrees, elbow still tucked at the side, band clearly stretched'],
 'er-iso':[studio,'standing with his side close to a wall, elbow bent 90 degrees and tucked at his side, the back of the hand a few centimetres from the wall','same position with the back of the hand now pressing firmly into the wall, shoulder muscles visibly working, elbow still tucked at his side, body upright'],
 'wall-slide':[studio,'standing with his back flat against a wall, forearms and the backs of the hands on the wall, elbows bent at shoulder height like a goal post','arms slid straight up overhead along the wall, forearms still on the wall, lower back flat against the wall'],
 'curl-up':[studio,'lying on his back on a mat, one knee bent with the foot flat, the other leg straight, both hands flat under the lower back, head resting','head and shoulders lifted just a few centimetres off the mat as one block, chin neutral, hands still under the lower back'],
 'heel-drop-ecc':[studio,'standing high on the toes of both feet on the edge of a sturdy step, heels raised, one hand on a wall','standing on one foot on the step edge, that heel lowered well below the level of the step, the other foot lifted, one hand on the wall'],
 'finger-ext':[studio+' Close-up of the hand and forearm at chest height, no face.','one hand with the fingertips and thumb gathered together inside a small rubber band, fingers closed','the same hand with the fingers and thumb spread wide open, the small rubber band clearly stretched around them'],
 'chin-tuck':[studio+' Side profile, seated upright on a bench, from the hips up.','seated tall on a bench, head in a forward resting position, looking straight ahead','head glided straight back so the chin is tucked and the ears are over the shoulders, looking straight ahead, a slight double chin visible'],
 'wrist-iso':[studio+' Close-up of both forearms resting on the thigh, seated, no face.','seated, one forearm resting on the thigh palm down with a loose fist, the other hand resting on top of the back of that fist','the lower fist pressing up firmly against the top hand without moving, forearm muscles clearly tense, knuckles white'],
 'towel-grip':[studio+' Seated on a bench, from the waist up.','seated holding a rolled towel horizontally in front of the belly with both hands, elbows close to the body','twisting the towel firmly in opposite directions with both hands, as if wringing it out, the towel visibly twisted'],
 'ankle-alphabet':[studio+' Seated on a bench, lower legs in frame.','seated on a bench, one leg extended with the heel resting on the floor, foot relaxed and pointing up','the same extended foot tilted and rotated as if drawing a large letter in the air with the big toe, ankle clearly circled to the side'],
 'jog-court':[court,'jogging lightly, mid stride, relaxed upright posture','jogging lightly on the other foot, mid stride, opposite arm forward'],
 'lateral-shuffle':[court,'low athletic stance, feet wide, knees bent, chest up, facing the camera','mid shuffle sideways: feet closer together but not touching, body still low, both hands active in front'],
 'carioca':[court,'moving sideways facing the camera, the trailing foot crossed in front of the lead foot, hips rotated','moving sideways, the trailing foot now crossed behind the lead foot, hips rotated the other way, arms out for balance'],
 'backpedal':[court,'running backward away from the camera direction, torso leaning slightly forward, on the balls of the feet, arms active','running backward, opposite stride, torso still leaning slightly forward, small quick steps'],
 'skip-a':[court,'tall posture on the ball of one foot, both arms bent 90 degrees, about to skip','skipping with one knee driven up to hip height, toes pulled up, standing foot just leaving the floor, opposite arm forward'],
 'defensive-slide':[court,'low defensive stance facing the camera, feet wide, hands active, sliding sideways','braking on the outside leg: deep bent outside knee over the foot, inside leg straight to the side, hips low, chest up']
};
const fromJson=JSON.parse(fs.readFileSync(path.join(__dirname,'exercise-poses.json'),'utf8'));
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','exercise-media.js'),'utf8'),ctx);
const place=e=>e.kind==='plyo'||['run-interval','skater','sprint-20','walk-hill','shadow-box'].includes(e.id)?court:studio;
function poseOf(e){
 if(poses[e.id]) return poses[e.id];
 const p=fromJson[e.id];if(!p)return null;
 const extra=e.needs.includes('bands')?band:'';
 return [place(e)+extra,p[0],p[1]];
}
async function generate(id,redo){
 const exercise=PT.catalog.find(e=>e.id===id);const pose=exercise&&poseOf(exercise);if(!pose)throw Error('Pose inconnue '+id);
 const [where,start,end]=pose;
 if(redo) ledger.attempts.filter(x=>x.id===id&&x.status==='saved').forEach(x=>x.status='replaced');
 for(const position of ['start','end']){
  if(ledger.attempts.some(x=>x.id===id&&x.pose===position&&x.status==='saved'))continue;
  await usage();
  const first=ledger.attempts.find(x=>x.id===id&&x.pose==='start'&&x.status==='saved');
  if(position==='end'&&!first)throw Error('Position de départ manquante '+id);
  const model='google/nano-banana-2-lite'+(position==='end'?'/edit':'');
  const prompt=position==='start'?`${style(where)} Exercise: ${exercise.name}. Position: ${start}. Show exactly this exercise and position, not a variation.`:`Edit this photograph. Keep EXACTLY the same man, face, clothing, equipment, room, camera angle, framing and lighting. Change ONLY the body posture to: ${end}. The man keeps facing the same direction and the camera stays on the same side view as the original. The change must be large and obvious. No text, no collage.`;
  const params={prompt,aspect_ratio:'4:3',num_images:1,output_format:'jpeg',...(position==='end'?{image_urls:[first.url]}:{})};
  const created=new Date().toISOString();const base=`rehaab_${id}_${position}_${created.replace(/[:.]/g,'-')}`;
  const attempt={id,pose:position,model,prompt,created,status:'submitted'};ledger.attempts.push(attempt);save();
  const res=await fetch('https://fal.run/'+model,{method:'POST',headers,body:JSON.stringify(params),signal:AbortSignal.timeout(180000)});
  const raw=await res.text();attempt.http_status=res.status;attempt.request_id=res.headers.get('x-fal-request-id');
  if(!res.ok){attempt.status='failed';attempt.error=raw.slice(0,500);save();throw Error(id+' '+raw.slice(0,200));}
  const url=JSON.parse(raw).images?.[0]?.url;if(!url){attempt.status='failed';save();throw Error('Réponse sans image '+id);}
  const image=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!image.ok)throw Error('Téléchargement '+image.status);
  attempt.file=path.join(output,base+'.jpg');attempt.url=url;
  fs.writeFileSync(attempt.file,Buffer.from(await image.arrayBuffer()));
  const refs=[];
  if(position==='end'){fs.mkdirSync(path.join(output,'refs'),{recursive:true});const ref=path.join('refs',path.basename(first.file));fs.copyFileSync(first.file,path.join(output,ref));refs.push(ref);}
  fs.writeFileSync(path.join(output,base+'.json'),JSON.stringify({model,prompt,refs,params,created,request_id:attempt.request_id},null,2));
  attempt.status='saved';save();console.log('IMAGE '+id+' '+position);
 }
}
(async()=>{
 const args=process.argv.slice(2),redo=args[0]==='--redo';
 const ids=(redo?args.slice(1):args).length?(redo?args.slice(1):args):PT.catalog.filter(e=>!ctx.window.RehaabMedia[e.id]).map(e=>e.id);
 const queue=[...ids],failures=[];
 const worker=async()=>{while(queue.length){const id=queue.shift();try{await generate(id,redo);}catch(e){if(/SEUIL_BUDGET/.test(e.message)){queue.length=0;failures.push(e.message);}else{failures.push(e.message);console.error('ECHEC',e.message);}}}};
 await Promise.all([worker(),worker(),worker(),worker()]);
 await usage(true).catch(e=>failures.push(e.message));
 console.log('LOT_TERMINE '+JSON.stringify({ids:ids.length,failures,reported_usd:ledger.reported_usd,tracked_usd:ledger.tracked_usd}));
})().catch(error=>{save();console.error(error.message);process.exitCode=1;});

// Éclaireur YouTube : repère des exercices et drills basket chez les créateurs suivis et chez les nouveaux (recherche par thème et par date).
// Usage : node scripts/scout-yt-drills.cjs [--per-channel 12] [--per-topic 6] [--max 40] [--topics-only]
//   → scripts/drill-candidates.json : pour chaque vidéo regardée, les drills extraits par Gemini (nom, but, matériel, points clés, dosage, instant).
// Les fiches de l'app sont ensuite écrites à la main à partir de ces candidats : rien n'est recopié tel quel.
// Une vidéo déjà regardée n'est jamais renvoyée à Gemini (relancer le script ne coûte que les nouvelles vidéos).
const {execFile}=require('child_process'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),out=path.join(__dirname,'drill-candidates.json');
const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'scout-channels.json'),'utf8'));
const arg=(name,def)=>{const i=process.argv.indexOf(name);return i>0?Number(process.argv[i+1]):def;};
const perChannel=arg('--per-channel',12),perTopic=arg('--per-topic',6),max=arg('--max',40);
const run=(cmd,a)=>new Promise((ok,ko)=>execFile(cmd,a,{encoding:'utf8',maxBuffer:32e6},(e,o,er)=>e?ko(Object.assign(e,{stderr:er})):ok(o)));
const known=fs.existsSync(out)?JSON.parse(fs.readFileSync(out,'utf8')):{videos:{}};
const save=()=>fs.writeFileSync(out,JSON.stringify(known,null,1)+'\n');

// Catalogue actuel : Gemini signale les drills déjà présents pour éviter les doublons.
global.window={};
const PT=require(path.join(root,'personal-engine.js')),SK=require(path.join(root,'basket-skills.js'));
const catalogue=[...PT.catalog,...SK.drills].map(e=>e.name).join(' ; ');
const keyword=new RegExp(cfg.keywords,'i');

const list=async(source,n)=>(await run('yt-dlp',['--flat-playlist','--no-warnings','--playlist-end',String(n),'--print','%(id)s\t%(duration)s\t%(channel)s\t%(title)s',source]))
  .trim().split('\n').filter(Boolean).map(l=>{const [videoId,d,channel,...t]=l.split('\t');return {videoId,duration:Number(d)||0,channel:channel==='NA'?'':channel,title:t.join(' ')};});

async function candidates(){
  const found=new Map();
  for(const c of process.argv.includes('--topics-only')?[]:cfg.channels){
    try{(await list(`https://www.youtube.com/@${c.handle}/videos`,perChannel)).filter(v=>keyword.test(v.title)).forEach(v=>found.set(v.videoId,{...v,channel:c.name,via:'chaîne suivie'}));}
    catch(e){console.error(`${c.name} : chaîne introuvable`);}
  }
  // Recherche par date : fait remonter les créateurs récents qui ne sont pas encore suivis.
  for(const t of cfg.topics){
    try{(await list(`https://www.youtube.com/results?search_query=${encodeURIComponent(t)}&sp=CAI%253D`,perTopic)).forEach(v=>{if(!found.has(v.videoId))found.set(v.videoId,{...v,via:`thème « ${t} »`});});}
    catch(e){console.error(`${t} : recherche impossible`);}
  }
  // Vidéos de 1 à 25 minutes : assez longues pour montrer des drills, assez courtes pour être regardées en entier.
  return [...found.values()].filter(v=>!known.videos[v.videoId]&&v.duration>=60&&v.duration<=1500);
}

async function watch(v){
  const key=process.env.GEMINI_API_KEY;if(!key)throw new Error('GEMINI_API_KEY manquante');
  const text=`You are helping a basketball strength coach build an exercise library. Watch this video and list every distinct exercise or basketball drill that is actually DEMONSTRATED on screen (not just mentioned).
For each one return: name (English, short), category (one of: first-step, deceleration, vertical-two-feet, vertical-one-foot, reactive-ankles, isometric, medicine-ball, strength, conditioning, mobility, finishing, footwork, shooting, ball-handling, defense, counter-moves), purpose (what it improves in a game, one sentence), equipment (array), cues (max 3 short coaching cues), dosage (sets/reps/time if said or shown, else ""), start (second where it is first clearly shown), male_demonstrator (true only if every visible person, including in the background, is a man), duplicate_of (the name from this list if it is essentially the same exercise, else ""): ${catalogue}.
Return JSON: {"drills":[...]}. Return {"drills":[]} if the video shows no drill (talk, highlights, podcast).`;
  const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL||'gemini-3.6-flash'}:generateContent?key=${key}`,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({contents:[{parts:[{file_data:{file_uri:`https://www.youtube.com/watch?v=${v.videoId}`}},{text}]}],generationConfig:{responseMimeType:'application/json',mediaResolution:'MEDIA_RESOLUTION_LOW'}})});
  const j=await res.json(),answer=j.candidates?.[0]?.content?.parts?.find(p=>p.text)?.text;
  if(!answer)throw new Error('Gemini : '+JSON.stringify(j.error||j).slice(0,160));
  return (JSON.parse(answer).drills||[]).filter(d=>d&&d.name);
}

(async()=>{
  const list=(await candidates()).slice(0,max);
  console.log(`${list.length} vidéos à regarder`);
  const queue=[...list];let drills=0;
  await Promise.all(Array.from({length:3},async()=>{while(queue.length){const v=queue.shift();
    try{const d=await watch(v);known.videos[v.videoId]={...v,date:new Date().toISOString().slice(0,10),drills:d};drills+=d.length;save();console.log(`${v.channel||'?'} · ${v.title} → ${d.length} drills`);}
    catch(e){console.error(`${v.videoId} : ${e.message}`);}
  }}));
  console.log(`${drills} drills extraits, ${Object.keys(known.videos).length} vidéos au total dans drill-candidates.json`);
})();

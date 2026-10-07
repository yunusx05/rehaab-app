// Démos d'exercices depuis YouTube (usage strictement personnel) : recherche, vérification par Gemini, extrait muet de 6 s en boucle.
// Usage : node scripts/fetch-yt-demos.cjs <dossier-brut> [--redo] [id ...]
//   → media/videos/yt/<id>.mp4 + <id>.webp, et scripts/yt-picks.json (source, titre, instant de départ, ce que Gemini a vu).
// Chaque candidate est regardée par Gemini (GEMINI_API_KEY) : bon exercice ? à quel instant est-il montré ? Démonstrateur masculin uniquement.
// Un choix manuel se fixe dans yt-picks.json avec "manual": true (videoId + start) : il n'est jamais remplacé par une recherche.
// --redo refait les ids donnés en écartant les vidéos déjà rejetées ("rejected": [...]).
const {execFile}=require('child_process'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),out=path.join(root,'media','videos','yt'),picksFile=path.join(__dirname,'yt-picks.json');
const args=process.argv.slice(2),raw=args.shift();
if(!raw){console.error('Usage : node scripts/fetch-yt-demos.cjs <dossier-brut> [--redo] [id ...]');process.exit(1);}
const redo=args.includes('--redo'),only=args.filter(a=>a!=='--redo');
const queries=JSON.parse(fs.readFileSync(path.join(__dirname,'yt-queries.json'),'utf8'));
const picks=fs.existsSync(picksFile)?JSON.parse(fs.readFileSync(picksFile,'utf8')):{};
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(raw,{recursive:true});
const CLIP=6;
const run=(cmd,a)=>new Promise((ok,ko)=>execFile(cmd,a,{encoding:'utf8',maxBuffer:32e6},(e,o,er)=>e?ko(Object.assign(e,{stderr:er})):ok(o)));
const save=()=>fs.writeFileSync(picksFile,JSON.stringify(picks,null,1)+'\n');

async function locate(id,videoId){
  const key=process.env.GEMINI_API_KEY;if(!key)throw new Error('GEMINI_API_KEY manquante');
  const text=`Exercise expected: ${queries[id]}. Watch the video. Find the best ${CLIP}-second window where a person clearly and continuously performs THIS exact exercise (whole body visible and large in the frame (at least half of the frame height, not a distant figure), several repetitions, no talking head, no text-only screen, no TV broadcast, no slow motion). Answer JSON only: {"match":true|false,"start":seconds,"end":seconds,"exercise_seen":"short description","quality":1-5}. match=false if the exercise shown is a different one or a variation with different equipment, or if any woman is visible anywhere in the window, including background people, posters or thumbnails (male performers only).`;
  const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL||'gemini-3.6-flash'}:generateContent?key=${key}`,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({contents:[{parts:[{file_data:{file_uri:`https://www.youtube.com/watch?v=${videoId}`}},{text}]}],generationConfig:{responseMimeType:'application/json',mediaResolution:'MEDIA_RESOLUTION_LOW'}})});
  const j=await res.json(),answer=j.candidates?.[0]?.content?.parts?.find(p=>p.text)?.text;
  if(!answer)throw new Error('Gemini : '+JSON.stringify(j.error||j).slice(0,160));
  return JSON.parse(answer);
}

async function search(id){
  const rejected=new Set(picks[id]?.rejected||[]);
  const lines=(await run('yt-dlp',['--flat-playlist','--no-warnings','--print','%(id)s\t%(duration)s\t%(title)s',`ytsearch10:${queries[id]}`])).trim().split('\n');
  // Vidéos courtes d'abord : le mouvement y est montré sans longue présentation.
  const found=lines.map(l=>{const [vid,d,...t]=l.split('\t');return {videoId:vid,duration:Number(d),title:t.join(' ')};})
    .filter(c=>c.videoId&&!rejected.has(c.videoId)&&c.duration>=8&&c.duration<=420)
    .sort((a,b)=>(a.duration>90)-(b.duration>90)).slice(0,4);
  for(const c of found){
    try{
      const g=await locate(id,c.videoId);
      if(g.match&&g.quality>=3&&Number.isFinite(g.start)&&g.start+CLIP<=c.duration+.5)return {...c,start:Math.max(0,Math.floor(g.start)),seen:g.exercise_seen,quality:g.quality};
      rejected.add(c.videoId);
    }catch(e){console.error(`${id} : ${c.videoId} ${e.message}`);}
  }
  picks[id]={...(picks[id]||{}),rejected:[...rejected]};
  return null;
}

async function fetchClip(id,pick){
  const start=pick.start??0,src=path.join(raw,`${id}.mp4`);
  if(fs.existsSync(src))fs.unlinkSync(src);
  // Vidéo entière en 480p puis découpe locale : le téléchargement partiel de YouTube renvoie parfois un fichier sans image.
  await run('yt-dlp',['--no-warnings','--no-playlist','-f','bv*[height<=480][ext=mp4]/bv*[height<=480]/b[height<=480]/b','--remux-video','mp4','-o',src,`https://www.youtube.com/watch?v=${pick.videoId}`]);
  const mp4=path.join(out,`${id}.mp4`),poster=path.join(out,`${id}.webp`);
  // Muet, 480 px sur le grand côté, images clés rapprochées pour une boucle sans saut.
  await run('ffmpeg',['-y','-loglevel','error','-ss',String(start),'-i',src,'-t',String(CLIP),'-an','-vf','scale=w=480:h=480:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30','-c:v','libx264','-profile:v','main','-preset','slow','-crf','28','-g','30','-pix_fmt','yuv420p','-movflags','+faststart',mp4]);
  await run('ffmpeg',['-y','-loglevel','error','-ss','2','-i',mp4,'-frames:v','1','-q:v','70',poster]);
  fs.unlinkSync(src);
  return {...pick,start,size:fs.statSync(mp4).size};
}

const ids=only.length?only:Object.keys(queries);
let ok=0;const fail=[];
async function one(id){
  if(!queries[id]){fail.push(id);console.error(`${id} : pas de requête`);return;}
  if(fs.existsSync(path.join(out,`${id}.mp4`))&&!redo&&picks[id]?.videoId)return;
  try{
    const pick=picks[id]?.manual?picks[id]:await search(id);
    if(!pick)throw new Error('aucune vidéo validée par Gemini');
    const clip=await fetchClip(id,pick);
    picks[id]={...clip,rejected:picks[id]?.rejected,manual:picks[id]?.manual||undefined,query:queries[id]};
    save();ok++;console.log(`${id} ← ${clip.videoId} @${clip.start}s « ${clip.title} » (${clip.seen||'manuel'})`);
  }catch(e){fail.push(id);save();console.error(`${id} : ${String(e.stderr||e.message).split('\n').filter(Boolean).slice(-1)[0]}`);}
}
// Quatre exercices en parallèle.
(async()=>{
  const queue=[...ids];
  await Promise.all(Array.from({length:4},async()=>{while(queue.length)await one(queue.shift());}));
  console.log(`${ok} extraits, ${fail.length} échecs${fail.length?' : '+fail.join(' '):''}`);
})();

// Éclaireur « Lis ton défenseur » en vidéo : repère dans de vraies actions de 1 contre 1 le moment où le défenseur montre
// un indice lisible (pied avancé, mains hautes, distance, closeout, recul, aide), la bonne action et les instants à couper.
// Usage : node scripts/scout-defender-reads.cjs [--per-query 6] [--max 30]  (GEMINI_API_KEY requis)
//   → scripts/defender-reads.json : { videos: { <videoId>: {title, channel, duration, moments:[...] } } }
// Une vidéo déjà regardée n'est jamais renvoyée à Gemini.
const {execFile}=require('child_process'),fs=require('fs'),path=require('path');
const out=path.join(__dirname,'defender-reads.json');
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i>0?Number(process.argv[i+1]):d;};
const perQuery=arg('--per-query',6),max=arg('--max',30);
const run=(cmd,a)=>new Promise((ok,ko)=>execFile(cmd,a,{encoding:'utf8',maxBuffer:32e6},(e,o,er)=>e?ko(Object.assign(e,{stderr:er})):ok(o)));
const known=fs.existsSync(out)?JSON.parse(fs.readFileSync(out,'utf8')):{videos:{}};
const save=()=>fs.writeFileSync(out,JSON.stringify(known,null,1)+'\n');
const QUERIES=process.argv.includes('--team')?['2v2 basketball game gym hoopers','3v3 basketball game gym full game','5v5 pickup basketball run full game gym','pickup basketball run gym point guard','3v3 basketball tournament men gym','2v2 basketball game trainers','5v5 basketball run comp gym','pickup run basketball gym drive kick']:process.argv.includes('--varied')?['1v1 basketball pump fake drive','1v1 basketball hesitation crossover game','2v2 basketball game drive and kick','3v3 basketball game gym','pickup basketball closeout drive','1v1 basketball step back three game','5v5 pickup basketball gym full game','1v1 basketball game defender jumps on pump fake','3v3 basketball drive kick corner','1v1 basketball against defender contesting']:process.argv.includes('--gym')?['1v1 basketball full game empty gym','1 on 1 basketball game hoopers','1v1 basketball against trainer','1v1 king of the court basketball','1v1 basketball game crossovers','pickup basketball 1v1 outdoor court','1v1 basketball first to 11','iso 1v1 basketball workout game','1v1 basketball pro vs amateur','2v2 basketball game gym']:['attack the closeout film breakdown basketball','how to read a closeout basketball film study','attack the defender lead foot film breakdown','NBA isolation moves film breakdown','pump fake side step three NBA breakdown','hesitation pull up NBA film breakdown','drive and kick reading help defense film breakdown','NBA drive and kick corner three film study','snatch back crossover NBA isolation breakdown','point guard reading the defender film breakdown','NBA crossover breaks ankles slow motion breakdown','attacking a defender who sags off pull up three NBA'];
const CUES=['lead-foot','hands-high','sagging','closeout-fast','closeout-late','overplay','retreat','help-comes','help-stays'];
const ACTIONS=['drive-lead-side','cross-opposite','shoot','fake-drive','hesi-go','pass-help-side','finish'];

async function watch(v){
  const key=process.env.GEMINI_API_KEY;if(!key)throw new Error('GEMINI_API_KEY manquante');
  const text=`You are a basketball coach building a "read your defender" video quiz. Watch this video and find up to 5 moments of LIVE PLAY footage (1-on-1 games, pickup games, scrimmages or games; not drills done without a defender, not talking heads, not slides) where the BALL HANDLER faces ONE on-ball defender and the defender shows a readable cue just BEFORE the ball handler decides.
Cue (one of): ${CUES.join(', ')}. Meaning: lead-foot = defender has one foot clearly forward; hands-high = defender contests with hands up while close; sagging = defender stays far with low hands; closeout-fast = defender runs at the shooter out of control; closeout-late = defender is still far when the shooter catches; overplay = defender shades one side to deny it; retreat = defender backpedals on his heels; help-comes = a second defender leaves his man to stop the drive; help-stays = help defender stays home.
Action (one of): ${ACTIONS.join(', ')} — the action the ball handler actually takes, and it must be the RIGHT read for that cue and succeed (basket, open shot, or good pass).
For each moment return: start (seconds, about 3 s before the decision), pause (seconds, the exact instant the cue is visible and the decision is not yet made), end (seconds, about 2 s after the action), cue, action, success (true/false), feet_visible (true if the defender's feet are clearly visible at pause), male_only (true only if every visible person, including crowd and bench in frame, is male), view ("broadcast", "baseline", "sideline", "other"), what_fr (one French sentence describing what the defender does at the pause, from the viewer's point of view, without naming left or right), why_fr (one French sentence: why this action beats this cue).
Return JSON {"moments":[...]}. Prefer closeouts, help defense, pump fakes, hesitations and retreating defenders over simple isolations. Return {"moments":[]} if none qualify.`;
  const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL||'gemini-3.6-flash'}:generateContent?key=${key}`,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({contents:[{parts:[{file_data:{file_uri:`https://www.youtube.com/watch?v=${v.videoId}`}},{text}]}],generationConfig:{responseMimeType:'application/json',mediaResolution:'MEDIA_RESOLUTION_LOW'}})});
  const j=await res.json(),answer=j.candidates?.[0]?.content?.parts?.find(p=>p.text)?.text;
  if(!answer)throw new Error('Gemini : '+JSON.stringify(j.error||j).slice(0,160));
  return (JSON.parse(answer).moments||[]).filter(m=>m&&CUES.includes(m.cue)&&ACTIONS.includes(m.action)&&Number(m.start)<Number(m.pause)&&Number(m.pause)<Number(m.end));
}
(async()=>{
  const found=new Map();
  for(const q of QUERIES){
    try{(await run('yt-dlp',['--flat-playlist','--no-warnings','--print','%(id)s\t%(duration)s\t%(channel)s\t%(title)s',`ytsearch${perQuery}:${q}`])).trim().split('\n').forEach(l=>{const [videoId,d,channel,...t]=l.split('\t');const duration=Number(d)||0;
      if(videoId&&!known.videos[videoId]&&duration>=40&&duration<=1500&&!found.has(videoId))found.set(videoId,{videoId,duration,channel:channel==='NA'?'':channel,title:t.join(' '),query:q});});}
    catch(e){console.error(`${q} : recherche impossible`);}
  }
  const list=[...found.values()].slice(0,max);console.log(`${list.length} vidéos à regarder`);
  const queue=[...list];let n=0;
  await Promise.all(Array.from({length:3},async()=>{while(queue.length){const v=queue.shift();
    try{const m=await watch(v);known.videos[v.videoId]={...v,date:new Date().toISOString().slice(0,10),moments:m};n+=m.length;save();console.log(`${v.channel} · ${v.title.slice(0,60)} → ${m.length}`);}
    catch(e){console.error(`${v.videoId} : ${e.message}`);}}}));
  const all=Object.values(known.videos).flatMap(v=>v.moments.filter(m=>m.success&&m.feet_visible&&m.male_only));
  console.log(`${n} moments trouvés ; ${all.length} exploitables au total (réussis, pieds visibles, hommes uniquement)`);
})();

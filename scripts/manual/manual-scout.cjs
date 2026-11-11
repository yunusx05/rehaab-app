// Repérage manuel quand Gemini est en quota : 2 vidéos candidates par exercice, planche de 12 images horodatées chacune.
// Usage : node manual-scout.cjs <repo> <dossier-sortie> id [id ...]
//   → <sortie>/<id>.png (2 rangées : une par candidate) et <sortie>/<id>.json (videoId, titre, durée, instants des images).
const {execFile}=require('child_process'),fs=require('fs'),path=require('path');
const [repo,outDir,...ids]=process.argv.slice(2);
const queries=JSON.parse(fs.readFileSync(path.join(repo,'scripts','yt-queries.json'),'utf8'));
const picks=JSON.parse(fs.readFileSync(path.join(repo,'scripts','yt-picks.json'),'utf8'));
fs.mkdirSync(outDir,{recursive:true});
const run=(cmd,a)=>new Promise((ok,ko)=>execFile(cmd,a,{encoding:'utf8',maxBuffer:32e6},(e,o,er)=>e?ko(Object.assign(e,{stderr:er})):ok(o)));
const FONT="fontfile='C\\:/Windows/Fonts/arial.ttf'";

async function one(id){
  const q=queries[id];if(!q){console.log(id,'pas de requête');return;}
  const rejected=new Set([...(picks[id]?.rejected||[]),...(picks[id]?.refusedIds||[])]);
  const skip=new Set(JSON.parse(fs.existsSync(path.join(outDir,id+'.skip'))?fs.readFileSync(path.join(outDir,id+'.skip'),'utf8'):'[]'));
  const lines=(await run('yt-dlp',['--flat-playlist','--no-warnings','--print','%(id)s\t%(duration)s\t%(title)s',`ytsearch10:${q}`])).trim().split('\n');
  const found=lines.map(l=>{const [vid,d,...t]=l.split('\t');return {videoId:vid,duration:Number(d),title:t.join(' ')};})
    .filter(c=>c.videoId&&!skip.has(c.videoId)&&c.duration>=8&&c.duration<=600)
    .sort((a,b)=>(a.duration>120)-(b.duration>120)).slice(0,2);
  const rows=[],meta=[];
  for(const [i,c] of found.entries()){
    const src=path.join(outDir,`${id}-${i}.mp4`);
    try{
      if(!fs.existsSync(src))await run('yt-dlp',['--no-warnings','--no-playlist','-f','bv*[height<=360][ext=mp4]/bv*[height<=360]/b[height<=360]/b','--remux-video','mp4','-o',src,`https://www.youtube.com/watch?v=${c.videoId}`]);
      // 12 images régulières, en évitant les 3 premières secondes (intro).
      const d=c.duration,from=Math.min(3,d*0.1),step=(d-from-1)/12,times=Array.from({length:12},(_,k)=>Math.floor(from+k*step));
      const frames=[];
      for(const [k,t] of times.entries()){const f=path.join(outDir,`${id}-${i}-${k}.png`);
        await run('ffmpeg',['-y','-loglevel','error','-ss',String(t),'-i',src,'-frames:v','1','-vf',`scale=200:112:force_original_aspect_ratio=decrease,pad=200:112:(ow-iw)/2:(oh-ih)/2:black,drawtext=${FONT}:text='${t}s':x=4:y=4:fontsize=16:fontcolor=yellow:box=1:boxcolor=black`,f]);frames.push(f);}
      const row=path.join(outDir,`${id}-${i}-row.png`);
      await run('ffmpeg',['-y','-loglevel','error',...frames.flatMap(f=>['-i',f]),'-filter_complex',`hstack=inputs=${frames.length},pad=iw:ih+22:0:22:0x202020,drawtext=${FONT}:text='${i} ${c.videoId}':x=6:y=3:fontsize=16:fontcolor=white`,row]);
      frames.forEach(f=>fs.unlinkSync(f));rows.push(row);meta.push({...c,times});
    }catch(e){console.log(id,c.videoId,String(e.stderr||e.message).split('\n').filter(Boolean).slice(-1)[0]);}
  }
  if(!rows.length){console.log(id,'aucune candidate');return;}
  await run('ffmpeg',['-y','-loglevel','error',...rows.flatMap(r=>['-i',r]),'-filter_complex',rows.length>1?`vstack=inputs=${rows.length}`:'null',path.join(outDir,id+'.png')]);
  rows.forEach(r=>fs.unlinkSync(r));
  fs.writeFileSync(path.join(outDir,id+'.json'),JSON.stringify(meta,null,1));
  console.log(id,'ok',meta.map(m=>`${m.videoId} (${m.duration}s) ${m.title}`).join(' | '));
}
(async()=>{const queue=[...ids];await Promise.all(Array.from({length:4},async()=>{while(queue.length)await one(queue.shift());}));})();

// Run from the project root. Downloads attributed exercise media, no runtime API dependency.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const PT = require('../personal-engine.js');
const extra = {bridge:'Butt_Lift_Bridge',deadbug:'Dead_Bug',incline:'Incline_Dumbbell_Press',pullup:'Pullups'};
const films = {'db-press':17,'bb-press':21,'cable-row':1,lateral:6,curl:51,incline:24,legcurl:35,legpress:44,'db-shoulder':12};
async function download(url, target) {
  const r = await fetch(url); if (!r.ok) throw new Error(`${r.status}: ${url}`);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,Buffer.from(await r.arrayBuffer()));
}
(async()=>{
  const catalog = await (await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json')).json();
  const videos = await (await fetch('https://wger.de/api/v2/video/?limit=100')).json();
  const metadata = {}, sources = [];
  for (const e of PT.catalog) {
    // Existing hip-flexor photo depicts a standing variation, not the prescribed kneeling posture.
    const folder = e.id==='hip-flexor'?null:extra[e.id]||e.media;
    const source = catalog.find(x=>x.id===folder);
    if (source) {
      await Promise.all([0,1].map(n=>download(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${folder}/${n}.jpg`,`media/${folder}/${n}.jpg`)));
      metadata[e.id]={frames:folder,muscles:source.primaryMuscles};
    }
  }
  for (const [id,videoId] of Object.entries(films)) {
    const v=videos.results.find(x=>x.id===videoId);
    if (!v || v.license!==2) throw new Error('Video license changed');
    const temp=path.join(os.tmpdir(),`rehaab-video-${videoId}-${Date.now()}.mov`);
    try {
      await download(v.video,temp);
      fs.mkdirSync('media/videos',{recursive:true});
      execFileSync('ffmpeg',['-y','-loglevel','error','-i',temp,'-an','-vf','scale=640:-2','-c:v','libx264','-crf','27','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',`media/videos/${id}.mp4`]);
      execFileSync('ffmpeg',['-y','-loglevel','error','-ss','1','-i',temp,'-frames:v','1','-vf','scale=640:-2',`media/videos/${id}.jpg`]);
      metadata[id]={...metadata[id],video:`media/videos/${id}.mp4`,poster:`media/videos/${id}.jpg`,credit:'Goulart · wger · CC BY-SA 4.0'};
      sources.push({exercise:id,videoId,source:v.video,author:v.license_author,license:'https://creativecommons.org/licenses/by-sa/4.0/',changes:'Audio removed; scaled to 640px; transcoded to H.264; JPEG poster extracted.'});
      console.log('Video ready:',id);
    } finally {if(fs.existsSync(temp))fs.unlinkSync(temp);}
  }
  fs.writeFileSync('exercise-media.js','window.RehaabMedia = '+JSON.stringify(metadata,null,2)+';\n');
  fs.writeFileSync('media/video-credits.json',JSON.stringify(sources,null,2));
  console.log(Object.keys(metadata).length,'illustrated exercises');
})().catch(e=>{console.error(e);process.exitCode=1;});

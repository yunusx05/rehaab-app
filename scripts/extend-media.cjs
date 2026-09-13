/* Reproducible, attributed additions. No generated or mismatched exercise footage. */
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const vm = require('node:vm');
async function download(url,file) {
  const response=await fetch(url);if(!response.ok)throw Error(`${response.status}: ${url}`);
  fs.mkdirSync(require('node:path').dirname(file),{recursive:true});
  fs.writeFileSync(file,Buffer.from(await response.arrayBuffer()));
}
(async()=>{
  const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('exercise-media.js','utf8'),sandbox);
  const media=sandbox.window.RehaabMedia;
  const catalog=await (await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json')).json();
  const wanted={'db-squat':'Dumbbell_Squat','bb-squat':'Barbell_Full_Squat','rdl':'Romanian_Deadlift_With_Dumbbells','carry':'Farmers_Walk','overhead-triceps':'Standing_Dumbbell_Triceps_Extension','dips':'Bench_Dips','kb-swing':'Two-Arm_Kettlebell_Swing','rope':'Rope_Jumping','bike':'Bicycling_Stationary','bike-interval':'Bicycling_Stationary','rower':'Rowing_Stationary','db-lunge':'Dumbbell_Rear_Lunge','hip-flexor':'Kneeling_Hip_Flexor','hamstring':'90_90_Hamstring','run':'Running,_Treadmill','calf':'Standing_Calf_Raises'};
  for(const [id,folder] of Object.entries(wanted)){
    const entry=catalog.find(e=>e.id===folder);if(!entry){console.log('No exact source:',id);continue;}
    if(id==='run'||id==='calf')continue; // Keep outdoor / bodyweight prescriptions distinct from equipment variants.
    for(const n of [0,1])await download(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${folder}/${n}.jpg`,`media/${folder}/${n}.jpg`);
    media[id]={...media[id],frames:folder,muscles:entry.primaryMuscles};console.log('Positions:',id);
  }
  const videos=await (await fetch('https://wger.de/api/v2/video/?limit=200')).json();
  const credits=JSON.parse(fs.readFileSync('media/video-credits.json','utf8'));
  for(const [id,videoId] of Object.entries({pullup:71,'overhead-triceps':57,rdl:3})){
    const v=videos.results.find(x=>x.id===videoId);if(!v||v.license!==2)throw Error('License mismatch');
    const temp=`test-results/source-${videoId}.mov`;await download(v.video,temp);
    execFileSync('ffmpeg',['-y','-loglevel','error','-i',temp,'-an','-vf','scale=640:-2','-c:v','libx264','-crf','27','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',`media/videos/${id}.mp4`]);
    execFileSync('ffmpeg',['-y','-loglevel','error','-ss','2','-i',temp,'-frames:v','1','-vf','scale=640:-2',`media/videos/${id}.jpg`]);
    media[id]={...media[id],video:`media/videos/${id}.mp4`,poster:`media/videos/${id}.jpg`,credit:'Goulart · wger · CC BY-SA 4.0'};
    if(!credits.some(x=>x.exercise===id))credits.push({exercise:id,videoId,source:v.video,author:v.license_author,license:'https://creativecommons.org/licenses/by-sa/4.0/',changes:'Audio removed, 640px H.264 transcode, JPEG poster.'});
    console.log('Video:',id);
  }
  fs.writeFileSync('exercise-media.js','window.RehaabMedia = '+JSON.stringify(media,null,2)+';\n');
  fs.writeFileSync('media/video-credits.json',JSON.stringify(credits,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});

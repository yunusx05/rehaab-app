// Découpe un extrait de match pour le QI vidéo : node scripts/cut-clip.cjs <source.mp4> <id> <début s> <fin s>
// → clips/<id>.mp4 (H.264 720p max, lisible partout, images clés rapprochées pour le ralenti) et clips/<id>.webp (affiche).
// Les instants pause/fin de l'extrait deviennent relatifs au début : pause - début, fin - début.
const {execFileSync}=require('child_process'),fs=require('fs'),path=require('path');
const [source,id,from,to]=process.argv.slice(2);
if(!source||!/^[a-z0-9-]+$/.test(id||'')||!(Number(from)<Number(to))) { console.error('Usage : node scripts/cut-clip.cjs <source.mp4> <id> <début> <fin>'); process.exit(1); }
const dir=path.join(__dirname,'..','clips');fs.mkdirSync(dir,{recursive:true});
const mp4=path.join(dir,`${id}.mp4`),poster=path.join(dir,`${id}.webp`);
execFileSync('ffmpeg',['-y','-loglevel','error','-ss',String(from),'-i',source,'-t',String(to-from),
  '-vf','scale=-2:min(720\\,ih)','-c:v','libx264','-profile:v','main','-preset','slow','-crf','30','-g','30','-pix_fmt','yuv420p',
  '-c:a','aac','-b:a','80k','-ac','1','-movflags','+faststart',mp4]);
execFileSync('ffmpeg',['-y','-loglevel','error','-i',mp4,'-frames:v','1','-vf','scale=640:-2','-q:v','70',poster]);
console.log(`${path.relative(process.cwd(),mp4)} ${(fs.statSync(mp4).size/1e6).toFixed(2)} Mo`);

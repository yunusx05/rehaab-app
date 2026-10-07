// Planche de contrôle des démos YouTube : 6 images (1 par seconde) par exercice, le nom de l'exercice à gauche.
// Usage : node scripts/yt-contact-sheet.cjs <sortie.png> [id ...]
const {execFileSync}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const [outFile,...only]=process.argv.slice(2);
const dir=path.join(__dirname,'..','media','videos','yt');
const ids=only.length?only:fs.readdirSync(dir).filter(f=>f.endsWith('.mp4')).map(f=>f.slice(0,-4)).sort();
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sheet-'));
const rows=ids.map((id,i)=>{const row=path.join(tmp,`${i}.png`);
  execFileSync('ffmpeg',['-y','-loglevel','error','-i',path.join(dir,`${id}.mp4`),'-vf',`fps=1,scale=-2:150,pad=267:150:(ow-iw)/2:0:black,tile=6x1,pad=iw+220:ih:220:0:0x202020,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='${id}':x=10:y=65:fontsize=22:fontcolor=white`,'-frames:v','1',row]);return row;});
const inputs=rows.flatMap(r=>['-i',r]);
execFileSync('ffmpeg',['-y','-loglevel','error',...inputs,'-filter_complex',rows.length>1?`vstack=inputs=${rows.length}`:'null',outFile]);
console.log(outFile);

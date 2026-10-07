// Branche les démos YouTube (scripts/yt-picks.json) dans exercise-media.js et le précache de sw.js.
// Usage : node scripts/install-yt-demos.cjs
// Une démo marquée "refused": true dans yt-picks.json est retirée : l'exercice revient à ses photos ou à son illustration.
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),picks=JSON.parse(fs.readFileSync(path.join(__dirname,'yt-picks.json'),'utf8'));
const mediaFile=path.join(root,'exercise-media.js');
global.window={};require(mediaFile);const media=global.window.RehaabMedia;
const installed=[],removed=[];
for(const [id,p] of Object.entries(picks)){
  const mp4=`media/videos/yt/${id}.mp4`,poster=`media/videos/yt/${id}.webp`;
  const current=media[id]||{};
  if(p.refused||!p.videoId||!fs.existsSync(path.join(root,mp4))){
    if(current.video===mp4){const {video,poster:_,credit,source,...rest}=current;media[id]=rest;removed.push(id);}
    continue;
  }
  media[id]={...current,video:mp4,poster,credit:`YouTube · ${p.title}`,source:`https://www.youtube.com/watch?v=${p.videoId}&t=${p.start}s`};
  installed.push(id);
}
fs.writeFileSync(mediaFile,'window.RehaabMedia = '+JSON.stringify(media,null,2)+';\n');
// Précache en arrière-plan : les démos restent disponibles hors connexion après la première ouverture.
const swFile=path.join(root,'sw.js');let sw=fs.readFileSync(swFile,'utf8');
const from=sw.indexOf('const PRECACHE_MEDIA = ['),end=sw.indexOf('\n];',from);
let list=sw.slice(from,end).split('\n').slice(1).map(l=>l.trim().replace(/,$/,'')).filter(Boolean);
list=list.filter(l=>!/media\/videos\/yt\//.test(l));
installed.forEach(id=>list.push(`'./media/videos/yt/${id}.mp4'`,`'./media/videos/yt/${id}.webp'`));
sw=sw.slice(0,from)+'const PRECACHE_MEDIA = [\n'+list.map(l=>'  '+l).join(',\n')+sw.slice(end);
fs.writeFileSync(swFile,sw);
console.log(`${installed.length} démos branchées, ${removed.length} retirées${removed.length?' : '+removed.join(' '):''}`);

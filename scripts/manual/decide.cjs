// node decide.cjs <scoutDir> id=idx@start ... | id=skip  → decisions.json (choix) et <id>.skip (candidates écartées)
const fs=require('fs'),path=require('path');const [dir,...args]=process.argv.slice(2);
const f=path.join(dir,'..','decisions.json');const dec=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):{};
for(const a of args){const [id,v]=a.split('=');const meta=JSON.parse(fs.readFileSync(path.join(dir,id+'.json'),'utf8'));
  if(v==='skip'){const sf=path.join(dir,id+'.skip');const old=fs.existsSync(sf)?JSON.parse(fs.readFileSync(sf,'utf8')):[];
    fs.writeFileSync(sf,JSON.stringify([...old,...meta.map(m=>m.videoId)]));
    for(const m of meta){try{fs.unlinkSync(path.join(dir,`${id}-${meta.indexOf(m)}.mp4`))}catch{}}
    fs.unlinkSync(path.join(dir,id+'.json'));fs.unlinkSync(path.join(dir,id+'.png'));console.log(id,'écartées');continue;}
  const [i,s]=v.split('@');const m=meta[Number(i)];dec[id]={videoId:m.videoId,start:Number(s),title:m.title,duration:m.duration};console.log(id,'←',m.videoId,'@'+s);}
fs.writeFileSync(f,JSON.stringify(dec,null,1));

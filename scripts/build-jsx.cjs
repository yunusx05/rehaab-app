/* Compile les .jsx une fois pour toutes : le navigateur ne télécharge plus Babel (~3 Mo) ni ne recompile au démarrage.
   Usage : node scripts/build-jsx.cjs        → écrit compiled/*.js
           node scripts/build-jsx.cjs --check → échoue si compiled/ n'est pas à jour */
const fs=require('fs'),path=require('path');
const Babel=require('../vendor/babel.min.js');
const root=path.join(__dirname,'..'),out=path.join(root,'compiled'),check=process.argv.includes('--check');
const files=fs.readdirSync(root).filter(f=>f.endsWith('.jsx'));
if(!check)fs.mkdirSync(out,{recursive:true});
let stale=[];
for(const file of files){
  const code=Babel.transform(fs.readFileSync(path.join(root,file),'utf8'),{presets:['react'],filename:file,sourceType:'script',compact:false}).code;
  const target=path.join(out,file.replace(/\.jsx$/,'.js'));
  if(check){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==code)stale.push(file);}
  else fs.writeFileSync(target,code);
}
if(check&&stale.length){console.error('compiled/ obsolète, lance npm run build : '+stale.join(', '));process.exit(1);}
console.log(check?'compiled/ à jour.':`${files.length} fichiers compilés dans compiled/.`);

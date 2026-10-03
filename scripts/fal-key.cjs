/* Clé fal.ai des scripts médias : variable FAL_KEY d'abord, sinon le .env de la skill « generate » (GENERATE_SKILL_DIR pour un autre emplacement). */
const fs=require('fs'),path=require('path'),os=require('os');
const skillDir=process.env.GENERATE_SKILL_DIR||path.join(os.homedir(),'.claude/skills/generate');
function falKey(){
  if(process.env.FAL_KEY)return process.env.FAL_KEY.trim();
  let text='';try{text=fs.readFileSync(path.join(skillDir,'.env'),'utf8');}catch(e){}
  const key=text.match(/^FAL_KEY=(.*)$/m)?.[1].trim().replace(/^['"]|['"]$/g,'');
  if(!key)throw Error('FAL_KEY absente : définis la variable FAL_KEY ou GENERATE_SKILL_DIR.');
  return key;
}
// Dossier de sortie des images générées (même variable que gemini-catalogue.cjs).
const generationsDir=process.env.REHAAB_GENERATIONS||path.join(os.homedir(),"Desktop/WORKS/generation d'image IA");
module.exports={falKey,skillDir,generationsDir};

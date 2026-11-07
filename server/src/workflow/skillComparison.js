const Topic=require('../models/Topic');
const catalog=require('../../../shared/skill-catalog.json'),aliases=catalog.aliases;
const clean=v=>v.normalize('NFC').trim().replace(/\s+/g,' ').toLowerCase();
const normalize=values=>[...new Set((values||[]).filter(v=>typeof v==='string').map(clean).filter(Boolean).map(v=>aliases[v]||v))];
function compare(studentSkills,requiredSkills){
 const own=new Set(normalize(studentSkills)),required=normalize(requiredSkills);
 const matched=required.filter(s=>own.has(s)),missing=required.filter(s=>!own.has(s));
 const exact=[],equivalent=[],related=[];
 for(const target of required){
  const sources=(studentSkills||[]).filter(s=>typeof s==='string'&&normalize([s])[0]===target),literal=(requiredSkills||[]).find(s=>typeof s==='string'&&normalize([s])[0]===target);
  const same=sources.find(s=>clean(s)===clean(literal));
  if(same)exact.push({required:literal,declared:same,canonical:target});
  else if(sources.length)equivalent.push({required:literal,declared:sources[0],canonical:target});
  else for(const source of own)if(catalog.related.some(([a,b])=>(a===source&&b===target)||(b===source&&a===target)))related.push({required:target,declared:source});
 }
 return {required_skills:required,matched_skills:matched,missing_required_skills:missing,exact_matches:exact,equivalent_matches:equivalent,related_matches:related,no_direct_evidence_skills:missing,skill_catalog_version:catalog.version,skill_match_count:matched.length,required_skill_count:required.length,requirements_declared:required.length>0,skill_coverage_percent:required.length?Math.round(matched.length/required.length*10000)/100:null,assessment_basis:'declared-skills-not-verified-proficiency'};
}
async function requirements(opportunities){
 const topics=await Topic.find({_id:{$in:opportunities.map(o=>o.topicId)}}).select('companyUserId requiredSkills').lean();
 return new Map(opportunities.map(o=>{const t=topics.find(t=>String(t._id)===String(o.topicId)&&String(t.companyUserId)===String(o.companyUserId));return [String(o._id),t?.requiredSkills||[]];}));
}
module.exports={compare,requirements,normalize};

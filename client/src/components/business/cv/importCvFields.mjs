const normalize=value=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const sections={
  summary:['muc tieu','muc tieu nghe nghiep','muc tieu va dinh huong','tom tat','tom tat cv','gioi thieu','summary','profile','objective','career objective'],
  education:['hoc van','education'],
  skills:['ky nang','ky nang chuyen mon','ky nang ky thuat','skills','technical skills'],
  experience:['kinh nghiem','kinh nghiem lam viec','experience','work experience','projects','du an','du an hoc tap va vai tro'],
};
const fieldsForHeading=new Map(Object.entries(sections).flatMap(([field,headings])=>headings.map(h=>[h,field])));
const boundaries=['ho so thuc tap','curriculum vitae','cv','lien he','contact','chung chi','certifications','nguoi tham chieu','references','so thich','interests','phoi hop trach nhiem va cach giai quyet kho khan','thoi gian va hinh thuc thuc tap','gioi han va phan can hoc them'];
export function importCvFields(text) {
  if(typeof text!=='string'||!text.trim())return {};
  const lines=text.replace(/\r/g,'').split('\n'),parts={},result={};let field=null;
  for(const raw of lines){
    const line=raw.trim().replace(/^#{1,6}\s*/,''),heading=normalize(line.replace(/:$/,''));
    if(fieldsForHeading.has(heading)){field=fieldsForHeading.get(heading);parts[field]??=[];continue;}
    if(boundaries.includes(heading)||/^#{1,6}\s/.test(raw)){field=null;continue;}
    if(field&&line)parts[field].push(line);
  }
  for(const key of ['summary','education','experience'])if(parts[key]?.length)result[key]=parts[key].join('\n').slice(0,15000);
  // Only parse explicit skill lists; narrative sentences are not skill evidence.
  if(parts.skills){
    const values=parts.skills.filter(line=>!line.includes(':')&&!/[.!?]\s/.test(line)).flatMap(line=>line.replace(/^[-•]\s*/,'').replace(/\.$/,'').split(/[,;|•]/)).map(s=>s.trim()).filter(s=>s&&s.length<=80);
    if(values.length)result.skills=[...new Set(values)].slice(0,100);
  }
  const university=lines.find(line=>/^\s*(?:trường đại học|trường|university)\s*:/iu.test(line));
  if(university)result.university=university.replace(/^[^:]+:\s*/,'').trim().slice(0,200);
  // A /10 result is deliberately not converted into the /4 field.
  const gpa=text.match(/\bGPA\s*(?::|=|minh họa)?\s*([0-4](?:[.,]\d+)?)\s*\/\s*4\b/iu);
  if(gpa){const value=Number(gpa[1].replace(',','.'));if(value>=0&&value<=4)result.gpa=value;}
  return result;
}

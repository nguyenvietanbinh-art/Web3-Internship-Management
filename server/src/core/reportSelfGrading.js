const {InternshipBatch}=require('../models/BusinessModels'),{HttpError}=require('../utils/http'),v=require('./shared');
async function validate(input,assignment){
 v.keys(input,['rubricVersion','scores']);const batch=await InternshipBatch.findById(assignment.batchId).lean(),rubric=batch?.reportRubric||require('../../../shared/report-rubric.json');
 if(input.rubricVersion!==rubric.version)throw new HttpError(409,'Rubric đã thay đổi; tải lại trước khi tự đánh giá');
 if(!Array.isArray(input.scores)||input.scores.length!==rubric.criteria.length)throw new HttpError(400,'Tự đánh giá cần đủ tiêu chí rubric');
 const seen=new Set(),scores=input.scores.map(row=>{v.keys(row,['id','score']);const c=rubric.criteria.find(c=>c.id===row.id);if(!c||seen.has(c.id)||typeof row.score!=='number'||!Number.isFinite(row.score)||row.score<0||row.score>c.max||Math.abs(row.score*100-Math.round(row.score*100))>1e-8)throw new HttpError(400,'Điểm tự đánh giá không hợp lệ');seen.add(c.id);return{id:c.id,score:row.score,max:c.max};});
 return{rubricVersion:rubric.version,scores,total:Math.round(scores.reduce((n,c)=>n+c.score,0)*100)/100,submittedAt:new Date(),source:'student-self-assessment'};
}
module.exports={validate};

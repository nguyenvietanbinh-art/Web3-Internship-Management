const {HttpError}=require('../utils/http');
const group=report=>({assignmentId:report.assignmentId,kind:report.kind,...(report.kind==='weekly'&&report.weekNumber?{weekNumber:report.weekNumber}:{})});
const currentFilter=report=>report.kind==='weekly'&&report.weekNumber?{}:{current:true};
async function assertCurrent(Report,report){const latest=await Report.findOne(group(report)).sort({version:-1});if(!latest||String(latest._id)!==String(report._id))throw new HttpError(409,'Cần dùng phiên bản mới nhất của báo cáo');}
module.exports={group,currentFilter,assertCurrent};

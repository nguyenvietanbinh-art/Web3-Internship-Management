// Read-only metrics from the same role scope as the workflow screens.
const Assignment=require('../models/Assignment'),User=require('../models/User'),Task=require('../models/Task'),JD=require('../models/JD');
const {Report,WorkSession}=require('../models/BusinessModels'),{Application}=require('./models'),{ChainOperation}=require('../models/Web3Models');
async function metrics(user){
 const rows=await Assignment.find(require('../core/placementPolicy').scope(user)).select('_id lifecycle').lean(),ids=rows.map(a=>a._id),scope={assignmentId:{$in:ids}};
 const applications=user.role==='admin'?{}:user.role==='student'?{studentUserId:user._id}:user.role==='company'?{companyUserId:user._id}:{studentUserId:{$in:[]}};
 const [appCount,tasks,reports,attendance,minutes,certificates,jds]=await Promise.all([Application.countDocuments(applications),Task.countDocuments(scope),Report.countDocuments(user.role==='company'?{...scope,kind:'final',current:true}:scope),WorkSession.countDocuments(scope),WorkSession.aggregate([{$match:{...scope,state:'approved'}},{$group:{_id:null,total:{$sum:'$minutes'}}}]),ChainOperation.countDocuments({...scope,kind:'mint',state:'confirmed'}),user.role==='admin'?JD.countDocuments():user.role==='company'?JD.countDocuments({companyUserId:user._id}):0]);
 const reviewRows=await Report.aggregate([{$match:scope},{$group:{_id:null,total:{$sum:{$size:{$ifNull:['$reviews',[]]}}}}}]);
 const result={reviews:reviewRows[0]?.total||0,placements:rows.length,activePlacements:rows.filter(r=>r.lifecycle==='active').length,completedPlacements:rows.filter(r=>r.lifecycle==='completed').length,applications:appCount,tasks,reports,attendance,approvedMinutes:minutes[0]?.total||0,certificates,jds};
 if(user.role==='admin'){const counts=await User.aggregate([{$group:{_id:'$role',count:{$sum:1}}}]);for(const [role,key]of [['student','students'],['company','companies'],['mentor','mentors'],['admin','admins']])result[key]=counts.find(r=>r._id===role)?.count||0;}
 return result;
}
module.exports={metrics};

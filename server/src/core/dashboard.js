const identity=require('../services/businessIdentity');
const router=require('express').Router();const Assignment=require('../models/Assignment'),Task=require('../models/Task'),WorkLog=require('../models/WorkLog');
const {Application,WorkSession,Report,InternshipBatch}=require('../models/BusinessModels');const User=require('../models/User');const {asyncHandler}=require('../utils/http'),policy=require('./placementPolicy');
router.get('/dashboard',asyncHandler(async(req,res)=>{
 const assignments=await Assignment.find(policy.scope(req.user)).select('_id lifecycle batchId kpiScore').lean(),ids=assignments.map(a=>a._id),scope={assignmentId:{$in:ids}};
 const appFilter=req.user.role==='admin'?{}:req.user.role==='company'?identity.owned(req.user,'companyUserId','companyWallet'):req.user.role==='student'?identity.owned(req.user,'studentUserId','studentWallet'):{_id:{$in:[]}};
 const [applications,tasks,doneTasks,logs,reports,pendingReports,minutes,openSessions,finalResults]=await Promise.all([
  Application.countDocuments(appFilter),Task.countDocuments(scope),Task.countDocuments({...scope,status:'done'}),WorkLog.countDocuments(scope),Report.countDocuments(scope),Report.countDocuments({...scope,current:true,state:{$in:['submitted','reviewed']}}),WorkSession.aggregate([{$match:{...scope,state:'approved'}},{$group:{_id:null,total:{$sum:'$minutes'}}}]),WorkSession.countDocuments({...scope,state:'open'}),Report.aggregate([{$match:{...scope,kind:'final',state:'approved',current:true}},{$group:{_id:null,count:{$sum:1},score:{$avg:'$finalScore'}}}]),
 ]);
 const totals={placements:assignments.length,activePlacements:assignments.filter(a=>a.lifecycle==='active').length,applications,tasks,doneTasks,worklogs:logs,reports,pendingReports,approvedMinutes:minutes[0]?.total||0,openSessions,approvedFinalReports:finalResults[0]?.count||0,averageFinalScore:finalResults[0]?.score??null};
 const graded=assignments.filter(a=>a.lifecycle==='completed'&&Number.isFinite(a.kpiScore));totals.averageKpiScore=graded.length?graded.reduce((n,a)=>n+a.kpiScore,0)/graded.length:null;
 if(req.user.role==='admin'){totals.accounts=await User.countDocuments();totals.companies=await User.countDocuments({role:'company'});totals.students=await User.countDocuments({role:'student'});totals.mentors=await User.countDocuments({role:'mentor'});totals.batches=await InternshipBatch.countDocuments();}
 res.json({scope:req.user.role,timezone:'UTC',totals});
}));
module.exports=router;

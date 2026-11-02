const router=require('express').Router(),Assignment=require('../models/Assignment');
const {requireRole}=require('../middleware/auth');const {asyncHandler,HttpError}=require('../utils/http');const v=require('./shared'),policy=require('./placementPolicy');
router.get('/placements/:id',asyncHandler(async(req,res)=>res.json(await policy.load(req.user,req.params.id))));
router.post('/placements/:id/kpis/:index/submit',requireRole('student'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['content','version']);const doc=await policy.load(req.user,req.params.id,{active:true}),index=Number(req.params.index);v.integer(index,0,(doc.kpis?.length||0)-1,'Mốc KPI');const kpi=doc.kpis[index];
 if(!['pending','rejected'].includes(kpi.status))throw new HttpError(409,'KPI đã nộp hoặc đã duyệt');
 const content=v.text(req.body.content,'Nội dung KPI',{required:true,max:20000}),set={};for(const[k,value]of Object.entries({content,status:'submitted',score:null,feedback:'',submittedAt:new Date(),submittedLate:new Date()>kpi.deadline}))set[`kpis.${index}.${k}`]=value;
 res.json(await v.updateVersion(Assignment,doc,req.body.version,set,v.event(req.user,'kpi.submitted',{index,previousContent:kpi.content,previousStatus:kpi.status,submittedLate:set[`kpis.${index}.submittedLate`]})));
}));
router.post('/placements/:id/kpis/:index/evaluate',requireRole('company','mentor'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['status','score','feedback','version']);const doc=await policy.load(req.user,req.params.id),index=Number(req.params.index);v.integer(index,0,(doc.kpis?.length||0)-1,'Mốc KPI');if(doc.lifecycle!=='active')throw new HttpError(409,'Phân công không hoạt động');const kpi=doc.kpis[index];if(kpi.status!=='submitted')throw new HttpError(409,'Chỉ chấm KPI vừa nộp');
 const status=v.choice(req.body.status,['approved','rejected'],'Trạng thái'),score=req.body.score;if(typeof score!=='number'||!Number.isFinite(score)||score<0||score>100)throw new HttpError(400,'Điểm KPI phải từ0 đến100');
 const feedback=v.text(req.body.feedback,'Nhận xét',{required:true,max:5000}),set={[`kpis.${index}.status`]:status,[`kpis.${index}.score`]:score,[`kpis.${index}.feedback`]:feedback,[`kpis.${index}.evaluatedAt`]:new Date()};
 const all=doc.kpis.map((k,i)=>i===index?{status,score,weightPercent:k.weightPercent}:k);set.kpiScore=all.every(k=>k.status==='approved')?Math.round(all.reduce((n,k)=>n+k.score*k.weightPercent/100,0)):null;
 res.json(await v.updateVersion(Assignment,doc,req.body.version,set,v.event(req.user,'kpi.evaluated',{index,status,score,feedback})));
}));
module.exports=router;

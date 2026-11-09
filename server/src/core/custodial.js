const router=require('express').Router(),{asyncHandler,HttpError}=require('../utils/http'),{requireRole}=require('../middleware/auth'),v=require('./shared'),runtime=require('../services/custodialRuntime');
router.get('/custody/me',requireRole('student'),asyncHandler(async(req,res)=>res.json({recipient:await runtime.service().recipients.read(String(req.user._id))})));
router.post('/custody/students/:id/recipient',requireRole('admin'),asyncHandler(async(req,res)=>{v.keys(req.body,[]);res.json({recipient:await runtime.service().recipients.provision(v.id(req.params.id))});}));
router.post('/custody/placements/:id/retry',requireRole('admin'),asyncHandler(async(req,res)=>{
 v.keys(req.body,[]);const a=await require('./placementPolicy').load(req.user,req.params.id),{Report}=require('../models/BusinessModels');
 if(!await Report.exists({assignmentId:a._id,kind:'final',current:true,state:'approved','certificateRequest.enabled':true}))throw new HttpError(409,'Hồ sơ chưa được kích hoạt cấp tự động','CERTIFICATE_NOT_ACTIVATED');
 const job=await runtime.service().queue.enqueue(String(a._id));res.json({id:job._id,state:job.state});
}));
module.exports=router;

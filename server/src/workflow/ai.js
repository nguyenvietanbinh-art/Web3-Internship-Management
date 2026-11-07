const router=require('express').Router(),{requireRole}=require('../middleware/auth'),{asyncHandler,HttpError}=require('../utils/http');
const {CV}=require('../models/BusinessModels'),{Application,Opportunity}=require('./models'),svc=require('./service'),q=require('./queries'),v=require('../core/shared'),nlp=require('../services/nlpClient');
const cvText=cv=>[cv?.title,cv?.summary,cv?.education,cv?.experience,cv?.extractedText].filter(Boolean).join('\n').slice(0,50000);
const options=body=>({engine:v.choice(body.engine||'sbert',['sbert','tfidf','compare'],'Engine'),top_k:v.integer(body.topK??5,1,20,'Top K')});
const skillComparison=require('./skillComparison');
router.post('/school/ai/recommend-placement',requireRole('admin'),asyncHandler(async(req,res)=>res.json(await require('./allocationSuggestions').suggest(req.user,req.body))));
router.post('/school/ai/match',requireRole('student'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['enrollmentId','engine','topK']);const opts=options(req.body),catalog=await q.opportunities(req.user,v.id(req.body.enrollmentId),{limit:'50'}),cv=await CV.findOne({ownerUserId:req.user._id}).lean();if(!cv||!cvText(cv).trim())throw new HttpError(409,'Hãy lưu CV trước khi phân tích');if(catalog.hasAdmission)return res.json({items:[],scope:'own-eligible-period',catalog_total:0,candidate_count:0,engine:opts.engine,inference_performed:false,reason:'ALREADY_ADMITTED'});
 if(!catalog.items.length)return res.json({items:[],scope:'own-eligible-period',catalog_total:catalog.total,candidate_count:0,engine:opts.engine,inference_performed:false,reason:'NO_AVAILABLE_OPPORTUNITIES'});
 if(![cv.summary,cv.education,cv.experience,cv.extractedText].some(s=>typeof s==='string'&&s.trim())&&!cv.skills?.length)throw new HttpError(409,'CV chưa có nội dung chuyên môn hoặc kỹ năng để đối chiếu');
 const requirements=await skillComparison.requirements(catalog.items),candidates=catalog.items.filter(o=>o.description?.trim()||requirements.get(String(o._id))?.length);
 const payload={query:{id:String(cv._id),text:cvText(cv),skills:cv.skills||[]},candidates:candidates.map(o=>({id:String(o._id),text:o.title+'\n'+(o.description||''),skills:requirements.get(String(o._id))}))};
 const fingerprint=require('crypto').createHash('sha256').update(JSON.stringify(payload)).digest('hex');
 let data;
 if(opts.engine==='compare'){
  const tfidf=await nlp.request('/rank',{...payload,engine:'tfidf',top_k:20,include_all_scores:true}),sbert=await nlp.request('/rank',{...payload,engine:'sbert',top_k:20,include_all_scores:true});
  if(tfidf.candidate_count!==sbert.candidate_count)throw new HttpError(502,'Hai phương pháp không nhận cùng tập đề tài');
  const visible={...sbert};delete visible.all_results;
  data={...visible,engine:'compare',results:require('./matchingComparison').combine(tfidf,sbert,opts.top_k),comparison:{requested_top_k:opts.top_k,ranked_pool_limit:Math.min(tfidf.all_results?.length??tfidf.results.length,sbert.all_results?.length??sbert.results.length),tfidf_model:tfidf.model,sbert_model:sbert.model,tfidf_elapsed_ms:tfidf.elapsed_ms,sbert_elapsed_ms:sbert.elapsed_ms},elapsed_ms:tfidf.elapsed_ms+sbert.elapsed_ms};
 }else data=await nlp.request('/rank',{...payload,...opts});
 const duplicateKey=o=>require('crypto').createHash('sha256').update(JSON.stringify([(o.description||'').normalize('NFC').replace(/\s+/g,' ').trim().toLowerCase(),skillComparison.normalize(requirements.get(String(o._id))).sort()])).digest('hex');
 res.json({...data,input_fingerprint:fingerprint,cv_skills:cv.skills||[],catalog_total:catalog.total,catalog_limit:50,excluded_insufficient_job_content:catalog.items.length-candidates.length,scope:'own-eligible-period/available-opportunities',items:data.results.map((r,i)=>{const o=candidates.find(o=>String(o._id)===r.id);if(!o)throw new HttpError(502,'Kết quả không thuộc phạm vi đề tài đã gửi');return {...r,rank:opts.engine==='compare'?null:i+1,title:o.title,company_name:o.companyName,description:o.description,duplicate_content_count:candidates.filter(candidate=>duplicateKey(candidate)===duplicateKey(o)).length,...skillComparison.compare(cv.skills,requirements.get(r.id))};})});
}));
router.post('/school/ai/rank-applicants',requireRole('company'),(_req,res)=>res.status(403).json({message:'Chức năng gợi ý ứng viên đã ngừng cung cấp cho doanh nghiệp',code:'FEATURE_NOT_AVAILABLE'}));
module.exports=router;

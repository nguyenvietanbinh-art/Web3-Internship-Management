const {hash,fileVersion,attachmentText}=require('./taskEvaluationService');
async function collect(report,assignment,ctx){
 const documents=[],references=[],errors=[];
 const add=(source,text,reference)=>{if(!text?.trim())throw Error('Empty attachment');if(text.length>=20000)errors.push('Tài liệu vượt giới hạn đọc; cần xem bản đầy đủ.');documents.push({id:source,text:text.slice(0,20000)});references.push({source,...reference,readable:true});};
 for(const task of ctx.tasks.filter(t=>t.submission?.fileName&&(!report.taskIds?.length||report.taskIds.some(id=>String(id)===String(t._id))))){
  if(documents.length>=3){errors.push('Còn tệp nhiệm vụ vượt giới hạn 3 tài liệu/lần; cần xem thêm.');break;}
  try{
   const full=await fileVersion(task,{}),version=(task.submissionVersions||[]).find(r=>r.version===task.submissionVersion),bytes=full.submissionFileData;
   if(!version||!bytes||hash(bytes)!==version.sha256)throw Error('File version/hash mismatch');
   const confirmed=task.criteriaApprovedAt&&String(task.criteriaApprovedBy)===String(assignment.companyUserId)&&task.acceptanceCriteria?.length&&task.acceptanceCriteria.every(c=>(task.criterionReviews||[]).some(r=>r.criterionId===c.id&&r.state==='met'&&r.submissionVersion===task.submissionVersion&&r.criteriaVersion===task.criteriaVersion&&r.confirmedBy===String(assignment.companyUserId)));
   const parsed=await attachmentText(full);if(!parsed.length)throw Error('Unsupported/unreadable file');
   add('task-'+task._id+'-v'+task.submissionVersion,parsed[0].text,{type:'task-file',taskId:String(task._id),submissionVersion:task.submissionVersion,fileName:task.submission.fileName,sha256:version.sha256,hashVerified:true,companyConfirmed:Boolean(confirmed)});
  }catch{errors.push('Tệp nhiệm vụ '+task.title+' chưa đọc được hoặc hash/phiên bản không khớp; không tự cho 0 điểm.');}
 }
 for(const artifact of ctx.artifacts){
  if(documents.length>=3){errors.push('Còn tệp báo cáo vượt giới hạn 3 tài liệu/lần; cần xem thêm.');break;}
  try{const full=await require('../models/Web3Models').PrivateReportArtifact.findById(artifact._id).select('+envelope'),bytes=require('../services/privateIpfs').decrypt(full.envelope,report._id);if(hash(bytes)!==artifact.plaintextHash)throw Error('Hash mismatch');const kind=artifact.mime==='application/pdf'?'pdf':artifact.mime==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'?'docx':null;if(!kind)throw Error('Unsupported');const parsed=await require('../services/cvParser').parseCv(bytes,kind);add('artifact-'+artifact._id,parsed.text,{type:'report-file',artifactId:String(artifact._id),sha256:artifact.plaintextHash,hashVerified:true,companyConfirmed:false});}catch{errors.push('Tệp đính kèm báo cáo chưa đọc được hoặc chưa xác minh; cần mở kiểm tra.');}
 }
 return{documents,references,errors};
}
module.exports={collect};

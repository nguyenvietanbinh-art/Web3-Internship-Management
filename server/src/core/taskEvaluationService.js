const crypto=require('crypto'),v=require('./shared'),{HttpError}=require('../utils/http');
const hash=value=>crypto.createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
function criteriaInput(body){
 if(!Array.isArray(body.criteria)||body.criteria.length<1||body.criteria.length>10)throw new HttpError(400,'Cần từ 1 đến 10 tiêu chí nghiệm thu');
 const criteria=body.criteria.map((row,i)=>{
  v.keys(row,['id','title','description','weight','requiredProduct']);
  const id=row.id===undefined?'c'+(i+1):v.text(row.id,'Mã tiêu chí',{required:true,max:60});if(!/^[a-zA-Z0-9_-]+$/.test(id))throw new HttpError(400,'Mã tiêu chí không hợp lệ');
  return{id,title:v.text(row.title,'Tên tiêu chí',{required:true,max:200}),description:v.text(row.description,'Mô tả tiêu chí',{required:true,max:1500}),requiredProduct:v.text(row.requiredProduct,'Sản phẩm tiêu chí',{required:true,max:1000}),weight:v.integer(row.weight,1,1000,'Trọng số tiêu chí')};
 });
 if(new Set(criteria.map(c=>c.id)).size!==criteria.length)throw new HttpError(400,'Trùng mã tiêu chí');
 const list=(value,label)=>{const rows=v.list(value,label,20);if(!rows.length)throw new HttpError(400,'Cần '+label.toLowerCase());return rows;};
 return {objective:v.text(body.objective,'Mục tiêu',{required:true,max:2000}),workItems:list(body.workItems,'Danh sách công việc'),requiredProducts:list(body.requiredProducts,'Sản phẩm bắt buộc'),acceptanceCriteria:criteria,progressWeight:v.integer(body.progressWeight,1,1000,'Trọng số nhiệm vụ')};
}
function taskDefinition(body,assignment,user){
 const fields=criteriaInput(body),startDate=v.date(body.startDate,'Ngày bắt đầu');if(startDate<assignment.startDate||startDate>assignment.endDate||startDate>new Date(body.dueDate))throw new HttpError(400,'Ngày bắt đầu không thuộc thời gian công việc');
 return {...fields,startDate,criteriaVersion:1,confirmedProgress:0,criteriaApprovedBy:user.role==='company'?user._id:undefined,criteriaApprovedAt:user.role==='company'?new Date():undefined};
}
function requireCriteria(doc){if(!doc.acceptanceCriteria?.length||!doc.criteriaApprovedAt)throw new HttpError(409,'Doanh nghiệp cần bổ sung và xác nhận tiêu chí trước khi đánh giá tiến độ','TASK_CRITERIA_REQUIRED');}
function officialProgress(criteria,reviews){const sum=criteria.reduce((n,c)=>n+c.weight,0);if(!sum)return null;return Math.round(10000*criteria.filter(c=>reviews.some(r=>r.criterionId===c.id&&r.state==='met')).reduce((n,c)=>n+c.weight,0)/sum)/100;}
function submissionText(s){return [s.content,s.result&&'Kết quả: '+s.result,s.challenges&&'Khó khăn: '+s.challenges,s.solution&&'Giải pháp: '+s.solution].filter(Boolean).join('\n');}
async function attachmentText(doc){
 if(!doc.submission?.fileName||!doc.submissionFileData)return [];
 const ext=doc.submission.fileName.split('.').pop().toLowerCase(),buffer=doc.submissionFileData;let text='';
 if(ext==='txt')text=new TextDecoder('utf-8',{fatal:true}).decode(buffer);
 else if(['pdf','docx'].includes(ext)&&buffer.length<=2*1024*1024)text=(await require('../services/cvParser').parseCv(buffer,ext)).text;
 if(text.trim())return [{id:'attachment',text:text.slice(0,20000)}];return [];
}
async function fileVersion(doc,query){
 const Task=require('../models/Task'),file=await Task.findById(doc._id).select('+submissionFileData +submissionVersions.fileData').lean();
 if(query.submissionVersion!==undefined){if(typeof query.submissionVersion!=='string'||!/^\d+$/.test(query.submissionVersion))throw new HttpError(400,'Phiên bản bài nộp không hợp lệ');const version=Number(query.submissionVersion),row=file.submissionVersions?.find(r=>r.version===version);if(!row)throw new HttpError(404,'Không có phiên bản bài nộp');file.submission=row.submission;file.submissionFileData=row.fileData;}
 if(file.submissionFileData?._bsontype==='Binary')file.submissionFileData=Buffer.from(file.submissionFileData.value());
 return file;
}
module.exports={hash,criteriaInput,taskDefinition,requireCriteria,officialProgress,submissionText,attachmentText,fileVersion};

const mongoose = require('mongoose'), crypto = require('node:crypto');
const User = require('../models/User'), Student = require('../models/Student'), Topic = require('../models/Topic'), Assignment = require('../models/Assignment');
const { InternshipBatch: Batch, CV } = require('../models/BusinessModels');
const { Enrollment, Opportunity, Application, SupportPayment } = require('./models');
const { HttpError } = require('../utils/http');
const v = require('../core/shared'), clock = require('./clock');
const sid = value => String(value), same = (a,b) => a && b && sid(a) === sid(b);
const fail = (message, code='WORKFLOW_CONFLICT', status=409) => { throw new HttpError(status,message,code); };
const transaction = action => mongoose.connection.transaction(action, { readConcern: { level:'snapshot' }, writeConcern:{w:'majority'}, readPreference:'primary' });
const active = e => e.admission?.state === 'active';
const {quota,availableExpression}=require('./applicationQuota');
function version(doc,value) { v.integer(value,0,Number.MAX_SAFE_INTEGER,'Phiên bản');if(doc.__v!==value)fail('Dữ liệu đã thay đổi; vui lòng tải lại','STALE_VERSION'); }
async function enabled(id,role,session) { const u=await User.findOne({_id:id,role,disabled:{$ne:true}}).session(session);if(!u)fail('Tài khoản không còn hợp lệ','ACCOUNT_UNAVAILABLE');return u; }
async function batch(id,session,{window=false}={}) {
  const key=v.id(sid(id));
  const b=session?await Batch.findOneAndUpdate({_id:key},{$inc:{workflowRevision:1}},{new:true,session}):await Batch.findById(key);
  if(!b)fail('Không tìm thấy kỳ','NOT_FOUND',404);
  const now=clock.now();if(b.status!=='open'||now>=b.endDate)fail('Kỳ chưa mở hoặc đã kết thúc','BATCH_NOT_OPEN');
  if(window&&(!b.registrationOpensAt||!b.registrationClosesAt||now<b.registrationOpensAt||now>=b.registrationClosesAt))fail('Ngoài thời gian đăng ký của kỳ','REGISTRATION_CLOSED');return b;
}
async function enrollment(actor,id,session) {
  const e=await Enrollment.findOne({_id:v.id(sid(id)),...(actor.role==='student'?{studentUserId:actor._id}:{})}).session(session);
  if(!e)fail('Không có sinh viên–kỳ trong phạm vi','NOT_FOUND',404);if(!['admin','student'].includes(actor.role))fail('Không có quyền','FORBIDDEN_ROLE',403);
  if(e.eligibility!=='eligible')fail('Sinh viên không thuộc diện đang được tham gia','NOT_ELIGIBLE',403);await enabled(e.studentUserId,'student',session);return e;
}
function event(actor,action,data={}) { return v.event(actor,'school.'+action,data); }
function opportunityDto(o) { return {...o,remainingSlots:Math.max(0,o.capacity-o.confirmedCount)}; }
async function updateOpportunity(actor,id,input){return transaction(async s=>{
 const o=await Opportunity.findOne({_id:v.id(id),companyUserId:actor._id}).session(s);if(!o)fail('Cơ hội ngoài phạm vi','NOT_FOUND',404);
 version(o,input.version);const b=await batch(o.batchId,s);
 if(input.capacity!==undefined){const n=v.integer(input.capacity,1,1000,'Chỉ tiêu');if(n<o.confirmedCount)fail('Không giảm dưới số đã nhận');o.capacity=n;}
 const status=input.status===undefined?o.status:v.choice(input.status,['open','closed'],'Trạng thái');
 let reason='';if(o.status==='closed'&&status==='open'){
  reason=v.text(input.reason,'Lý do mở lại',{required:false,max:2000});
  const now=clock.now();if(o.confirmedCount>=o.capacity||now<b.registrationOpensAt||now>=b.registrationClosesAt)fail('Chỉ mở lại khi còn chỗ và trong thời gian ứng tuyển','REOPEN_NOT_ALLOWED');
  o.closureReason='';
 }else if(o.status==='open'&&status==='closed')o.closureReason='company_closed';
 o.status=status;
 if(input.schoolAllocationAllowed!==undefined){if(typeof input.schoolAllocationAllowed!=='boolean')fail('Giá trị không hợp lệ','INVALID_INPUT',422);o.schoolAllocationAllowed=input.schoolAllocationAllowed;}
 o.history.push(event(actor,'opportunity_updated',{reason,status,capacity:o.capacity}));await o.save({session:s});return opportunityDto(o.toObject());
});}
async function eligibleOpportunity(e,id,session) {
  const o=await Opportunity.findOne({_id:v.id(sid(id)),batchId:e.batchId,status:'open'}).session(session);if(!o)fail('Cơ hội không thuộc kỳ hoặc đã đóng','OPPORTUNITY_UNAVAILABLE');await enabled(o.companyUserId,'company',session);return o;
}
async function register(actor,id) {return transaction(async s=>{const e=await enrollment(actor,id,s);await batch(e.batchId,s,{window:true});if(!e.registeredAt){e.registeredAt=clock.now();e.history.push(event(actor,'registered'));await e.save({session:s});}return e;});}
async function apply(actor,id,input) {
 return transaction(async s=>{
  const e=await enrollment(actor,id,s);await batch(e.batchId,s,{window:true});if(!e.registeredAt)fail('Bạn cần đăng ký tham gia kỳ trước','NOT_REGISTERED');if(active(e))fail('Bạn đã nhận đề tài trong kỳ','ALREADY_ADMITTED');
  const opportunityId=v.id(input.opportunityId),prior=await Application.findOne({enrollmentId:e._id,opportunityId}).session(s);if(prior)fail('Đã ứng tuyển cơ hội này; hồ sơ rút/từ chối vẫn tính hạn mức','DUPLICATE_APPLICATION');
  const o=await eligibleOpportunity(e,opportunityId,s);if(o.confirmedCount>=o.capacity)fail('Đề tài đã hết chỗ','NO_SEATS');
  const cv=await CV.findOne({ownerUserId:actor._id}).select('+fileData').session(s);if(!cv)fail('Hãy lưu CV trước khi ứng tuyển','CV_REQUIRED');if(input.cvVersion!==undefined&&input.cvVersion!==cv.__v)fail('CV đã thay đổi','STALE_VERSION');
  const updated=await Enrollment.updateOne({_id:e._id,'admission.state':{$ne:'active'},usedOpportunities:{$ne:o._id},$expr:availableExpression},{$push:{usedOpportunities:o._id,history:event(actor,'application_submitted',{opportunityId:o._id})},$inc:{__v:1}},{session:s});
  if(updated.modifiedCount!==1)fail('Mỗi kỳ chỉ được ứng tuyển tối đa 3 đề tài; rút/từ chối không hoàn lượt','APPLICATION_LIMIT');
  const docs=await Application.create([{enrollmentId:e._id,studentUserId:actor._id,companyUserId:o.companyUserId,batchId:e.batchId,opportunityId:o._id,studentName:actor.name,title:o.title,companyName:o.companyName,
    cvSnapshot:{title:cv.title,summary:cv.summary,skills:cv.skills,education:cv.education,experience:cv.experience,gpa:cv.gpa,cvVersion:cv.__v},cvFileData:cv.fileData,cvMime:cv.mime,cvFileName:cv.fileName,message:v.text(input.message,'Nguyện vọng',{max:3000}),state:'dispatched',dispatch:{by:actor._id,at:clock.now(),revokedAt:null,version:1},history:[event(actor,'application_submitted'),event(actor,'application_sent_to_company',{companyUserId:o.companyUserId})]}],{session:s});
  return {application:docs[0],...quota({...e.toObject(),usedOpportunities:[...e.usedOpportunities,o._id]}),seatConsumed:false};
 });
}
async function dispatch(actor,id,input,revoke=false) {return transaction(async s=>{
 const a=await Application.findById(v.id(id)).session(s);if(!a)fail('Không tìm thấy hồ sơ','NOT_FOUND',404);version(a,input.version);await batch(a.batchId,s);
 if(revoke){if(!['dispatched','under_review','offered'].includes(a.state))fail('Hồ sơ không còn quyền chuyển');a.state='submitted';a.dispatch.revokedAt=clock.now();}
 else{if(a.state!=='submitted')fail('Chỉ chuyển hồ sơ đang chờ nhà trường');await enabled(a.companyUserId,'company',s);a.state='dispatched';a.dispatch={by:actor._id,at:clock.now(),revokedAt:null,version:(a.dispatch?.version||0)+1};}
 a.history.push(event(actor,revoke?'dispatch_revoked':'dispatched',{reason:v.text(input.reason,'Lý do',{required:false,max:2000})}));await a.save({session:s});return a;
});}
function companyGrant(actor) {return {companyUserId:actor._id,'dispatch.at':{$type:'date'},'dispatch.revokedAt':null,state:{$in:['dispatched','under_review','offered','confirmed']}};}
async function decision(actor,id,input) {return transaction(async s=>{
 const a=await Application.findOne({_id:v.id(id),...companyGrant(actor)}).session(s);if(!a)fail('Hồ sơ ngoài doanh nghiệp của bạn hoặc quyền xét đã bị thu hồi','NOT_FOUND',404);
 await enabled(a.studentUserId,'student',s);const e=await Enrollment.findById(a.enrollmentId).session(s);
 // A retry of the winning company's accept command must not consume another seat.
 if(a.state==='confirmed'&&e&&active(e)&&same(e.admission.applicationId,a._id)&&input.state==='offered')return a;
 version(a,input.version);await batch(a.batchId,s);
 if(!['dispatched','under_review','offered'].includes(a.state))fail('Hồ sơ đã có kết quả');const state=v.choice(input.state,['under_review','offered','rejected'],'Kết quả');
 if(!e||e.eligibility!=='eligible'||active(e))fail('Sinh viên không còn được xét hồ sơ này');
 a.decisionReason=v.text(input.reason,'Nhận xét',{required:false,max:3000});
 if(state==='offered'){const o=await eligibleOpportunity(e,a.opportunityId,s);await allocateInside(actor,e,o,s,a._id);a.state='confirmed';}
 else a.state=state;
 if(state==='rejected')a.dispatch.revokedAt=clock.now();a.history.push(event(actor,'application_decision',{state:a.state,requestedState:state,reason:a.decisionReason}));await a.save({session:s});return a;
});}
async function withdraw(actor,id,input) {return transaction(async s=>{
 const a=await Application.findOne({_id:v.id(id),studentUserId:actor._id}).session(s);if(!a)fail('Không tìm thấy hồ sơ','NOT_FOUND',404);if(a.state==='withdrawn')return a;version(a,input.version);if(!['submitted','dispatched','under_review','offered'].includes(a.state))fail('Không thể rút hồ sơ đã kết thúc');a.state='withdrawn';if(a.dispatch)a.dispatch.revokedAt=clock.now();a.history.push(event(actor,'withdrawn',{reason:v.text(input.reason,'Lý do',{required:false,max:2000})}));await a.save({session:s});return a;
});}
async function allocateInside(actor,e,o,s,applicationId=null) {
 if(active(e))fail('Sinh viên đã có đề tài trong kỳ','ALREADY_ADMITTED');
 const seat=await Opportunity.updateOne({_id:o._id,status:'open',$expr:{$lt:['$confirmedCount','$capacity']}},{$inc:{confirmedCount:1,__v:1},$push:{history:event(actor,'seat_confirmed',{enrollmentId:e._id})}},{session:s});if(seat.modifiedCount!==1)fail('Chỗ cuối đã được nhận; chọn cơ hội khác','NO_SEATS');
 e.admission={opportunityId:o._id,companyUserId:o.companyUserId,applicationId,state:'active',confirmedAt:clock.now(),allocationId:crypto.randomUUID(),title:o.title,companyName:o.companyName};e.history.push(event(actor,'admission_confirmed',{opportunityId:o._id}));await e.save({session:s});
 await Application.updateMany({enrollmentId:e._id,...(applicationId?{_id:{$ne:applicationId}}:{}),state:{$in:['submitted','dispatched','under_review','offered']}},{$set:{state:'closed_other_selected','dispatch.revokedAt':clock.now()},$inc:{__v:1},$push:{history:event(actor,'closed_other_selected')}},{session:s});
 const current=await Opportunity.findById(o._id).session(s);
 if(current.confirmedCount>=current.capacity){
  current.status='closed';current.closureReason='capacity_full';current.history.push(event(actor,'opportunity_full'));await current.save({session:s});
  const pending=await Application.find({opportunityId:o._id,batchId:e.batchId,...(applicationId?{_id:{$ne:applicationId}}:{}),state:{$in:['submitted','dispatched','under_review','offered']}}).session(s);
  for(const app of pending){
   const other=await Enrollment.findById(app.enrollmentId).session(s);let refunded=false;
   if(other&&!active(other)&&other.usedOpportunities.some(id=>same(id,o._id))&&!other.refundedOpportunities.some(id=>same(id,o._id))){other.refundedOpportunities.push(o._id);other.history.push(event(actor,'application_slot_refunded',{opportunityId:o._id,applicationId:app._id}));await other.save({session:s});refunded=true;}
   app.state='closed_full';app.closedAt=clock.now();app.closeReason='Đề tài đã đủ chỉ tiêu';if(refunded)app.quotaRefundedAt=clock.now();if(app.dispatch)app.dispatch.revokedAt=clock.now();app.history.push(event(actor,'application_closed_full',{refunded}));await app.save({session:s});
  }
 }
 return e;
}
async function confirm(actor,id,input={}) {return transaction(async s=>{
 const a=await Application.findOne({_id:v.id(id),studentUserId:actor._id}).session(s);if(!a)fail('Không tìm thấy hồ sơ','NOT_FOUND',404);const e=await enrollment(actor,a.enrollmentId,s);if(active(e)&&same(e.admission.applicationId,a._id))return e;
 fail('Doanh nghiệp cần bấm nhận sinh viên; sinh viên không tự chốt tiếp nhận','COMPANY_ACCEPTANCE_REQUIRED');
});}
async function supportPending(assignmentId,s) {if(await SupportPayment.exists({assignmentId,state:{$in:['prepared','submitted','needs_reconciliation']}}).session(s))fail('Cần đối chiếu hoặc hủy ủy quyền hỗ trợ trước khi thay phân công','PAYMENT_UNRESOLVED');}
async function schoolAllocation(actor,e,input,s) {
 const b=await batch(e.batchId,s);if(clock.now()<new Date(b.startDate.getTime()-7*86400000))fail('Nhà trường hỗ trợ từ 7 ngày trước khi kỳ bắt đầu','NOT_DUE');const o=await eligibleOpportunity(e,input.opportunityId,s);if(!o.schoolAllocationAllowed)fail('Doanh nghiệp chưa cho phép trường phân bổ trực tiếp; cần chuyển hồ sơ xét trước','SCHOOL_ALLOCATION_DENIED');
 if(!e.registeredAt){if(input.confirmParticipation!==true)fail('Cần xác nhận riêng việc sinh viên tham gia kỳ','PARTICIPATION_REQUIRED');e.registeredAt=clock.now();e.history.push(event(actor,'participation_confirmed_by_school'));}
 v.text(input.reason,'Lý do phân công',{required:false,max:2000});return allocateInside(actor,e,o,s);
}
async function assignInside(actor,e,input,s) {
 const b=await batch(e.batchId,s);if(!active(e))await schoolAllocation(actor,e,input,s);
 if(e.assignmentId){const old=await Assignment.findById(e.assignmentId).session(s);if(old?.activePlacement){if(same(old.mentorUserId,input.mentorUserId))return old;fail('Đã phân công; dùng quy trình đổi giảng viên có lý do','ALREADY_ASSIGNED');}}
 const mentor=await enabled(v.id(input.mentorUserId),'mentor',s),o=await Opportunity.findById(e.admission.opportunityId).session(s),student=await Student.findOne({userId:e.studentUserId}).session(s);if(!student||!o)fail('Thiếu hồ sơ/đề tài chuẩn hóa');
 await enabled(o.companyUserId,'company',s);const startDate=v.date(input.startDate,'Bắt đầu'),endDate=v.date(input.endDate,'Kết thúc');if(startDate>=endDate||startDate<b.startDate||endDate>b.endDate||o.kpis.some(k=>new Date(k.deadline)<startDate||new Date(k.deadline)>endDate))fail('Ngày phân công phải trong kỳ và bao gồm tất cả hạn KPI','INVALID_ASSIGNMENT_DATES');
 const reason=v.text(input.reason,'Lý do',{required:false,max:2000});const [a]=await Assignment.create([{workflow:true,activePlacement:true,enrollmentId:e._id,opportunityId:o._id,topicSnapshot:{title:o.title,description:o.description,companyName:o.companyName},topicId:o.topicId,studentId:student._id,batchId:e.batchId,studentUserId:e.studentUserId,companyUserId:o.companyUserId,mentorUserId:mentor._id,startDate,endDate,lifecycle:'approved',studentBatchKey:`${e.batchId}:${e.studentUserId}`,kpiAtAssign:100,kpis:o.kpis.map((k,i)=>({milestoneIndex:i,title:k.title,description:k.description,weightPercent:k.weightPercent,deadline:k.deadline,status:'pending'})),history:[event(actor,'official_assignment',{reason,allocationId:e.admission.allocationId})]}],{session:s});e.assignmentId=a._id;e.history.push(event(actor,'mentor_assigned',{assignmentId:a._id,mentorUserId:mentor._id}));await e.save({session:s});return a;
}
async function assign(actor,id,input) {return transaction(async s=>{const e=await enrollment(actor,id,s);if(!e.assignmentId)version(e,input.version);return assignInside(actor,e,input,s);});}
async function cancelInside(actor,a,input,s) {
 if(!a.activePlacement)return a;if(a.lifecycle==='completed')fail('Không hủy phân công đã hoàn tất qua thao tác này');await supportPending(a._id,s);const e=await Enrollment.findById(a.enrollmentId).session(s);if(!e||!active(e))fail('Admission không nhất quán');
 await Application.updateMany({enrollmentId:e._id,'dispatch.revokedAt':null},{$set:{'dispatch.revokedAt':clock.now()},$inc:{__v:1}},{session:s});
 await Application.updateMany({enrollmentId:e._id,state:'confirmed'},{$set:{state:'cancelled'},$push:{history:event(actor,'admission_cancelled',{reason:input.reason})}},{session:s});
 const result=await Opportunity.updateOne({_id:e.admission.opportunityId,confirmedCount:{$gt:0}},{$inc:{confirmedCount:-1,__v:1},$push:{history:event(actor,'seat_released',{allocationId:e.admission.allocationId})}},{session:s});if(result.modifiedCount!==1)fail('Counter không nhất quán; cần đối chiếu');e.history.push(event(actor,'admission_cancelled',{before:e.admission.toObject(),reason:input.reason}));e.admission.state='cancelled';e.assignmentId=null;await e.save({session:s});a.activePlacement=false;a.lifecycle='cancelled';a.studentBatchKey=null;a.history.push(event(actor,'assignment_cancelled',{reason:input.reason}));await a.save({session:s});return a;
}
async function cancel(actor,id,input) {return transaction(async s=>{const a=await Assignment.findOne({_id:v.id(id),workflow:true}).session(s);if(!a)fail('Không tìm thấy phân công','NOT_FOUND',404);if(!a.activePlacement)return a;version(a,input.version);input.reason=v.text(input.reason,'Lý do',{required:false,max:2000});return cancelInside(actor,a,input,s);});}
async function transfer(actor,id,input) {return transaction(async s=>{const a=await Assignment.findOne({_id:v.id(id),workflow:true,activePlacement:true}).session(s);if(!a)fail('Không tìm thấy phân công','NOT_FOUND',404);version(a,input.version);input.reason=v.text(input.reason,'Lý do chuyển',{required:false,max:2000});await cancelInside(actor,a,input,s);const e=await enrollment(actor,a.enrollmentId,s),o=await eligibleOpportunity(e,input.opportunityId,s);if(!o.schoolAllocationAllowed)fail('Cơ hội mới chưa chấp thuận điều chuyển của trường');await allocateInside(actor,e,o,s);return assignInside(actor,e,input,s);});}
async function cancelAdmission(actor,id,input) {return transaction(async s=>{
 const e=await enrollment(actor,id,s);if(!active(e))return e;version(e,input.version);if(e.assignmentId)fail('Đã có phân công; dùng thao tác hủy phân công');const reason=v.text(input.reason,'Lý do',{required:false,max:2000});
 const result=await Opportunity.updateOne({_id:e.admission.opportunityId,confirmedCount:{$gt:0}},{$inc:{confirmedCount:-1,__v:1},$push:{history:event(actor,'seat_released',{allocationId:e.admission.allocationId,reason})}},{session:s});if(result.modifiedCount!==1)fail('Counter không nhất quán; cần đối chiếu');
 await Application.updateMany({enrollmentId:e._id,'dispatch.revokedAt':null},{$set:{'dispatch.revokedAt':clock.now()},$inc:{__v:1}},{session:s});await Application.updateMany({enrollmentId:e._id,state:'confirmed'},{$set:{state:'cancelled'},$push:{history:event(actor,'admission_cancelled',{reason})}},{session:s});e.history.push(event(actor,'admission_cancelled',{before:e.admission.toObject(),reason}));e.admission.state='cancelled';await e.save({session:s});return e;
});}
async function changeMentor(actor,id,input) {return transaction(async s=>{
 const a=await Assignment.findOne({_id:v.id(id),workflow:true,activePlacement:true}).session(s);if(!a)fail('Không tìm thấy phân công','NOT_FOUND',404);version(a,input.version);if(a.lifecycle==='completed')fail('Không đổi giảng viên sau khi chốt');const mentor=await enabled(v.id(input.mentorUserId),'mentor',s),reason=v.text(input.reason,'Lý do',{required:false,max:2000});const before=a.mentorUserId;a.mentorUserId=mentor._id;a.history.push(event(actor,'mentor_changed',{before,after:mentor._id,reason}));await a.save({session:s});return a;
});}
async function transition(actor,id,input) {return transaction(async s=>{
 const a=await Assignment.findOne({_id:v.id(id),workflow:true,activePlacement:true,...(actor.role==='company'?{companyUserId:actor._id}:{})}).session(s);if(!a)fail('Không có phân công trong phạm vi','NOT_FOUND',404);version(a,input.version);const target=v.choice(input.state,['active','completed'],'Trạng thái');if(target==='active'&&(a.lifecycle!=='approved'||clock.now()<a.startDate||clock.now()>=a.endDate))fail('Chưa đến thời gian bắt đầu hoặc đã hết thời gian thực tập');
 if(target==='completed'){if(actor.role!=='admin'||a.lifecycle!=='active')fail('Chỉ nhà trường chốt phân công đang thực tập','FORBIDDEN_ROLE',403);const {Report,WorkSession}=require('../models/BusinessModels');if(!a.kpis?.length||a.kpis.some(k=>k.status!=='approved')||a.kpiScore==null||!await Report.exists({assignmentId:a._id,kind:'final',current:true,state:'approved'}).session(s)||await WorkSession.exists({assignmentId:a._id,state:{$in:['open','pending','needs_adjustment']}}).session(s))fail('Cần hoàn tất KPI, báo cáo và xử lý các phiên giờ làm');}
 a.lifecycle=target;a.history.push(event(actor,'assignment_state',{state:target,reason:v.text(input.reason,'Lý do',{required:false})}));await a.save({session:s});return a;
});}
module.exports={transaction,version,enabled,batch,enrollment,active,event,opportunityDto,updateOpportunity,register,apply,dispatch,decision,withdraw,confirm,assign,cancel,transfer,cancelAdmission,changeMentor,transition,companyGrant,supportPending};

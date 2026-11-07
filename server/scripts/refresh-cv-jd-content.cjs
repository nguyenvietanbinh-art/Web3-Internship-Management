// Explicit, backed-up content refresh for managed synthetic records only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {MongoClient,BSON,ObjectId}=require('mongodb');
const root=path.resolve(__dirname,'../..'),cache=path.join(root,'contracts/node_modules/.cache/workflow-combined-20261107');
const MAIN='internova_demo_cunhan_kysu_20261107',TEST='internova_cvjd_refresh_test_20261107',ACTION='fixture.cv_jd_content_refreshed';
const hash=doc=>crypto.createHash('sha256').update(BSON.serialize(doc)).digest('hex');
function target(name){if(![MAIN,TEST].includes(name))throw Error('Refuse unapproved database');return `mongodb://127.0.0.1:27018/${name}?replicaSet=internovaTestRs`;}
function cvText(cv,row){
 const depth={2:'đang làm quen',4:'đã thực hành cơ bản',7:'có kinh nghiệm đồ án',10:'đã thực hành nhiều phần'}[row.skills.length];
 if(!depth)throw Error('Unrecognized managed skill level');
 const project=cv.experience.split('Đồ án học tập tổng hợp: ')[1]?.split(' Mức thực hành: ')[0];if(!project)throw Error('Missing original synthetic project');
 const beginning=row.skills.length<=4;
 return {summary:`Mục tiêu thực tập: ${row.track.toLowerCase()}. Mong muốn tham gia phần việc phù hợp kiến thức hiện có, được hướng dẫn theo yêu cầu đề tài và nhận phản hồi định kỳ.\nKỹ năng đã học và tự khai: ${row.skills.join(', ')}. Mức thực hành: ${depth}; kỹ năng chưa có trong danh sách không được coi là đã thành thạo.\nCách làm việc: đọc yêu cầu trước khi thực hiện, ghi lại phần chưa rõ, phối hợp với người hướng dẫn, chủ động báo khó khăn và tiếp thu góp ý. Các phẩm chất này là thông tin của hồ sơ tổng hợp, chưa có đánh giá từ doanh nghiệp.\nLịch tham gia: theo kỳ nhà trường đã cấp và thỏa thuận với doanh nghiệp; cần xác nhận lịch cụ thể khi tiếp nhận. Không dùng GPA làm bằng chứng đã đáp ứng chuyên môn.`,
 experience:`Bài tập học tập mô phỏng: ${project}\nPhần thực hành gắn với các kỹ năng: ${row.skills.join(', ')}. ${beginning?'Mới thực hành các phần cơ bản, cần hướng dẫn khi ghép thành quy trình hoàn chỉnh; chưa khai đã có sản phẩm chạy thực tế.':'Đã thực hành nhiều phần trong kịch bản học tập, chú trọng hiểu yêu cầu, chia nhỏ công việc và giải thích phần trực tiếp thực hiện; chưa có chứng cứ sản phẩm doanh nghiệp.'}\nCách kiểm tra dự kiến: thử dữ liệu hợp lệ và dữ liệu sai, ghi lại bước tái hiện lỗi, kiểm lại sau khi sửa và trao đổi với người hướng dẫn. Không coi mô tả này là kết quả kiểm thử đã được xác minh.\nKhó khăn và kế hoạch: ${beginning?'còn ít kinh nghiệm áp dụng và cần hoàn thiện kiến thức nền; ưu tiên làm phần nhỏ, ghi nhật ký và hỏi khi chưa hiểu.':'cần nâng khả năng tích hợp, kiểm thử và trình bày giải pháp; ưu tiên hoàn thiện phần được giao, viết hướng dẫn và báo rõ giới hạn.'}\nNguồn: tình huống học tập tổng hợp để đối chiếu CV với yêu cầu công việc; không phải kinh nghiệm làm việc hoặc thành tích của người thật.`};
}
function jdText(topic){return `${topic.description}\n\nPhạm vi thực tập: sinh viên trao đổi yêu cầu với người hướng dẫn, chia nhiệm vụ thành phần nhỏ, thực hiện trong phạm vi quyền được giao và trình bày kết quả theo từng mốc.\nKỹ năng bắt buộc để đối chiếu hồ sơ: ${(topic.requiredSkills||[]).join(', ')}. Những kỹ năng chưa đáp ứng phải được trao đổi trước khi tiếp nhận; danh sách này không tự xác minh trình độ thực hành.\nƯu tiên: có bài tập gần với đề tài, mô tả rõ phần trực tiếp làm, biết giải thích lỗi và cách tự kiểm tra. Không bắt buộc đã làm tại doanh nghiệp trước đó.\nPhối hợp và thái độ: có trách nhiệm, siêng năng, chủ động báo khó khăn, tiếp thu phản hồi và tôn trọng bảo mật. Các yêu cầu này cần trao đổi hoặc quan sát trong thực tập, không suy từ một câu tự khai trong CV.\nĐầu ra theo dõi: phần việc hoặc tài liệu đúng yêu cầu, cách chạy/đọc kết quả, ca kiểm tra, nhật ký và báo cáo định kỳ. Không mặc định đầu ra đã tồn tại.\nLịch và chỉ tiêu: tuân theo kỳ, thời hạn, số chỗ và trạng thái đang lưu; nội dung bổ sung này không mở lại tuyển, nhận thêm người hoặc thay đổi lịch thực tập.`;}
async function snapshot(db,excluded={}){
 const out=[];
 for(const c of (await db.listCollections().toArray()).sort((a,b)=>a.name.localeCompare(b.name))){const digest=crypto.createHash('sha256');let count=0;for await(const row of db.collection(c.name).find().sort({_id:1})){if((excluded[c.name]||[]).includes(String(row._id)))continue;digest.update(BSON.serialize(row));count++;}out.push({name:c.name,count,hash:digest.digest('hex'),indexes:await db.collection(c.name).indexes()});}
 return out;
}
async function connect(name){const c=new MongoClient(target(name),{serverSelectionTimeoutMS:5000});await c.connect();assert.equal((await c.db(name).command({hello:1})).setName,'internovaTestRs');return c;}
async function makePlan(dir){
 if(fs.existsSync(dir))throw Error('Plan path exists; preserve existing evidence');
 const c=await connect(MAIN);try{
  const db=c.db(MAIN),cvRows=JSON.parse(fs.readFileSync(path.join(cache,'student-skills-gpa-result.json'),'utf8')).rows,topicRows=JSON.parse(fs.readFileSync(path.join(cache,'topic-requirements-result.json'),'utf8')).rows;
  const cvs=await db.collection('cvs').find().toArray(),users=await db.collection('users').find({role:'student'},{projection:{loginEmail:1,skills:1}}).toArray(),topics=await db.collection('topics').find().toArray(),opps=await db.collection('topic_opportunities').find().toArray();
  const changes=[],skipped=[];
  for(const cv of cvs){
   const user=users.find(u=>String(u._id)===String(cv.ownerUserId)),row=cvRows.find(r=>r.email===user?.loginEmail),depth={2:'Đang làm quen',4:'Đã thực hành cơ bản',7:'Có kinh nghiệm đồ án',10:'Đã thực hành nhiều phần'}[row?.skills.length];
   const expected=row&&`${depth} với ${row.track.toLowerCase()}. Kỹ năng: ${row.skills.join(', ')}. Hồ sơ tổng hợp phục vụ thử gợi ý đề tài, không phải thông tin người thật.`;
   const event=cv.history?.find(h=>h.action==='fixture.skills_gpa_enriched');
   if(!row||!event||cv.__v!==1||cv.fileName||cv.extractedText||cv.fileData||cv.summary!==expected||cv.gpa!==row.gpa||JSON.stringify(cv.skills)!==JSON.stringify(row.skills)||JSON.stringify(user.skills)!==JSON.stringify(row.skills)||!cv.experience?.endsWith(`Mức thực hành: ${depth.toLowerCase()}; không khẳng định sản phẩm đã được doanh nghiệp xác minh.`)){
    skipped.push({collection:'cvs',id:String(cv._id),reason:'Not an unchanged managed synthetic CV, or contains an uploaded/user-edited CV'});continue;
   }
   changes.push({collection:'cvs',before:cv,fields:cvText(cv,row),actorUserId:cv.ownerUserId,role:'student'});
  }
  for(const t of topics){
   const row=topicRows.find(r=>r.id===String(t._id));
   if(!row||t.__v!==1||JSON.stringify(t.requiredSkills)!==JSON.stringify(row.requiredSkills)||!t.description?.endsWith('Không yêu cầu kinh nghiệm làm việc tại doanh nghiệp trước đó.')){skipped.push({collection:'topics',id:String(t._id),reason:'Outside managed provenance or changed topic'});continue;}
   const description=jdText(t);changes.push({collection:'topics',before:t,fields:{description},actorUserId:t.companyUserId,role:'company'});
   for(const o of opps.filter(o=>String(o.topicId)===String(t._id))){
    if(o.status!=='open'||o.description!==t.description||!o.history?.some(h=>h.action==='fixture.requirements_enriched')){skipped.push({collection:'topic_opportunities',id:String(o._id),reason:'Closed recruitment or content no longer matches managed baseline'});continue;}
    changes.push({collection:'topic_opportunities',before:o,fields:{description},actorUserId:t.companyUserId,role:'company'});
   }
  }
  for(const jd of await db.collection('job_descriptions').find().toArray())skipped.push({collection:'job_descriptions',id:String(jd._id),reason:'Legacy/imported JD without an approved generated-content baseline'});
  assert.ok(changes.some(c=>c.collection==='cvs'));assert.ok(changes.some(c=>c.collection==='topics'));
  const excluded={};for(const change of changes)(excluded[change.collection]??=[]).push(String(change.before._id));
  const plan={database:MAIN,provenance:'synthetic-content-refresh-not-expert-labels',createdAt:new Date(),changes,skipped,excluded,protected:await snapshot(db,excluded)};
  fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'plan.ejson'),BSON.EJSON.stringify(plan,{relaxed:false}),{flag:'wx'});
  console.log(JSON.stringify({plan:path.join(dir,'plan.ejson'),changes:counts(changes),skipped:counts(skipped)}));return plan;
 }finally{await c.close();}
}
const counts=items=>items.reduce((r,x)=>(r[x.collection]=(r[x.collection]||0)+1,r),{});
async function writeChanges(client,db,changes,failAfter=0){
 const session=client.startSession(),at=new Date();try{await session.withTransaction(async()=>{let n=0;for(const change of changes){const col=db.collection(change.collection),before=await col.findOne({_id:change.before._id},{session});assert.equal(hash(before),hash(change.before),'Record changed since plan; abort all changes');
   const event={_id:new ObjectId(),action:ACTION,actorRole:change.role,actorUserId:change.actorUserId,at,data:{synthetic:true,version:'cv-jd-content-v2-20261107',humanConfirmed:false}};
   const result=await col.updateOne({_id:before._id,__v:before.__v},{$set:{...change.fields,updatedAt:at},$inc:{__v:1},$push:{history:event}},{session});assert.equal(result.modifiedCount,1);if(++n===failAfter)throw Error('INTENTIONAL_TEST_ROLLBACK');
  }});return at;}finally{await session.endSession();}
}
async function verify(db,changes){
 for(const change of changes){const after=await db.collection(change.collection).findOne({_id:change.before._id});for(const [key,value]of Object.entries(change.fields))assert.equal(after[key],value);assert.equal(after.__v,change.before.__v+1);assert.equal(after.history.at(-1).action,ACTION);
  const original={...change.before},restored={...after};for(const key of [...Object.keys(change.fields),'updatedAt','__v'])delete original[key],delete restored[key];if(Object.hasOwn(original,'history'))restored.history=restored.history.slice(0,-1);else delete restored.history;assert.equal(hash(restored),hash(original),'Untargeted fields must remain exactly unchanged');
 }
}
async function apply(dir){
 const completed=path.join(dir,'result.json');if(fs.existsSync(completed))throw Error('Already applied; refusing duplicate update');
 const plan=BSON.EJSON.parse(fs.readFileSync(path.join(dir,'plan.ejson'),'utf8'));assert.equal(plan.database,MAIN);
 const proof=JSON.parse(fs.readFileSync(path.join(dir,'test-result.json'),'utf8'));assert.equal(proof.status,'PASS');assert.equal(proof.planSha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'plan.ejson'))).digest('hex'));
 const c=await connect(MAIN);try{const db=c.db(MAIN);assert.deepEqual(await snapshot(db,plan.excluded),plan.protected,'Protected data changed after plan; regenerate safely');await writeChanges(c,db,plan.changes);await verify(db,plan.changes);assert.deepEqual(await snapshot(db,plan.excluded),plan.protected,'Protected data/indexes must be preserved');
  const result={database:MAIN,status:'PASS',updated:counts(plan.changes),skipped:counts(plan.skipped),protectedCollections:plan.protected.map(c=>({name:c.name,count:c.count})),submittedSnapshotsPreserved:true,skillsAndGpaUnchanged:true,capacityAndStatesUnchanged:true,at:new Date().toISOString()};fs.writeFileSync(completed,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));
 }finally{await c.close();}
}
async function test(dir){
 const plan=BSON.EJSON.parse(fs.readFileSync(path.join(dir,'plan.ejson'),'utf8')),c=await connect(TEST);try{const db=c.db(TEST);if((await db.listCollections().toArray()).length)throw Error('TEST database not empty; preserve previous test data');
  await db.collection('qa_safety_marker').insertOne({_id:'cv-jd-refresh',purpose:'isolated content refresh test'});
  for(const col of Object.keys(plan.excluded))await db.collection(col).insertMany(plan.changes.filter(x=>x.collection===col).map(x=>x.before));
  const before=await snapshot(db);await assert.rejects(()=>writeChanges(c,db,plan.changes,1),/INTENTIONAL_TEST_ROLLBACK/);assert.deepEqual(await snapshot(db),before,'Atomic failure must roll back');
  await writeChanges(c,db,plan.changes);await verify(db,plan.changes);await assert.rejects(()=>writeChanges(c,db,plan.changes),/Record changed/);
  const result={status:'PASS',database:TEST,tests:['transaction rollback preserves all data','full content refresh matches plan','untargeted fields and snapshots preserved','retry refuses duplicate changes'],changed:counts(plan.changes),planSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'plan.ejson'))).digest('hex')};fs.writeFileSync(path.join(dir,'test-result.json'),JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));
 }finally{await c.close();}
}
module.exports={cvText,jdText,target};
if(require.main===module){const mode=process.argv[2],dir=path.resolve(process.argv[3]||'');if(!dir.startsWith(path.join(root,'contracts/node_modules/.cache')+path.sep))throw Error('Use a new ignored cache evidence path');(mode==='plan'?makePlan:mode==='test'?test:mode==='apply'?apply:()=>{throw Error('Use plan, test or apply')})(dir).catch(e=>{console.error(e.stack);process.exitCode=1});}

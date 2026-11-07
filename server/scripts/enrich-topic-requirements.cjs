// Populate existing requiredSkills on untouched synthetic topics; never change placements or submitted CVs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../../contracts/node_modules/.cache/workflow-combined-20261107');
const database='internova_demo_cunhan_kysu_20261107',uri=`mongodb://127.0.0.1:27018/${database}?replicaSet=internovaTestRs`;
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri,USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',GOOGLE_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',JWT_SECRET:crypto.randomBytes(32).toString('hex'),WEB3_LOCAL_ENABLED:'false'});
require('../src/config/workflowTestGuard').assertWorkflowTest();
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);require('../src/app').createApp();
const Topic=require('../src/models/Topic'),User=require('../src/models/User'),{Opportunity,Application}=require('../src/workflow/models');
const hash=r=>crypto.createHash('sha256').update(require('mongodb').BSON.serialize(r)).digest('hex');
function spec(t,index){
 const frontend=index%2===0;
 if(t.title.startsWith('Website thương mại'))return frontend?{skills:['HTML','CSS','JavaScript','React','REST API'],focus:'Xây dựng giao diện danh mục sản phẩm, tìm kiếm, giỏ hàng và biểu mẫu đặt hàng. Kiểm tra hiển thị trên điện thoại và xử lý lỗi dữ liệu đầu vào.'}:{skills:['JavaScript','Node.js','Express','MongoDB','REST API'],focus:'Xây dựng API danh mục sản phẩm, giỏ hàng và đơn hàng; phân quyền khách hàng/quản trị và kiểm thử các trường hợp dữ liệu không hợp lệ.'};
 if(t.title.startsWith('Hệ thống quản lý nhân sự'))return {skills:['Java','Spring Boot','SQL','MySQL','Git'],focus:'Thiết kế dữ liệu phòng ban và nhân sự, API quản lý hồ sơ, tìm kiếm và phân quyền. Viết kiểm thử và hướng dẫn chạy ứng dụng.'};
 if(t.title.startsWith('Ứng dụng theo dõi kho'))return frontend?{skills:['SQL','Manual Testing','Test Cases','Postman','API Testing'],focus:'Phân tích yêu cầu và kiểm thử luồng nhập, xuất, tồn kho; kiểm tra dữ liệu sai, ghi lỗi và đối chiếu số liệu báo cáo.'}:{skills:['JavaScript','Node.js','MongoDB','REST API','Git'],focus:'Xây dựng chức năng nhập xuất kho, kiểm tra tồn kho và lịch sử giao dịch. Thiết kế API, xác thực người dùng và báo cáo dữ liệu.'};
 if(t.title.startsWith('Dashboard phân tích'))return {skills:['Python','SQL','Pandas','Excel','Power BI'],focus:'Làm sạch dữ liệu doanh thu, xây dựng truy vấn tổng hợp và bảng điều khiển theo tháng, sản phẩm, nhóm khách hàng. Giải thích số liệu và giới hạn dữ liệu.'};
 if(t.title.startsWith('Cổng tuyển dụng'))return frontend?{skills:['Figma','Wireframing','Prototyping','UI Design','HTML','CSS'],focus:'Khảo sát hành trình ứng tuyển, thiết kế giao diện danh sách công việc và biểu mẫu CV; tạo bản mẫu, kiểm tra khả năng sử dụng và bàn giao thiết kế.'}:{skills:['JavaScript','Node.js','Express','MongoDB','REST API','Git'],focus:'Phát triển cổng tuyển dụng gồm tạo tin, tìm kiếm đề tài, hồ sơ ứng viên và theo dõi trạng thái. Thiết kế API Node.js, lưu MongoDB và kiểm soát quyền truy cập.'};
 throw Error('Unknown synthetic topic; preserve instead of inventing requirements');
}
(async()=>{
 const marker=path.join(dir,'topic-requirements-result.json');if(fs.existsSync(marker))throw Error('Completed fixture; do not rerun');
 await mongoose.connect(uri,{autoIndex:false,autoCreate:false});assert.equal(mongoose.connection.db.databaseName,database);assert.equal((await mongoose.connection.db.command({hello:1})).setName,'internovaTestRs');
 const owners=await User.find({role:'company',loginEmail:{$regex:/^enterprise-\d+@example\.invalid$/}}).select('+loginEmail');
 const plans=[];
 for(const t of await Topic.find({companyUserId:{$in:owners.map(u=>u._id)},__v:0,description:{$regex:/^Đề tài giả lập:/},'requiredSkills.0':{$exists:false}})){
  const owner=owners.find(u=>String(u._id)===String(t.companyUserId)),index=Number(owner.loginEmail.match(/\d+/)[0]);const data=spec(t,index);
  const description=`${data.focus}\nYêu cầu đầu vào: ${data.skills.join(', ')}. Sinh viên có thể bổ sung kỹ năng còn thiếu trong quá trình thực tập dưới sự hướng dẫn.\nSản phẩm cần bàn giao: mã nguồn hoặc tài liệu phù hợp phạm vi công việc, kết quả kiểm thử và báo cáo thực tập. Không yêu cầu kinh nghiệm làm việc tại doanh nghiệp trước đó.`;
  plans.push({topic:t,data,description,company:owner.loginEmail});
 }
 assert.ok(plans.length>0,'No untouched generated topics');
 const apps=await Application.collection.find().toArray();
 fs.writeFileSync(path.join(dir,'topic-requirements-before.json'),JSON.stringify(plans.map(p=>p.topic.toObject()),null,2),{flag:'wx'});
 let opportunitiesUpdated=0;
 await mongoose.connection.transaction(async session=>{
  opportunitiesUpdated=0;
  for(const {topic:t,data,description}of plans){
   const r=await Topic.updateOne({_id:t._id,__v:0,description:t.description},{$set:{description,requiredSkills:data.skills},$inc:{__v:1}},{session,runValidators:true});assert.equal(r.modifiedCount,1);
   const o=await Opportunity.updateMany({topicId:t._id,description:t.description,history:{$elemMatch:{action:{$in:['school.synthetic_opportunity_created','fixture.opportunity_prepared']}}}},{$set:{description},$inc:{__v:1},$push:{history:{actorRole:'company',actorUserId:t.companyUserId,action:'fixture.requirements_enriched',at:new Date(),data:{synthetic:true,run:'topic-skills-20261107'}}}},{session,runValidators:true});opportunitiesUpdated+=o.modifiedCount;
  }
 });
 for(const before of apps)assert.equal(hash(await Application.collection.findOne({_id:before._id})),hash(before));
 const result={database,topicsUpdated:plans.length,opportunitiesUpdated,submittedApplicationsPreserved:apps.length,schemaChanged:false,rows:plans.map(p=>({id:String(p.topic._id),title:p.topic.title,company:p.company,requiredSkills:p.data.skills}))};
 fs.writeFileSync(marker,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({...result,rows:undefined}));
})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>mongoose.disconnect());

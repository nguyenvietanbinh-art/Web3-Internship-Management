// Real TEST data, GET-only. No fixtures inserted and no collection cleanup.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const cfg=require('../../scripts/demo/large-dataset-config.cjs');cfg.configure();
process.env.JWT_SECRET=fs.readFileSync(path.join(cfg.dir,'jwt.txt'),'utf8').trim();
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);
const out=path.resolve('audit-reports/POST_PHASE_1_6_FIX_20261109'),result={at:new Date(),requests:[],checks:[]};let server;
(async()=>{try{
 await mongoose.connect(cfg.uri,{autoIndex:false,autoCreate:false,maxPoolSize:2});const db=mongoose.connection.db;assert.equal(db.databaseName,cfg.database);assert.equal((await db.command({hello:1})).setName,'internovaTestRs');assert.ok(await db.collection('qa_safety_marker').findOne({_id:'large-v1',synthetic:true}));
 const people=await db.collection('users').find({disabled:{$ne:true}}).toArray(),actors=Object.fromEntries(['admin','company','mentor','student'].map(role=>[role,people.find(u=>u.role===role)]));
 if(!process.env.SEARCH_FIX_RUNTIME_BASE){const app=require('../src/app').createApp();await new Promise(resolve=>{server=app.listen(0,'127.0.0.1',resolve);});}
 const base=process.env.SEARCH_FIX_RUNTIME_BASE||'http://127.0.0.1:'+server.address().port+'/api/core',sign=require('../src/services/authService').signToken,normalize=require('../src/services/personSearch').normalize;
 result.base=base;
 async function get(role,url,status=200){const start=performance.now(),response=await fetch(base+url,{headers:{Authorization:'Bearer '+sign(actors[role],'password')},signal:AbortSignal.timeout(15000)}),data=await response.json();result.requests.push({role,path:url,status:response.status,total:data.total,items:data.items?.length,ms:Math.round((performance.now()-start)*100)/100});assert.equal(response.status,status,role+' '+url);return data;}
 const admin=await get('admin','/student-lookup?limit=10');assert.equal(admin.total,500);assert.equal(admin.items.length,10);
 const sample=admin.items.find(u=>/[đĐ]/.test(u.name))||admin.items[0];const withD=await db.collection('students').findOne({fullName:/[đĐ]/});
 for(const target of [sample,withD?{...withD,_id:withD.userId,name:withD.fullName}:sample]){
  const queries=[target.name,normalize(target.name),target.name.toUpperCase(),target.name.split(/\s+/).join('   '),target.name.normalize('NFD')];
  for(const query of queries){const data=await get('admin','/student-lookup?limit=10&q='+encodeURIComponent(query));assert.ok(data.items.some(u=>String(u._id)===String(target._id)),query);}
  const code=await get('admin','/student-lookup?limit=10&q='+target.studentCode);assert.ok(code.items.some(u=>String(u._id)===String(target._id)));
 }
 const page2=await get('admin','/student-lookup?limit=10&page=2'),page50=await get('admin','/student-lookup?limit=10&page=50');assert.equal(page50.items.length,10);assert.ok(!page2.items.some(u=>admin.items.some(a=>a._id===u._id)));result.checks.push('Admin: 500, pages1/2/50, no duplicate page rows; accented/unaccented/case/whitespace/NFD/d/đ/code');
 await get('admin','/student-lookup?q[]=An',400);await get('admin','/student-lookup?q='+encodeURIComponent('x'.repeat(121)),400);
 for(const role of ['student','company','mentor'])await get(role,'/admin/supervision/students',403);
 await get('student','/student-lookup',403);
 for(const role of ['company','mentor']){
  const scope={workflow:true,activePlacement:true,[role+'UserId']:actors[role]._id};const assigned=await db.collection('assignments').findOne(scope);assert.ok(assigned);
  const student=people.find(u=>String(u._id)===String(assigned.studentUserId)),profile=await db.collection('students').findOne({userId:student._id});
  for(const q of [student.name,normalize(student.name),profile.studentCode]){
   const lookup=await get(role,'/student-lookup?q='+encodeURIComponent(q));assert.ok(lookup.items.some(u=>String(u._id)===String(student._id)));
   const roster=await get(role,'/'+role+'/students?q='+encodeURIComponent(q)+'&lifecycle='+assigned.lifecycle);assert.ok(roster.items.length);assert.ok(roster.items.every(a=>String(a[role+'UserId'])===String(actors[role]._id)));
  }
  const foreign=await db.collection('assignments').findOne({workflow:true,activePlacement:true,[role+'UserId']:{$ne:actors[role]._id}}),foreignStudent=people.find(u=>String(u._id)===String(foreign.studentUserId));
  const denied=await get(role,'/student-lookup?q='+encodeURIComponent(foreignStudent.name));assert.ok(!denied.items.some(s=>String(s._id)===String(foreignStudent._id)));await get(role,'/student-lookup/'+foreign.studentUserId+'/placements',404);
  const filters=await get('admin','/student-lookup?companyUserId='+assigned.companyUserId+'&mentorUserId='+assigned.mentorUserId+'&batchId='+assigned.batchId+'&q='+encodeURIComponent(normalize(student.name)));assert.ok(filters.items.some(s=>String(s._id)===String(student._id)));
  const period=await get('admin','/admin/batches/'+assigned.batchId+'/students?q='+profile.studentCode);assert.ok(period.items.some(e=>String(e.studentUserId)===String(student._id)));
  const directory=await get('admin','/admin/directory?role=student&q='+profile.studentCode);assert.ok(directory.items.some(u=>String(u._id)===String(student._id)));
  const accounts=await get('admin','/accounts?role=student&q='+encodeURIComponent(normalize(student.name)));assert.ok(accounts.items.some(u=>String(u._id)===String(student._id)));
  const reports=await get(role,'/reports?q='+encodeURIComponent(normalize(student.name)));assert.ok(reports.items.every(r=>String(r.studentUserId)===String(student._id)));
  result.checks.push(role+': owned lookup/roster, code, period/directory/accounts, combined filters, report query, foreign IDOR denied');
 }
 const company=actors.company,owned=await db.collection('assignments').find({workflow:true,activePlacement:true,companyUserId:company._id},{projection:{_id:1}}).toArray(),expected=await db.collection('business_reports').countDocuments({assignmentId:{$in:owned.map(a=>a._id)},kind:'final',current:true});
 const dashboard=await get('company','/dashboard');assert.equal(dashboard.totals.reports,expected);result.dashboard={name:company.name,companyId:String(company._id),expected,actual:dashboard.totals.reports};
 for(const role of ['admin','company']){const apps=await get(role,role==='admin'?'/admin/applications?limit=1':'/company/applications?limit=1');const a=apps.items[0];if(a){const student=people.find(u=>String(u._id)===String(a.studentUserId)),profile=await db.collection('students').findOne({userId:student._id});for(const query of [normalize(student.name),profile.studentCode]){const matches=await get(role,(role==='admin'?'/admin/applications':'/company/applications')+'?q='+encodeURIComponent(query));assert.ok(matches.items.some(item=>String(item.studentUserId)===String(student._id)));if(role==='company')assert.ok(matches.items.every(item=>String(item.companyUserId)===String(company._id)));}}}
 const times=[];for(let i=0;i<30;i++){const q=['nguyen','dang','minh','2312000001','nguyen minh an'][i%5];await get('admin','/student-lookup?limit=10&q='+q.replaceAll(' ','%20'));times.push(result.requests.at(-1).ms);}times.sort((a,b)=>a-b);result.latency={samples:30,p50:times[14],p95:times[28],max:times.at(-1),note:'Sequential local GET, not a concurrency/load test'};
 result.status='PASS';
 }catch(e){result.status='FAIL';result.error=e.stack;process.exitCode=1;}finally{if(server)await new Promise(r=>server.close(r));await mongoose.disconnect();fs.writeFileSync(path.join(out,process.env.SEARCH_FIX_RUNTIME_BASE?'api-runtime.json':'api-pre-restart.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,error:result.error,dashboard:result.dashboard,requests:result.requests.length,latency:result.latency},null,2));}})();

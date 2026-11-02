const h=require('./helpers'),{Wallet}=require('ethers'),User=require('../src/models/User');
async function setup(){
 await h.start();const users={};for(const role of ['admin','mentor']){const wallet=Wallet.createRandom();await User.create({walletAddress:wallet.address,role,name:'TEST CORE '+role});users[role]=await h.loginAs(role,'TEST '+role,wallet);}
 for(const role of ['company','student'])users[role]=await h.loginAs(role,'TEST CORE '+role);
 users.foreignCompany=await h.loginAs('company','TEST OTHER company');users.foreignStudent=await h.loginAs('student','TEST OTHER student');
 const r=await h.api('POST','/topics',{token:users.company.token,body:{title:'TEST CORE topic',description:'Explicit isolated core fixture',kpis:h.kpis2()}});
 if(r.status!==201)throw Error('Topic fixture failed');return{...users,topic:r.body.topic};
}
async function placement(f,{activate=true}={}){
 const dates={startDate:new Date(Date.now()-864e5).toISOString(),endDate:new Date(Date.now()+60*864e5).toISOString()};
 const batch=await h.api('POST','/core/batches',{token:f.admin.token,body:{code:'TEST_'+Math.random().toString(36).slice(2).toUpperCase(),name:'TEST CORE period',...dates,status:'open'}});
 if(batch.status!==201)throw Error('Batch fixture failed '+JSON.stringify(batch.body));
 const made=await h.api('POST','/core/placements',{token:f.company.token,body:{...dates,batchId:batch.body._id,topicId:f.topic._id,studentWallet:f.student.address,mentorWallet:f.mentor.address}});
 if(made.status!==201)throw Error('Placement fixture failed '+JSON.stringify(made.body));let doc=made.body;
 if(activate){const approved=await h.api('PATCH','/core/placements/'+doc._id,{token:f.admin.token,body:{version:doc.__v,lifecycle:'approved',reason:'TEST approved'}});if(approved.status!==200)throw Error('Approve fixture failed');const active=await h.api('PATCH','/core/placements/'+doc._id,{token:f.company.token,body:{version:approved.body.__v,lifecycle:'active',reason:'TEST active'}});if(active.status!==200)throw Error('Activate fixture failed');doc=active.body;}
 return{doc,batch:batch.body};
}
module.exports={h,setup,placement};

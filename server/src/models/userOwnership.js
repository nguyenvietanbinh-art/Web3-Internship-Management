const mongoose=require('mongoose');
const owners={CV:[['ownerUserId','ownerWallet']],JD:[['companyUserId','companyWallet']],Topic:[['companyUserId','companyWallet']],Assignment:[['studentUserId','studentWallet'],['companyUserId','companyWallet'],['mentorUserId','mentorWallet']],Application:[['studentUserId','studentWallet'],['companyUserId','companyWallet']],Task:[['studentUserId','assignedStudentWallet'],['companyUserId','companyWallet']],WorkLog:[['studentUserId','studentWallet'],['companyUserId','companyWallet']],WorkSession:[['studentUserId','studentWallet'],['companyUserId','companyWallet'],['mentorUserId','mentorWallet']],Report:[['studentUserId','studentWallet'],['companyUserId','companyWallet'],['mentorUserId','mentorWallet']],CoreQrSession:[['studentUserId','studentWallet'],['companyUserId','companyWallet']],ChainOperation:[['actorUserId','actorWallet']],PrivateReportArtifact:[['ownerUserId','ownerWallet']]};
function apply(schema,name){
 for(const[id,wallet]of owners[name]||[])schema.add({[id]:{type:mongoose.Schema.Types.ObjectId,ref:'User',...(name==='CV'&&process.env.USER_ID_BUSINESS_ENABLED==='true'?{}:{index:true})}});
 if(process.env.USER_ID_BUSINESS_ENABLED!=='true')return;
 for(const[id,wallet]of owners[name]||[]){const p=schema.path(wallet);if(p){p.required(false);if(p._index?.unique)p._index={unique:true,partialFilterExpression:{[wallet]:{$type:'string'},[id]:null}};}}
 for(const[key,opt]of schema._indexes)if(opt.unique&&!opt.partialFilterExpression){const field=Object.keys(key).find(f=>f.endsWith('Wallet')),id=(owners[name]||[]).find(x=>x[1]===field)?.[0];if(field)opt.partialFilterExpression={[field]:{$type:'string'},...(id?{[id]:null}:{})};}
 if(name==='CV')schema.index({ownerUserId:1},{unique:true,partialFilterExpression:{ownerUserId:{$type:'objectId'}}});
 if(name==='Application')schema.index({jdId:1,studentUserId:1},{unique:true,partialFilterExpression:{studentUserId:{$type:'objectId'}}});
 if(name==='WorkSession'){
  schema.add({activeStudentUserId:{type:mongoose.Schema.Types.ObjectId,ref:'User'}});
  schema.index({activeStudentUserId:1},{unique:true,partialFilterExpression:{activeStudentUserId:{$type:'objectId'}}});
  for(const field of ['requestKey','day'])schema.index({studentUserId:1,[field]:1},{unique:true,partialFilterExpression:{studentUserId:{$type:'objectId'}}});
 }
 if(name==='Report'){schema.add({approvedByUserId:{type:mongoose.Schema.Types.ObjectId,ref:'User'}});schema.path('reviews').schema.path('actorWallet').required(false);schema.path('reviews').schema.add({actorUserId:{type:mongoose.Schema.Types.ObjectId,ref:'User'}});}
}
module.exports=apply;

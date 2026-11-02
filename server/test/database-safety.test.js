process.env.CORE_BUSINESS_ENABLED='true';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');const h=require('./helpers');const safety=require('../src/services/databaseSafety');
before(h.start);after(h.stop);
test('runtime startup disables implicit schema writes outside TEST and rejects unsafe TEST URI before connecting',()=>{
 assert.deepEqual(safety.connectionOptions({},'mongodb://127.0.0.1:27017/web3_internship'),{autoIndex:false,autoCreate:false});
 assert.throws(()=>safety.connectionOptions({NODE_ENV:'test'},'mongodb://127.0.0.1:27017/web3_internship'));
 const uri='mongodb://127.0.0.1:27017/web3_internship_test_phase1_explicit';assert.deepEqual(safety.connectionOptions({NODE_ENV:'test',MONGODB_URI_TEST_ALLOWLIST:uri},uri),{autoIndex:true,autoCreate:true});
});
test('unique index readiness checks actual TEST indexes with no collection or document changes',async()=>{
 const mongoose=require('mongoose'),db=mongoose.connection.db;
 const snapshot=async()=>{const list=await db.listCollections().toArray();return Promise.all(list.sort((a,b)=>a.name.localeCompare(b.name)).map(async c=>({name:c.name,count:await db.collection(c.name).countDocuments(),indexes:await db.collection(c.name).indexes()})));};
 const before=JSON.stringify(await snapshot()),result=await safety.verifyIndexes(true);assert.equal(result.verified,true);assert.ok(result.models.includes('Application'));assert.equal(JSON.stringify(await snapshot()),before);
});

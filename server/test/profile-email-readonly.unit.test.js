const test=require('node:test'),assert=require('node:assert/strict'),service=require('../src/services/profileService');
for(const role of ['student','company','mentor','admin']){
 const actor={role,email:'account@example.invalid'};
 test(role+': stored email cannot be replaced or erased',()=>{for(const email of ['other@example.invalid','',null,1])assert.throws(()=>service.profileUpdateFields(actor,{email,name:'Tên cập nhật'}),{code:'EMAIL_READ_ONLY'});});
 test(role+': omitted/unchanged email is never written back',()=>{assert.deepEqual(service.profileUpdateFields(actor,{name:'Tên cập nhật'}),{name:'Tên cập nhật'});assert.deepEqual(service.profileUpdateFields(actor,{name:'Tên cập nhật',email:actor.email}),{name:'Tên cập nhật'});});
}
test('account provisioning still validates/accepts a new email',()=>{assert.equal(service.profileFields({name:'Tài khoản mới',email:'new@example.invalid'}).email,'new@example.invalid');});
test('legacy profile update rejects email changes before any DB write',async()=>{await assert.rejects(service.legacyUpdate({email:'account@example.invalid'},{email:'other@example.invalid'},'test'),{code:'EMAIL_READ_ONLY'});});

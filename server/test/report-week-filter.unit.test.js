const test=require('node:test'),assert=require('node:assert/strict'),{optionalWeek}=require('../src/core/shared');
test('optional week accepts omitted value and valid bounds',()=>{assert.equal(optionalWeek(undefined),undefined);for(const value of ['1','2','12','104'])assert.equal(optionalWeek(value),Number(value));});
test('invalid week cannot silently fall back to all reports',()=>{for(const value of ['',0,'0','105','-1','1.5','abc','1e1',{},['2']])assert.throws(()=>optionalWeek(value),{status:400});});

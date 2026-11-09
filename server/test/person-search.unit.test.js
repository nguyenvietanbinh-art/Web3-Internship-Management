const {test}=require('node:test'),assert=require('node:assert/strict');
const {pattern,normalize}=require('../src/services/personSearch');
const v=require('../src/core/shared');
test('Vietnamese names match accents, case, whitespace, d/đ and Unicode forms',()=>{
  for(const q of ['Đặng Thị Ngọc','dang thi ngoc','  ĐẶNG   THỊ\tNGỌC  ','Đặng Thị Ngọc'.normalize('NFD')]){
    const regex=pattern(q);assert.ok(regex.test('Đặng Thị Ngọc'));assert.ok(regex.test('Đặng Thị Ngọc'.normalize('NFD')));assert.ok(regex.test('Dang Thi Ngoc'));assert.equal(regex.test('Lê Quang Huy'),false);
  }
  assert.equal(normalize('  ĐẶNG   Thị\tNgọc  '),'dang thi ngoc');
});
test('surname, middle name, given name, student codes and emails remain searchable',()=>{
  for(const q of ['nguyen','viet','binh'])assert.ok(pattern(q).test('Nguyễn Viết An Bình'));
  assert.ok(pattern('0012345678').test('0012345678'));assert.ok(pattern('0012345678@EXAMPLE.INVALID').test('0012345678@example.invalid'));
  assert.equal(pattern('0012345678@example.invalid').test('0012345678@exampleXinvalid'),false);
});
test('empty query and malformed/oversized query validation do not broaden searches',()=>{
  assert.equal(v.personSearch(' \t '),null);assert.equal(v.personSearch(undefined),null);
  for(const input of [{q:'x'},['An'],10,'a'.repeat(121)])assert.throws(()=>v.personSearch(input));
  assert.equal(pattern('.*').test('Nguyễn An'),false);assert.ok(pattern('.*').test('literal .*'));
  for(const q of ['[a]','(x)','a+b','^a$','a|b','a\\b']){assert.ok(pattern(q).test(q));assert.equal(pattern(q).test('unrelated'),false);}
});
test('generic search and stored input are unchanged by person search',()=>{
  const name='Đặng Thị Ngọc';pattern(name);assert.equal(name,'Đặng Thị Ngọc');
  assert.equal(v.search('dang').test(name),false);
});

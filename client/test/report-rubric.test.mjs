import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REPORT_RUBRIC,rubricTotal,rubricComment} from '../src/components/business/reports/gradingRubric.mjs';

const scores=()=>Object.fromEntries(REPORT_RUBRIC.map(item=>[item.id,String(item.max)]));
test('grading weights total 100 and explicit zero is a valid teacher score',()=>{
  assert.equal(rubricTotal(scores()),100);
  assert.equal(rubricTotal(Object.fromEntries(REPORT_RUBRIC.map(item=>[item.id,'0']))),0);
});
test('missing criteria must not silently become zero',()=>{
  for(const raw of ['', ' ', undefined])assert.throws(()=>rubricTotal({...scores(),evidence:raw}));
});
test('reject scores beyond each criterion, negative numbers and excessive precision',()=>{
  for(const raw of ['21','-1','Infinity','NaN','10.001','1e1'])assert.throws(()=>rubricTotal({...scores(),evidence:raw}));
  assert.equal(rubricTotal({...scores(),evidence:'19.75'}),99.75);
});
test('saved comment contains the actual breakdown and teacher remarks without changing API fields',()=>{
  const text=rubricComment(scores(),{evidence:'Đã xem tài liệu kiểm thử.'},'Cần làm rõ phạm vi bàn giao.');
  assert.ok(text.includes('Kiểm thử và bằng chứng: 20/20 — Đã xem tài liệu kiểm thử.'));
  assert.ok(text.includes('Tổng điểm: 100/100'));
  assert.ok(text.includes('Cần làm rõ phạm vi bàn giao.'));
});
test('requires teacher comment and bounds persisted text',()=>{
  assert.throws(()=>rubricComment(scores(),{},' '));
  assert.throws(()=>rubricComment(scores(),{evidence:'x'.repeat(251)},'Nhận xét'));
  assert.throws(()=>rubricComment(scores(),{},'x'.repeat(5000)));
});

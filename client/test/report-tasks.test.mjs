import test from 'node:test';
import assert from 'node:assert/strict';
import {canIncludeTask,loadReportTasks,reportDraftFromTask} from '../src/api/reportTasks.js';

test('report dropdown includes finished/submitted work and excludes untouched tasks',()=>{
 assert.equal(canIncludeTask({status:'done'}),true);
 assert.equal(canIncludeTask({status:'review',submission:{submittedAt:'2026-11-06T00:00:00Z'}}),true);
 assert.equal(canIncludeTask({status:'in_progress',submission:{submittedAt:'2026-11-06T00:00:00Z'}}),true);
 assert.equal(canIncludeTask({status:'todo'}),false);
 assert.equal(canIncludeTask({status:'in_progress',progress:50}),false);
});
test('all result pages are loaded within the selected assignment, without collapsing identical titles',async()=>{
 const original=globalThis.fetch,storage=globalThis.localStorage,requests=[];
 globalThis.localStorage={getItem:()=>''};
 globalThis.fetch=async url=>{
  const query=new URL(url).searchParams;requests.push({assignmentId:query.get('assignmentId'),page:query.get('page')});
  const items=query.get('page')==='1'?[{_id:'a',title:'Same title',status:'done'},{_id:'pending',status:'todo'}]:[{_id:'b',title:'Same title',status:'done'},{_id:'a',title:'Same title',status:'done'}];
  return new Response(JSON.stringify({items,pages:2}),{status:200});
 };
 try{const tasks=await loadReportTasks('selected-assignment');assert.deepEqual(tasks.map(t=>t._id),['a','b']);assert.deepEqual(requests,[{assignmentId:'selected-assignment',page:'1'},{assignmentId:'selected-assignment',page:'2'}]);}finally{globalThis.fetch=original;globalThis.localStorage=storage;}
});
test('draft uses actual delivery text/link/filename, without inventing a completed result',()=>{
 const task={title:'Công việc đã nộp',description:'Yêu cầu gốc',status:'review',submission:{content:'Kết quả thực tế',link:'https://example.com/result',fileName:'Báo cáo.txt'}};
 const draft=reportDraftFromTask(task);assert.equal(draft.title,task.title);assert.ok(draft.content.includes('Kết quả thực tế'));assert.ok(draft.content.includes('https://example.com/result'));assert.ok(draft.content.includes('Báo cáo.txt'));assert.ok(draft.content.includes('Chờ xem xét'));assert.ok(!draft.content.includes('Hoàn thành'));
 const done=reportDraftFromTask({title:'Finished',status:'done',description:'Task requirements'});assert.ok(!done.content.includes('Kết quả đã nộp:'));assert.ok(!done.content.includes('undefined'));
});

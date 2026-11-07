const {test}=require('node:test'),assert=require('node:assert/strict');
const {variants,load}=require('../src/core/reportPractice');
test('completed report practice provides full and incomplete short texts without pretending new submissions',()=>{
 const rows=variants({student:'Sinh viên mẫu',company:'Doanh nghiệp mẫu',batch:'Học kỳ II 2025–2026',topic:'Quản lý kho',start:'2026-06-01',end:'2026-08-31',done:3,total:3,approvedMinutes:960});
 assert.equal(rows.length,3);assert.equal(new Set(rows.map(r=>r.id)).size,3);assert.ok(rows[0].content.length>rows[1].content.length&&rows[1].content.length>rows[2].content.length);
 assert.ok(rows.every(r=>r.content.includes('KHÔNG THAY BÁO CÁO ĐÃ DUYỆT')&&r.content.includes('Quản lý kho')));
 assert.ok(rows[0].content.includes('960 phút'));assert.ok(rows.every(r=>r.content.length<50000));
});
test('practice loader denies other roles before any database operation',async()=>{
 for(const role of ['student','company','admin'])await assert.rejects(load({role},'not-an-id'),e=>e.status===403);
});

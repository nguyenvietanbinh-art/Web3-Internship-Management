import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {importCvFields} from '../src/components/business/cv/importCvFields.mjs';
test('backend document maps explicit sections, skills and /4 GPA',()=>{
 const fields=importCvFields(readFileSync(new URL('../../docs/sample-cvs/02-backend.md',import.meta.url),'utf8'));
 assert.deepEqual(fields.skills,['JavaScript','Node.js','Express','MongoDB','REST API','Git']);
 assert.equal(fields.gpa,3.05);assert.ok(fields.summary.includes('Tìm công việc'));
 assert.ok(fields.education.includes('Sinh viên'));assert.ok(fields.experience.includes('quản lý thư viện'));
 assert.ok(!fields.experience.includes('THỜI GIAN'));assert.equal(fields.university,undefined);
});
test('unknown or empty documents do not invent structured fields',()=>{
 assert.deepEqual(importCvFields(''),{});assert.deepEqual(importCvFields(null),{});
 assert.deepEqual(importCvFields('Nguyễn Văn A\nTôi thích viết phần mềm.'),{});
});
test('English sections and explicit university work; /10 GPA is not converted',()=>{
 const fields=importCvFields('Summary\nBuild APIs\nSkills:\nPython; SQL\nEducation\nComputer Science\nExperience\nLibrary API\nContact\nmail@example.invalid\nUniversity: Example College\nGPA: 8/10');
 assert.equal(fields.summary,'Build APIs');assert.deepEqual(fields.skills,['Python','SQL']);
 assert.equal(fields.experience,'Library API');assert.equal(fields.university,'Example College');assert.equal(fields.gpa,undefined);
});

test('An Binh CV keeps projects out of skills and preserves experience and availability',()=>{
 const text=readFileSync(new URL('../../docs/sample-cvs/10-nguyen-viet-an-binh.md',import.meta.url),'utf8');
 const fields=importCvFields(text);
 assert.deepEqual(fields.skills,['JavaScript','HTML','CSS','React','Node.js','Express','MongoDB','REST API','Git','SQL']);
 assert.ok(fields.experience.includes('Website quản lý sản phẩm'));
 assert.ok(fields.experience.includes('Chủ động trao đổi'));
 assert.ok(!fields.experience.includes('Dự kiến tham gia'));
 assert.ok(fields.summary.includes('4 ngày mỗi tuần'));
 assert.ok(fields.summary.includes('bảo mật API'));
 assert.equal(fields.gpa,3.2);
 assert.equal(fields.university,undefined);
 // DOCX extraction supplies plain heading lines rather than Markdown headings.
 assert.deepEqual(importCvFields(text.replace(/^## /gm,'')),fields);
});

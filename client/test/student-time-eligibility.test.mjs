import {test} from 'node:test';import assert from 'node:assert/strict';import {checkInReason} from '../src/components/business/timeEligibility.mjs';
const now=new Date('2026-11-07T03:00:00Z'),a={lifecycle:'active',startDate:'2026-11-01T00:00:00Z',endDate:'2026-12-01T00:00:00Z'};
test('manual attendance explains missing, unstarted, completed and out-of-window placements',()=>{
 assert.match(checkInReason(null,[],now),/Chọn/);assert.match(checkInReason({...a,lifecycle:'approved'},[],now),/xác nhận bắt đầu/);assert.match(checkInReason({...a,lifecycle:'completed'},[],now),/hoàn thành/);assert.match(checkInReason({...a,startDate:'2026-11-10'},[],now),/Chưa đến/);assert.match(checkInReason({...a,endDate:'2026-11-05'},[],now),/Đã qua/);assert.match(checkInReason({...a,startDate:'invalid'},[],now),/chưa hợp lệ/);
});
test('open and same-day sessions block duplicate check-in; legitimate active placement requires no wallet',()=>{
 assert.match(checkInReason(a,[{state:'open',checkInAt:'2026-11-06T01:00:00Z'}],now),/chưa kết thúc/);assert.match(checkInReason(a,[{state:'pending',checkInAt:'2026-11-07T01:00:00Z'}],now),/phiên giờ làm/);assert.equal(checkInReason(a,[{state:'approved',checkInAt:'2026-11-06T01:00:00Z'}],now),'');assert.equal(checkInReason(a,[],now),'');
});

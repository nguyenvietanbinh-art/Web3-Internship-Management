import test from 'node:test';import assert from 'node:assert/strict';
import {displayLabel} from '../src/components/business/content.js';
import {errorMessage} from '../src/api/errorMessages.js';
test('Vietnamese presentation leaves stored status and unknown values untouched',()=>{
 const record={state:'approved'};assert.equal(displayLabel(record.state),'Đã duyệt');assert.equal(record.state,'approved');assert.equal(displayLabel('CUSTOM_STATUS'),'CUSTOM_STATUS');assert.equal(displayLabel('NOT_TRAINED'),'Chưa được huấn luyện');assert.equal(displayLabel('toString'),'toString');assert.equal(displayLabel('prepared'),'Đã chuẩn bị');assert.equal(displayLabel('mint'),'Cấp chứng nhận');
});
test('unavailable integrations remain unavailable without displaying internal setup fields',()=>{
 assert.match(errorMessage('internal collection names','IDENTITY_INDEX_REVIEW_REQUIRED'),/chưa sẵn sàng/);assert.match(errorMessage('private key details','REPORT_KEY_MISSING'),/chưa sẵn sàng/);assert.ok(!errorMessage('NLP_SERVICE_URL invalid').includes('NLP_SERVICE_URL'));
});
test('meaningful validation and privacy warnings are preserved',()=>{
 for(const message of ['Email hoặc mật khẩu không đúng','Mật khẩu cần ít nhất 10 ký tự, tối đa 72 byte UTF-8','Không gửi báo cáo công khai','Chưa thể xác minh chứng nhận'])assert.equal(errorMessage(message),message);
});

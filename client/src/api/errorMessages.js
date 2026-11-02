// User-facing wording only; status, code, validation and API contracts stay unchanged.
export function errorMessage(message,code){
 const known={INDEX_REVIEW_REQUIRED:'Hệ thống chưa sẵn sàng. Vui lòng liên hệ quản trị viên.',IDENTITY_INDEX_REVIEW_REQUIRED:'Đăng nhập chưa sẵn sàng. Vui lòng liên hệ quản trị viên.',FORBIDDEN_ROLE:'Bạn không có quyền thực hiện thao tác này.',CHAIN_DEPLOYMENT_MISMATCH:'Mạng blockchain đã thay đổi. Chưa thể xác minh dữ liệu.',WEB3_NOT_CONFIGURED:'Chức năng blockchain hiện chưa sẵn sàng.',WEB3_UNSAFE_CONFIG:'Cấu hình blockchain chưa hợp lệ. Vui lòng liên hệ quản trị viên.',REPORT_KEY_MISSING:'Lưu trữ báo cáo chưa sẵn sàng.',IPFS_NOT_CONFIGURED:'Lưu trữ IPFS chưa sẵn sàng. Báo cáo chưa được tải lên.'};
 if(Object.hasOwn(known,code))return known[code];
 if(typeof message!=='string')return 'Không thể hoàn tất thao tác. Vui lòng thử lại.';
 if(/^NLP đang bận/.test(message))return 'Dịch vụ phân tích đang bận. Vui lòng thử lại.';
 if(/^NLP_SERVICE_URL|^NLP chỉ được|^NLP chưa sẵn sàng/.test(message))return 'Dịch vụ phân tích chưa sẵn sàng. Vui lòng thử lại.';
 if(message==='Dữ liệu NLP không hợp lệ')return 'Nội dung phân tích không hợp lệ.';
 return message;
}

# Điểm danh, QR, GPS và địa điểm

`services/qrGps.js` ký QR có TTL15–300giây, audience/issuer, nonce hash, assignment và chủ sinh viên. Sai quyền/chữ ký/thời hạn/vị trí không ghi giờ làm. Nonce dùng một lần; cạnh tranh chỉ một lần nhận. GPS phải mới, sai số trong ngưỡng; điều kiện khoảng cách + sai số <= bán kính. GPS client không phải chứng cứ tuyệt đối chống giả mạo.

Đã thêm `Company.locations`, `/core/company/locations` GET/POST company-only, tọa độ hợp lệ, bán kính20–300m, sai số1–100m, xác nhận chủ động, optimistic version, tối đa30; không xóa địa điểm. QR có thể chọn locationId thuộc đúng doanh nghiệp; không cho caller vừa chọn locationId vừa ghi đè tọa độ. UI `CompanyLocations.jsx` có tên/địa chỉ/tọa độ, nút lấy vị trí và link bản đồ; mở/đổi trường không tự ghi.

Kiểm thử QR/GPS trong web3.json sử dụng tọa độ TEST; check-out thực tế0phút được giữ0. Sau đó doanh nghiệp TEST chủ động điều chỉnh55phút có lý do/lịch sử và duyệt, không trình bày55phút là giờ lao động thực.

**BLOCKED:** chưa tích hợp live Google Maps Places autocomplete/marker ngay trong web vì chưa có key và cấu hình provider. Link mở bản đồ không được tính là SDK đã tích hợp. Khi có quyền cấu hình, dùng API Places hiện hành, hạn chế referrer/quota/key; không đưa khóa Backend lên FE. Tham khảo [tài liệu chính thức Google](https://developers.google.com/maps/documentation/javascript/examples/place-autocomplete-element). Không tự bật thanh toán hay cài dependency. Camera/GPS điện thoại thực và điều kiện mất quyền: NOT TESTED trên thiết bị vật lý.

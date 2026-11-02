import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QrCode({ token }) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(token, { scale: 6, margin: 4, errorCorrectionLevel: 'M' })
      .then(url => { if (active) setResult({ token, url }); })
      .catch(() => { if (active) setResult({ token, error: 'Không tạo được ảnh QR; dùng mã phiên dự phòng.' }); });
    return () => { active = false; };
  }, [token]);
  const current = result?.token === token ? result : null;
  if (current?.error) return <p role="alert" className="is-error">{current.error}</p>;
  return current?.url ? <img data-testid="session-qr-image" className="session-qr-image" src={current.url} alt="QR phiên điểm danh có thời hạn, chỉ dành cho sinh viên được phân công" /> : <p role="status">Đang tạo ảnh QR trên thiết bị…</p>;
}

import { useEffect, useRef } from 'react';
import { createQrReader } from './qrDecoder';
export default function NativeQrScanner({onDecoded,onError}) {
  const video=useRef(null);
  useEffect(()=>{
    let active=true,controls,stream;
    const preview=video.current;
    const stop=()=>{controls?.stop();stream?.getTracks().forEach(track=>track.stop());if(preview?.srcObject===stream)preview.srcObject=null;};
    (async()=>{try{
      if(!window.isSecureContext)throw new Error('Camera cần kết nối HTTPS an toàn; có thể nhập mã dự phòng.');
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera chưa khả dụng. Vui lòng kiểm tra quyền truy cập và kết nối an toàn.');
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      // React StrictMode may dispose the effect while camera permission is pending.
      // Never attach that obsolete stream to the current preview/decoder.
      if(!active){stop();return;}
      const reader=createQrReader();
      controls=await reader.decodeFromStream(stream,preview,(result)=>{if(active&&result){active=false;stop();onDecoded(result.getText());}});
      if(!active)stop();
    }catch(error){stop();if(active)onError(error.name==='NotAllowedError'?'Quyền camera bị từ chối; có thể nhập mã dự phòng.':error.message);}})();
    return()=>{active=false;stop();};
  },[onDecoded,onError]);
  return <video ref={video} playsInline muted aria-label="Camera quét QR" className="web3-camera" />;
}

import AdminCertificatePage from './AdminCertificatePage';
import { displayLabel } from './content';
import { useState, useCallback, useRef, lazy, Suspense } from 'react';
import { apiRequest } from '../../api/client';
import { Panel, Select, Text, Area, ActionForm, ErrorNotice, AssignmentPicker } from './Shared';
import { useResource, active, dateLabel } from './hooks';
import CompanyLocations from './CompanyLocations';
const Scanner=lazy(()=>import('./NativeQrScanner'));
const QrCode=lazy(()=>import('./QrCode'));
function position(){return new Promise((resolve,reject)=>{if(!window.isSecureContext)return reject(new Error('GPS cần kết nối HTTPS an toàn.'));if(!navigator.geolocation)return reject(new Error('Trình duyệt không có vị trí GPS.'));navigator.geolocation.getCurrentPosition(p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy,timestamp:p.timestamp}),e=>reject(new Error(e.code===1?'Quyền vị trí bị từ chối; chưa ghi điểm danh.':e.code===3?'GPS timeout; thử lại.':'Không lấy được vị trí; thử lại.')),{enableHighAccuracy:true,maximumAge:0,timeout:10000});});}
export default function Web3Page(props){return props.user.role==='admin'?<AdminCertificatePage/>:<ParticipantWeb3Page {...props}/>;}
function ParticipantWeb3Page({user}) {
  const requestLock=useRef(false),selectionRef=useRef(null);
  const personal=user.role==='student';

  const selectionTitle={student:'Hồ sơ thực tập của tôi',company:'Hồ sơ sinh viên tại doanh nghiệp',mentor:'Hồ sơ sinh viên tôi phụ trách'}[user.role];

  const [assignment,setAssignment]=useState(null),[revision,setRevision]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(false),[qr,setQr]=useState(null),[token,setToken]=useState(''),[camera,setCamera]=useState(false);
  const [geo,setGeo]=useState({action:'checkin',centerLat:'',centerLon:'',radiusMeters:'100',maxAccuracyMeters:'30',ttlSeconds:'120'}),field=(k,v)=>setGeo(s=>({...s,[k]:v}));
  const [locationId,setLocationId]=useState('');
  const locations=useResource(user.role==='company'?'/core/company/locations':null,revision);
  const run=async fn=>{if(requestLock.current)return null;requestLock.current=true;setError('');setBusy(true);try{return await fn();}catch(e){setError(e.message);return null;}finally{requestLock.current=false;setBusy(false);setRevision(n=>n+1);}};
  const decoded=useCallback(value=>{setToken(value);setCamera(false);},[]),cameraError=useCallback(message=>{setError(message);setCamera(false);},[]);
  const changeAssignment=value=>{selectionRef.current=value?._id||null;setAssignment(value);setQr(null);setError('');};
  return <div className="business-stack">
    {!personal&&<Panel title={selectionTitle}>
      <ErrorNotice message={error}/>
      {user.role!=='company'&&<AssignmentPicker userRole={user.role} value={assignment} onChange={changeAssignment}/>}
    </Panel>}
    {user.role==='company'&&<Panel title="Tạo mã QR điểm danh cho sinh viên" description="Chọn sinh viên có phân công thực tập, vị trí và thời hạn điểm danh.">
      <AssignmentPicker userRole="company" value={assignment} onChange={changeAssignment}/>
      {!assignment?<p role="status">Tìm và chọn sinh viên, sau đó chọn kỳ/phân công cần điểm danh.</p>:<p role="status">Sinh viên: {assignment.studentName||assignment.participantNames?.student||'Đã chọn'} · {displayLabel(assignment.lifecycle)} · {dateLabel(assignment.startDate)} → {dateLabel(assignment.endDate)}{!active(assignment)&&' — Chỉ tạo QR khi phân công đang thực tập và trong thời gian được phép.'}</p>}
      <ErrorNotice message={locations.error}/><CompanyLocations data={locations.data} onSaved={result=>{setLocationId(result.items.at(-1).id);setRevision(n=>n+1);}}/>
      <Select label="Địa điểm điểm danh đã lưu" value={locationId} onChange={setLocationId} options={[{value:'',label:'Chọn địa điểm điểm danh'},...(locations.data?.items||[]).map(l=>({value:l.id,label:l.label+' · '+l.address}))]}/>
      <button className="btn btn-secondary" disabled={busy} onClick={()=>run(async()=>{const p=await position();setGeo(s=>({...s,centerLat:String(p.latitude),centerLon:String(p.longitude)}));return{centerFromClient:true};})}>Lấy vị trí từ thiết bị</button>
      {!locationId&&geo.centerLat!==''&&geo.centerLon!==''&&<p role="status">Đã lấy vị trí điểm danh từ thiết bị.</p>}
      <ActionForm key={assignment?._id||'no-qr-student'} disabled={!active(assignment)} submit="Tạo QR có thời hạn" onSaved={result=>{if(selectionRef.current===assignment?._id)setQr(result);}} onSubmit={()=>{if(!active(assignment))throw new Error('Chọn sinh viên có phân công đang thực tập và còn thời hạn trước khi tạo QR.');if(!locationId&&(geo.centerLat===''||geo.centerLon===''))throw new Error('Chọn địa điểm đã lưu hoặc lấy vị trí từ thiết bị trước khi tạo QR.');return apiRequest('/core/web3/qr/issue',{method:'POST',body:{assignmentId:assignment._id,action:geo.action,...(locationId?{locationId}:{centerLat:Number(geo.centerLat),centerLon:Number(geo.centerLon),radiusMeters:Number(geo.radiusMeters),maxAccuracyMeters:Number(geo.maxAccuracyMeters)}),ttlSeconds:Number(geo.ttlSeconds)}});}}>
        <Select label="Thao tác QR" value={geo.action} onChange={v=>field('action',v)} options={[{value:'checkin',label:'Check-in'},{value:'checkout',label:'Check-out'}]} />
        <div className="business-grid"><Text label="Thời hạn QR giây" type="number" min="15" max="300" required value={geo.ttlSeconds} onChange={v=>field('ttlSeconds',v)} /></div>
      </ActionForm>{qr&&<div><p>Hết hạn: {new Date(qr.expiresAt).toLocaleString('vi-VN')} · {displayLabel(qr.action)}</p><Suspense fallback={<p>Đang tạo mã QR…</p>}><QrCode token={qr.token} /></Suspense><textarea className="input-field" readOnly aria-label="Mã QR đã tạo" value={qr.token} rows={5} /><p className="muted">QR tạo cục bộ, có chữ ký và nonce một lần; chỉ chia sẻ cho sinh viên được phân công. Có thể nhập mã dự phòng.</p></div>}
    </Panel>}
    {user.role==='student'&&<Panel title="Điểm danh thực tập bằng QR/GPS" description="Cần quyền camera và vị trí. GPS có sai số và không bảo đảm chống giả mạo tuyệt đối.">
      <ErrorNotice message={error}/><Area label="Mã phiên QR" value={token} onChange={setToken} maxLength={4096} /><div className="business-actions"><button className="btn btn-secondary" onClick={()=>{setError('');setCamera(true);}}>Mở camera quét QR</button><button className="btn btn-primary" disabled={busy||!token.trim()} onClick={()=>run(async()=>apiRequest('/core/web3/qr/redeem',{method:'POST',body:{token:token.trim(),position:await position()}}))}>Lấy GPS & xác thực QR giờ làm</button></div>
      {camera&&<><Suspense fallback={<p>Đang mở camera…</p>}><Scanner onDecoded={decoded} onError={cameraError} /></Suspense><button className="btn btn-secondary" onClick={()=>setCamera(false)}>Dừng camera</button></>}
    </Panel>}

  </div>;
}

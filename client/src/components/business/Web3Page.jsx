import AdminCertificatePage from './AdminCertificatePage';
import BlockchainHistory from './BlockchainHistory';
import { displayLabel } from './content';
import { useState, useCallback, lazy, Suspense } from 'react';
import { apiRequest } from '../../api/client';
import { Panel, Select, Text, Area, ActionForm, ErrorNotice, AssignmentPicker } from './Shared';
import { useResource } from './hooks';
import CompanyLocations from './CompanyLocations';
const Scanner=lazy(()=>import('./NativeQrScanner'));
const QrCode=lazy(()=>import('./QrCode'));
function position(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('Trình duyệt không có vị trí GPS.'));navigator.geolocation.getCurrentPosition(p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy,timestamp:p.timestamp}),e=>reject(new Error(e.code===1?'Quyền vị trí bị từ chối; chưa ghi điểm danh.':e.code===3?'GPS timeout; thử lại.':'Không lấy được vị trí; thử lại.')),{enableHighAccuracy:true,maximumAge:0,timeout:10000});});}
export default function Web3Page(props){return props.user.role==='admin'?<AdminCertificatePage/>:<ParticipantWeb3Page {...props}/>;}
function ParticipantWeb3Page({user,unified=false,onWalletSettings}) {
  const personal=user.role==='student';
  const showWalletNetwork=['student','company'].includes(user.role);
  const showCertificateTools=['student','company','admin'].includes(user.role);
  const selectionTitle={student:'Hồ sơ thực tập của tôi',company:'Hồ sơ sinh viên tại doanh nghiệp',mentor:'Hồ sơ sinh viên tôi phụ trách',admin:'Hồ sơ cấp chứng nhận'}[user.role];
  const [assignment,setAssignment]=useState(null),[revision,setRevision]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(false),[last,setLast]=useState(null),[certificate,setCertificate]=useState(null),[timeId,setTimeId]=useState(''),[qr,setQr]=useState(null),[token,setToken]=useState(''),[camera,setCamera]=useState(false),[walletNetwork,setWalletNetwork]=useState('Chưa kiểm tra mạng ví');
  const [geo,setGeo]=useState({action:'checkin',centerLat:'',centerLon:'',radiusMeters:'100',maxAccuracyMeters:'30',ttlSeconds:'120'}),field=(k,v)=>setGeo(s=>({...s,[k]:v}));
  const status=useResource('/core/web3/status',revision),suffix=assignment?'&assignmentId='+assignment._id:'';
  const [locationId,setLocationId]=useState('');
  const locations=useResource(user.role==='company'?'/core/company/locations':null,revision);
  const times=useResource('/core/time/sessions?limit=100'+suffix,revision),operations=useResource(showCertificateTools&&assignment?'/core/web3/placements/'+assignment._id+'/operations':null,revision);
  const run=async fn=>{setError('');setCertificate(null);setLast(null);setBusy(true);try{const result=await fn();setLast(result);return result;}catch(e){setError(e.message);return null;}finally{setBusy(false);setRevision(n=>n+1);}};
  const post=path=>run(()=>apiRequest(path,{method:'POST',body:{}}));
  const scoped=!!assignment,canChain=!unified||user.role!=='student'||user.walletVerified===true;
  const decoded=useCallback(value=>{setToken(value);setCamera(false);},[]),cameraError=useCallback(message=>{setError(message);setCamera(false);},[]);
  const changeAssignment=value=>{setAssignment(value);setTimeId('');setQr(null);setCertificate(null);setLast(null);setError('');};
  return <div className="business-stack">
    {!canChain&&<Panel title="Bạn cần liên kết ví để sử dụng chức năng blockchain" description="Liên kết ví đã xác minh để ghi bằng chứng và sử dụng chứng nhận."><button className="btn btn-primary" onClick={onWalletSettings}>Đi đến Cài đặt ví</button></Panel>}
    <Panel title={selectionTitle} description="Mạng thử nghiệm Hardhat 31337. Hệ thống gửi giao dịch theo quyền; không sử dụng ví hoặc tài sản thật.">
      <ErrorNotice message={status.error||error} /><p role="status">{status.loading?'Đang kiểm tra kết nối…':status.data?.chain.available?'Mạng thử nghiệm đã kết nối':'Kết nối blockchain chưa sẵn sàng'}</p>
      {status.data?.chain.contractAddress&&<details><summary>Chi tiết mạng</summary><p className="web3-reference">Hợp đồng: {status.data.chain.contractAddress} · Bên phát hành: {status.data.chain.attestor}</p></details>}
      {showWalletNetwork&&<><button className="btn btn-secondary" disabled={busy} onClick={()=>run(async()=>{if(!window.ethereum?.request)throw new Error('Chưa kết nối ví.');const chainId=await window.ethereum.request({method:'eth_chainId'});setWalletNetwork('Mạng ví: '+Number(BigInt(chainId))+'; hệ thống chỉ gửi giao dịch trên mạng thử nghiệm 31337.');return{walletChainId:chainId};})}>Kiểm tra mạng ví</button><p>{walletNetwork}</p></>}
      <AssignmentPicker userRole={user.role} value={assignment} onChange={changeAssignment} />
    </Panel>
    {['company','admin'].includes(user.role)&&<Panel title="Bằng chứng giờ làm đã duyệt" description="Ghi bằng chứng cho giờ làm đã duyệt; không xác nhận tuyệt đối vị trí GPS.">
      <ErrorNotice message={times.error} /><Select label="Phiên giờ làm Web3" value={timeId} onChange={setTimeId} options={[{value:'',label:'Chọn phiên đã duyệt có phút dương'},...(times.data?.items||[]).filter(t=>t.state==='approved'&&t.minutes>0).map(t=>({value:t._id,label:String(t.studentWallet||t.studentUserId||'').slice(0,8)+' · '+t.minutes+' phút · '+displayLabel(t.proof.provider)}))]} />
      <button className="btn btn-primary" disabled={busy||!scoped||!timeId} onClick={()=>post('/core/web3/time/'+timeId+'/anchor')}>Ghi bằng chứng giờ làm</button>
    </Panel>}
    {user.role==='admin'&&<Panel title="Phê duyệt hoàn tất & cấp chứng nhận thực tập" description="Chỉ phát hành khi hoàn tất thực tập, đủ KPI, báo cáo cuối kỳ và giờ làm được duyệt, bằng chứng được xác nhận.">
      <div className="business-actions"><button className="btn btn-secondary" disabled={busy||!scoped} onClick={()=>post('/core/web3/placements/'+assignment._id+'/complete')}>Ghi phê duyệt hoàn tất</button><button className="btn btn-primary" disabled={busy||!scoped} onClick={()=>post('/core/web3/placements/'+assignment._id+'/mint')}>Cấp chứng nhận SBT</button></div>
    </Panel>}
    {showCertificateTools&&<Panel title={personal?'Chứng nhận thực tập của tôi':'Tra cứu & xác minh chứng nhận thực tập'} description="Chứng nhận chỉ hợp lệ khi được xác minh trực tiếp trên blockchain.">
      <button className="btn btn-primary" disabled={busy||!canChain||!scoped} onClick={async()=>{const result=await run(()=>apiRequest('/core/web3/placements/'+assignment._id+'/certificate'));if(result?.verified)setCertificate(result);}}>Xác minh chứng nhận trên blockchain</button>
      {certificate?.verified&&<div data-testid="live-sbt-certificate"><span className="badge badge-approved">ĐÃ XÁC MINH · KHÔNG CHUYỂN NHƯỢNG</span><p>Mã chứng nhận: {certificate.tokenId} · Mạng: {certificate.chainId} · {certificate.standard}</p><p className="web3-reference">Chủ sở hữu: {certificate.owner}<br/>Hợp đồng: {certificate.contractAddress}<br/>Giao dịch: {certificate.txHash}</p><p>Chứng nhận do đơn vị phát hành xác nhận, không công khai nội dung báo cáo cá nhân và không thể chuyển nhượng.</p></div>}
    </Panel>}
    {user.role==='company'&&<Panel title="Tạo mã QR điểm danh cho sinh viên" description="Chọn sinh viên có phân công thực tập, vị trí và thời hạn điểm danh.">
      <ErrorNotice message={locations.error}/><CompanyLocations data={locations.data} onSaved={result=>{setLocationId(result.items.at(-1).id);setRevision(n=>n+1);}}/>
      <Select label="Địa điểm điểm danh đã lưu" value={locationId} onChange={setLocationId} options={[{value:'',label:'Nhập tọa độ riêng cho phiên QR'},...(locations.data?.items||[]).map(l=>({value:l.id,label:l.label+' · '+l.address}))]}/>
      <button className="btn btn-secondary" disabled={busy} onClick={()=>run(async()=>{const p=await position();setGeo(s=>({...s,centerLat:String(p.latitude),centerLon:String(p.longitude)}));return{centerFromClient:true};})}>Lấy vị trí tâm từ thiết bị</button>
      <ActionForm submit="Tạo QR có thời hạn" onSaved={setQr} onSubmit={()=>{if(!assignment)throw new Error('Chọn phân công active trước.');return apiRequest('/core/web3/qr/issue',{method:'POST',body:{assignmentId:assignment._id,action:geo.action,...(locationId?{locationId}:{centerLat:Number(geo.centerLat),centerLon:Number(geo.centerLon),radiusMeters:Number(geo.radiusMeters),maxAccuracyMeters:Number(geo.maxAccuracyMeters)}),ttlSeconds:Number(geo.ttlSeconds)}});}}>
        <Select label="Thao tác QR" value={geo.action} onChange={v=>field('action',v)} options={[{value:'checkin',label:'Check-in'},{value:'checkout',label:'Check-out'}]} />
        <div className="business-grid"><Text label="Vĩ độ tâm QR" type="number" step="any" min="-90" max="90" required={!locationId} disabled={Boolean(locationId)} value={geo.centerLat} onChange={v=>field('centerLat',v)} /><Text label="Kinh độ tâm QR" type="number" step="any" min="-180" max="180" required={!locationId} disabled={Boolean(locationId)} value={geo.centerLon} onChange={v=>field('centerLon',v)} /><Text label="Bán kính QR mét" type="number" min="20" max="300" required={!locationId} disabled={Boolean(locationId)} value={geo.radiusMeters} onChange={v=>field('radiusMeters',v)} /><Text label="Sai số GPS tối đa mét" type="number" min="1" max="100" required={!locationId} disabled={Boolean(locationId)} value={geo.maxAccuracyMeters} onChange={v=>field('maxAccuracyMeters',v)} /><Text label="Thời hạn QR giây" type="number" min="15" max="300" required value={geo.ttlSeconds} onChange={v=>field('ttlSeconds',v)} /></div>
      </ActionForm>{qr&&<div><p>Hết hạn: {new Date(qr.expiresAt).toLocaleString('vi-VN')} · {displayLabel(qr.action)}</p><Suspense fallback={<p>Đang tạo mã QR…</p>}><QrCode token={qr.token} /></Suspense><textarea className="input-field" readOnly aria-label="Mã QR đã tạo" value={qr.token} rows={5} /><p className="muted">QR tạo cục bộ, có chữ ký và nonce một lần; chỉ chia sẻ cho sinh viên được phân công. Có thể nhập mã dự phòng.</p></div>}
    </Panel>}
    {user.role==='student'&&<Panel title="Điểm danh thực tập bằng QR/GPS" description="Cần quyền camera và vị trí. GPS có sai số và không bảo đảm chống giả mạo tuyệt đối.">
      <Area label="Mã phiên QR" value={token} onChange={setToken} maxLength={4096} /><div className="business-actions"><button className="btn btn-secondary" onClick={()=>{setError('');setCamera(true);}}>Mở camera quét QR</button><button className="btn btn-primary" disabled={busy||!token.trim()} onClick={()=>run(async()=>apiRequest('/core/web3/qr/redeem',{method:'POST',body:{token:token.trim(),position:await position()}}))}>Lấy GPS & xác thực QR giờ làm</button></div>
      {camera&&<><Suspense fallback={<p>Đang mở camera…</p>}><Scanner onDecoded={decoded} onError={cameraError} /></Suspense><button className="btn btn-secondary" onClick={()=>setCamera(false)}>Dừng camera</button></>}
    </Panel>}
    {showCertificateTools&&<Panel title="Lịch sử ghi nhận trên blockchain" description="Theo dõi giao dịch và đối chiếu trạng thái khi cần.">
      <ErrorNotice message={operations.error} /><BlockchainHistory key={assignment?._id||'none'} items={operations.data?.items||[]} studentName={assignment?.participantNames?.student||assignment?.studentName||assignment?.student?.name}/>
      {import.meta.env.DEV && import.meta.env.VITE_SHOW_DIAGNOSTICS==='true' && last&&<details data-testid="web3-last-result" open><summary>Kết quả thao tác thực tế</summary><pre>{JSON.stringify(last,null,2)}</pre></details>}
    </Panel>}
  </div>;
}

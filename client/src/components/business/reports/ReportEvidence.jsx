import {useState} from 'react';
import {apiRequest} from '../../../api/client';
import {useResource} from '../hooks';
import {Panel,Select,ErrorNotice} from '../Shared';
import {displayLabel} from '../content';

export default function ReportEvidence({report,user,unified=false}){
 const [revision,setRevision]=useState(0),[artifactId,setArtifactId]=useState(''),[file,setFile]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const status=useResource('/core/web3/status',revision),artifacts=useResource('/core/web3/reports/'+report._id+'/artifacts',revision);
 const ipfsReady=status.data?.ipfs.pinata&&status.data?.ipfs.externalUploadEnabled&&status.data?.ipfs.encryptionKey;
 const canChain=!unified||user.role!=='student'||user.walletVerified===true;
 const run=async(path,body,success)=>{if(busy)return;setBusy(true);setError('');setMessage('');try{await apiRequest(path,{method:'POST',body});setMessage(success);setRevision(n=>n+1);}catch(e){setError(e.message);}finally{setBusy(false);}};
 const base='/core/web3/reports/'+report._id;
 return <Panel title={user.role==='student'?'Lưu trữ & bằng chứng báo cáo của tôi':'Bằng chứng báo cáo thực tập'} description="Lưu trữ và ghi bằng chứng cho bài báo cáo đang xem. Các thao tác này không thay thế việc nộp bài hoặc duyệt kết quả.">
  <p><strong>{report.title}</strong> · Phiên bản {report.version} · {displayLabel(report.state)}</p>
  <ErrorNotice message={status.error||artifacts.error||error}/>
  {status.loading||artifacts.loading?<p role="status">Đang kiểm tra bản lưu báo cáo…</p>:null}
  {!status.loading&&!status.error&&!ipfsReady&&<p role="status">Dịch vụ lưu trữ IPFS chưa sẵn sàng.</p>}
  <Select label="Bản lưu IPFS đã xác minh" value={artifactId} onChange={setArtifactId} options={[{value:'',label:'Chỉ hash nội dung báo cáo, không CID'},...(artifacts.data?.items||[]).filter(a=>a.state==='verified').map(a=>({value:a.id,label:a.cid}))]}/>
  {(artifacts.data?.items||[]).map(a=><p key={a.id} className="web3-reference">Bản lưu: {displayLabel(a.state)} · CID: {a.cid||'chưa có'} · {a.errorCode||''}</p>)}
  {user.role==='student'&&<>
   <button type="button" className="btn btn-secondary" disabled={busy||!ipfsReady} onClick={()=>run(base+'/ipfs',{confirmEncryptedUpload:true},'Đã lưu và xác minh bản báo cáo trên IPFS.')}>Lưu báo cáo lên IPFS</button>
   <input className="input-field" type="file" accept=".pdf,.docx" aria-label="Tệp báo cáo riêng tư PDF DOCX" onChange={e=>setFile(e.target.files?.[0]||null)}/>
   <button type="button" className="btn btn-secondary" disabled={busy||!file||!ipfsReady} onClick={()=>run(base+'/ipfs/file',file,'Đã lưu và xác minh tệp đính kèm.')}>Lưu tệp đính kèm</button>
  </>}
  {!canChain&&<p>Liên kết ví đã xác minh trong Hồ sơ cá nhân để ghi bằng chứng blockchain.</p>}
  <button type="button" className="btn btn-primary" disabled={busy||!canChain||!report.assignmentId||report.state!=='approved'||!report.current} onClick={()=>run(base+'/anchor',artifactId?{artifactId}:{},'Đã gửi yêu cầu ghi bằng chứng. Kiểm tra trạng thái giao dịch trong mục chứng nhận.')}>Ghi bằng chứng báo cáo</button>
  <p className="muted">Chỉ ghi bằng chứng báo cáo cuối kỳ hiện hành đã duyệt. Báo cáo được mã hóa trước khi lưu IPFS; ghi hash không đồng nghĩa đã tải lên IPFS.</p>
  {message&&<p role="status">{message}</p>}
 </Panel>;
}

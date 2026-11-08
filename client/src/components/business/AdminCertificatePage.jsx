import {useRef,useState} from 'react';
import {useViewMemory} from '../viewStateStore';
import {Dialog} from '../ui';
import {Panel,Select,ErrorNotice} from './Shared';
import {Resource,Rows,Pager} from './workflow/common';
import {useResource,dateLabel} from './hooks';
import {apiRequest} from '../../api/client';
import {displayLabel} from './content';
import SupervisionStudentFinder from './SupervisionStudentFinder';
import BlockchainHistory from './BlockchainHistory';

export default function AdminCertificatePage(){
 const [student,setStudent]=useViewMemory('certificate-student',null),[filters,setFilters]=useViewMemory('certificate-filters',{batchId:'',companyUserId:'',mentorUserId:''});
 const selectionRef=useRef(null);
 const [assignment,setAssignment]=useState(null),[page,setPage]=useState(1),[busy,setBusy]=useState(false);
 const options=useResource('/core/admin/supervision/filters'),status=useResource('/core/web3/status');
 const params=new URLSearchParams({...filters,page:String(page),limit:'10',...(student?{studentUserId:student._id}:{})});
 const overview=useResource('/core/admin/supervision/assignments?'+params);
 const pick=s=>{setStudent(s);setAssignment(null);setPage(1);};
 return <div className="business-stack"><Panel title="Tra cứu hồ sơ cấp chứng nhận"><ErrorNotice message={options.error||status.error}/><fieldset disabled={busy} className="admin-picker-fields"><div className="business-grid">{[['batchId','Kỳ thực tập','batches'],['companyUserId','Doanh nghiệp','companies'],['mentorUserId','Giảng viên','mentors']].map(([key,label,source])=><Select key={key} label={label} value={filters[key]} onChange={value=>{setFilters({...filters,[key]:value});setAssignment(null);setPage(1);}} options={[{value:'',label:'Tất cả'},...(options.data?.[source]||[]).map(x=>({value:x._id,label:x.name}))]}/>)}</div><SupervisionStudentFinder filters={{...filters,assignmentId:assignment?._id||''}} selected={student} onSelect={pick} onAssignment={(_id,a)=>setAssignment(a?{...a,student}:null)}/></fieldset></Panel>

 <div ref={selectionRef}/>
 {assignment?<CertificateWorkbench key={assignment._id} assignment={assignment} chainReady={status.data?.chain.available===true} onBusy={setBusy}/>:student&&<Panel title="Điều kiện và bằng chứng cấp chứng nhận"><p>Chọn sinh viên và kỳ/phân công để xem điều kiện, giờ đã duyệt và chứng nhận. Chưa có giao dịch nào được gửi.</p></Panel>}
 {!assignment&&<> <Panel title="Danh sách hồ sơ thực tập"><Resource state={overview}><Rows items={overview.data?.items} columns={[{key:'student',title:'Sinh viên',render:a=><><strong>{a.student?.name}</strong><p>{a.studentCode} · {a.student?.email}</p></>},{key:'batch',title:'Kỳ / đề tài',render:a=><>{a.batch?.name}<p>{a.topicSnapshot?.title}</p></>},{key:'company',title:'Doanh nghiệp / giảng viên',render:a=><>{a.company?.companyName||a.company?.name}<p>{a.mentor?.name||'Chưa phân công'}</p></>},{key:'state',title:'Trạng thái',render:a=>displayLabel(a.lifecycle)},{key:'action',title:'Chi tiết',render:a=><button type="button" className="btn btn-secondary" disabled={busy} onClick={()=>{setStudent({_id:a.studentUserId,name:a.student?.name,studentCode:a.studentCode,email:a.student?.email});setAssignment(a);requestAnimationFrame(()=>selectionRef.current?.scrollIntoView({block:'start',behavior:'smooth'}));}}>Xem hồ sơ</button>}]}/><Pager data={overview.data} page={page} onPage={setPage}/></Resource></Panel></>}
 </div>;
}
function CertificateWorkbench({assignment,chainReady,onBusy}){
 const [page,setPage]=useState(1),[revision,setRevision]=useState(0),[selected,setSelected]=useState([]),[confirm,setConfirm]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState(null),[verified,setVerified]=useState(null),lock=useRef(false);
 const base = '/core/web3/placements/' + assignment._id;

const conditions = useResource(
  base + '/eligibility',
  revision
);

const times = useResource(
  base + `/time-evidence?page=${page}&limit=10`,
  revision
);

const history = useResource(
  base + '/operations',
  revision
);

const finalReports = useResource(
  '/core/reports?assignmentId=' +
    encodeURIComponent(assignment._id) +
    '&kind=final&state=approved&limit=100',
  revision
);

const currentFinalReport = (finalReports.data?.items || [])
  .find(report => report.current === true);
 const [selecting,setSelecting]=useState(false),[selectionNote,setSelectionNote]=useState('');
 const chooseAll=async()=>{if(selecting||busy)return;setSelecting(true);setError('');try{const ids=[];let total=0;for(let p=1;;p++){const data=await apiRequest(base+'/time-evidence?limit=100&page='+p);total=data.summary.eligible;ids.push(...data.items.filter(r=>r.eligible).map(r=>r._id));if(ids.length>=20||p>=data.pages)break;}setSelected(ids.slice(0,20));setSelectionNote(total>20?`Đã chọn 20/${total} phiên hợp lệ theo thời gian tăng dần. Mỗi lần ghi tối đa 20 phiên.`:`Đã chọn ${ids.length} phiên hợp lệ trong phân công.`);}catch(e){setError(e.message);}finally{setSelecting(false);}};
 const certificate=verified||(!conditions.loading?conditions.data?.certificate:null),isReconcile=confirm?.startsWith('reconcile:');
 const send = async () => {
  if (lock.current || !confirm) return;

  lock.current = true;
  setBusy(true);
  onBusy(true);
  setError('');

  try {
    const isReport = confirm.startsWith('report:');
    const isReconcile = confirm.startsWith('reconcile:');

    const path = isReport
      ? '/core/web3/reports/' + confirm.slice(7) + '/anchor'
      : confirm === 'time'
      ? base + '/time-evidence/anchor'
      : isReconcile
      ? '/core/web3/operations/' + confirm.split(':')[1] + '/reconcile'
      : base + '/' + confirm;

    const body = confirm === 'time'
      ? { sessionIds: selected, confirmTransactions: true }
      : {};

    const value = await apiRequest(path, {
      method: 'POST',
      body
    });

    setResult(value);
    setSelected([]);
    setConfirm(null);
    setRevision(n => n + 1);
  } catch (e) {
    setError(e.message);
  } finally {
    lock.current = false;
    setBusy(false);
    onBusy(false);
  }
};
 const toggle=(id,checked)=>setSelected(ids=>checked?[...new Set([...ids,id])]:ids.filter(x=>x!==id));
 return <><Panel title="Thông tin phân công"><p>{assignment.batch?.name} · {assignment.topicSnapshot?.title}</p><p>{assignment.company?.companyName||assignment.company?.name} · Giảng viên: {assignment.mentor?.name||'Chưa phân công'}</p></Panel>
 <Panel title="Điều kiện hoàn thành"><Resource state={conditions}><Rows items={(conditions.data?.checks||[]).map(c=>({...c,_id:c.key}))} columns={[{key:'label',title:'Điều kiện'},{key:'met',title:'Kết quả',render:c=>c.met?'Đạt':'Chưa đạt / chưa xác minh'}]}/>{conditions.data?.reason&&<p role="status">{conditions.data.reason}</p>}</Resource></Panel>
 <Panel title="Bằng chứng giờ làm đã duyệt"><ErrorNotice message={times.error}/><Resource state={times}><div className="business-grid"><p>Tổng: {times.data?.summary.total||0} phiên · {((times.data?.summary.totalMinutes||0)/60).toFixed(2)} giờ</p><p>Đã ghi: {times.data?.summary.recorded||0} · Chưa ghi: {times.data?.summary.pending||0} · Hợp lệ: {times.data?.summary.eligible||0}</p></div><div className="business-actions"><button type="button" className="btn btn-secondary" disabled={busy||selecting||!chainReady} onClick={chooseAll}>Chọn tất cả phiên hợp lệ</button><button type="button" className="btn btn-secondary" disabled={busy||!selected.length} onClick={()=>setSelected([])}>Bỏ chọn</button></div><p className="muted">Chọn tất cả tra cứu toàn bộ phân công, không chỉ trang đang xem. Mỗi lần ghi tối đa 20 phiên; lựa chọn được giữ khi chuyển trang.</p>
 <p role="status">{selecting?'Đang tìm các phiên hợp lệ…':selectionNote}</p><Rows items={times.data?.items} columns={[{key:'pick',title:'Chọn',render:r=><input type="checkbox" aria-label={'Chọn phiên '+r._id} checked={selected.includes(r._id)} disabled={busy||!chainReady||!r.eligible} onChange={e=>toggle(r._id,e.target.checked)}/>},{key:'date',title:'Ngày làm việc',render:r=>new Date(r.checkInAt).toLocaleDateString('vi-VN')},{key:'times',title:'Vào / ra',render:r=><>{dateLabel(r.checkInAt)}<p>{dateLabel(r.checkOutAt)}</p></>},{key:'duration',title:'Thời lượng',render:r=>`${r.minutes||0} phút (${((r.minutes||0)/60).toFixed(2)} giờ)`},{key:'method',title:'Phương thức',render:r=>r.method==='qr-gps-client'?'QR/GPS':displayLabel(r.method)},{key:'approval',title:'Duyệt',render:r=>displayLabel(r.state)},{key:'chain',title:'Blockchain',render:r=><>{r.recorded?'Đã ghi (có receipt)':r.operation?displayLabel(r.operation.state):'Chưa ghi'}<p>{r.reason}</p>{r.operation?.txHash&&!r.recorded&&<button type="button" className="btn btn-secondary" disabled={busy||!chainReady} onClick={()=>{setError('');setConfirm('reconcile:'+r.operation.id);}}>Đối chiếu giao dịch</button>}</>} ]}/><Pager data={times.data} page={page} onPage={setPage}/></Resource>
 <button type="button" className="btn btn-primary" disabled={busy||!chainReady||!selected.length||selected.length>20||times.loading||selecting} onClick={()=>{setError('');setConfirm('time');}}>Ghi bằng chứng các phiên đã chọn ({selected.length})</button>
 {result?.items&&<div role="status"><p>Đã xác minh: {result.confirmed} · Chờ/không xác minh được: {result.pending} · Thất bại: {result.failed}</p>{result.items.map(r=><p key={r.sessionId}>{r.sessionId}: {r.verified?'Receipt và event hợp lệ':r.message||r.state}{r.txHash&&' · '+r.txHash}</p>)}</div>}</Panel>
 <Panel title="Bằng chứng báo cáo cuối kỳ">
  <ErrorNotice message={finalReports.error} />

  {finalReports.loading ? (
    <p>Đang tải báo cáo cuối kỳ...</p>
  ) : currentFinalReport ? (
    <>
      <p>
        <strong>Báo cáo:</strong> {currentFinalReport.title}
      </p>

      <p>
        <strong>Phiên bản:</strong> {currentFinalReport.version}
      </p>

      <p>
        <strong>Trạng thái:</strong> Đã duyệt
      </p>

      <p>
        <strong>Điểm cuối kỳ:</strong>{' '}
        {currentFinalReport.finalScore ?? 'Chưa có'}
      </p>

      <p className="muted">
        Báo cáo cuối kỳ đã được duyệt.
        Kiểm tra lịch sử blockchain trước khi ghi bằng chứng.
       </p>

<button
  type="button"
  className="btn btn-primary"
  disabled={busy || !chainReady || history.loading || !!history.error || !history.data}
  onClick={() => {
    setError('');
    setConfirm('report:' + currentFinalReport._id);
  }}
>
  Ghi bằng chứng báo cáo cuối kỳ
</button>

    </>
  ) : (
    <p>Không tìm thấy báo cáo cuối kỳ hiện hành đã duyệt.</p>
  )}
</Panel><Panel title="Phê duyệt hoàn tất"><button type="button" className="btn btn-secondary" disabled={busy||conditions.loading||!conditions.data?.canComplete} onClick={()=>{setError('');setConfirm('complete');}}>Ghi phê duyệt hoàn tất</button>{conditions.data?.completionRecorded&&<p>Đã ghi phê duyệt hoàn tất đúng snapshot.</p>}</Panel>
 <Panel title="Chứng nhận SBT"><p>{conditions.loading?'Đang kiểm tra chứng nhận…':!conditions.data?.certificateStateKnown?'Chưa xác minh được trạng thái chứng nhận':conditions.data.alreadyMinted?'Đã có chứng nhận trên blockchain':'Chưa ghi nhận chứng nhận đã cấp'}</p>{!conditions.data?.alreadyMinted&&<button type="button" className="btn btn-primary" disabled={busy||conditions.loading||!conditions.data?.canMint} onClick={()=>{setError('');setConfirm('mint');}}>Cấp chứng nhận SBT</button>}<button type="button" className="btn btn-secondary" disabled={busy||!chainReady||!conditions.data?.alreadyMinted} onClick={async()=>{setError('');setVerified({verified:false});try{setVerified(await apiRequest(base+'/certificate'));}catch(e){setVerified({verified:false});setError(e.message);}}}>Xác minh chứng nhận</button>{certificate?.verified&&<div data-testid="live-sbt-certificate"><strong>Đã xác minh trên blockchain · Không chuyển nhượng</strong>{certificate.lastVerifiedAt&&<p>Xác minh lúc: {dateLabel(certificate.lastVerifiedAt)}</p>}<p>Token {certificate.tokenId} · Chain {certificate.chainId}</p><p className="web3-reference">{certificate.contractAddress}<br/>{certificate.txHash}<br/>Chủ sở hữu: {certificate.owner}</p></div>}</Panel>
 <Panel title="Lịch sử giao dịch và xác minh"><ErrorNotice message={history.error}/><BlockchainHistory items={history.data?.items||[]} studentName={assignment.studentName||assignment.student?.name}/></Panel><ErrorNotice message={error}/>
 {confirm&&<Dialog label="Xác nhận giao dịch blockchain" onClose={busy?undefined:()=>setConfirm(null)}><div className="modal-content"><h2>
  Xác nhận {
    confirm.startsWith('report:')
      ? 'ghi bằng chứng báo cáo cuối kỳ'
      : confirm === 'time'
      ? 'ghi bằng chứng giờ làm'
      : isReconcile
      ? 'đối chiếu giao dịch'
      : confirm === 'mint'
      ? 'cấp chứng nhận SBT'
      : 'phê duyệt hoàn tất'
  }
</h2><p>{confirm==='time'?`${selected.length} phiên, mỗi phiên là một giao dịch riêng. Có thể có phiên thất bại hoặc còn chờ; kết quả từng phiên sẽ được hiển thị.`:isReconcile?'Đọc receipt/event và cập nhật trạng thái giao dịch đã gửi. Không tạo giao dịch blockchain mới.':'Đây là giao dịch ghi blockchain, không thể xóa giao dịch đã được xác nhận.'}</p><p>Chỉ sử dụng mạng Hardhat local đã cấu hình. Ghi giờ làm không tự cấp chứng nhận.</p>{busy&&<p role="status">Đang gửi và xác minh giao dịch. Thao tác đang thực hiện chưa thể hủy.</p>}<ErrorNotice message={error}/><div className="business-actions"><button type="button" className="btn btn-secondary" disabled={busy} onClick={()=>setConfirm(null)}>Hủy</button><button type="button" className="btn btn-primary" disabled={busy} onClick={send}>{busy?'Đang xử lý…':'Xác nhận gửi giao dịch'}</button></div></div></Dialog>}
 </>;
}

import StudentOverview from './StudentOverview';
import {useViewWriter} from '../../viewStateStore';
import {useEffect,useState,useRef} from 'react';
import {useSchoolResource as useData} from './useSchoolResource';
import {Panel,Resource,Rows} from './common';
import {MutationDialog} from '../Shared';
function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}');}catch{return {};}}
export default function WorkflowDashboard({user,onNavigate}){const writeView=useViewWriter();
 const data=useData('/core/dashboard'),[open,setOpen]=useState(false),[once,setOnce]=useState(false),[shown,setShown]=useState([]),[tabId]=useState(()=>crypto.randomUUID());
 const prefix=`internova-reminder:${user._id}:${user.authSessionId||'legacy'}`,claim=prefix+':claim';
 const release=useRef(null);
 useEffect(()=>{
  if(user.role!=='admin'||!data.data)return;
  let active=true;
  const rows=data.data.items.filter(r=>((r.dueReached&&r.summary.dueMissingTopic)||r.summary.missingMentor)&&!read(prefix)[r.batch._id]);
  const listener=e=>{if(e.key===prefix){setOpen(false);release.current?.();}else if(e.key===claim&&read(claim).tab!==tabId)setOpen(false);};
  window.addEventListener('storage',listener);
  const open=()=>{if(!active||!rows.length)return;const current=read(claim);if(current.tab&&current.tab!==tabId&&Date.now()-current.at<300000)return;try{localStorage.setItem(claim,JSON.stringify({tab:tabId,at:Date.now()}));}catch{}setShown(rows);setOpen(true);};
  if(navigator.locks)void navigator.locks.request(claim,{ifAvailable:true},async lock=>{if(!lock||!active||!rows.length)return;open();if(active)await new Promise(resolve=>{release.current=resolve;});});
  else Promise.resolve().then(open);
  return()=>{active=false;release.current?.();release.current=null;window.removeEventListener('storage',listener);if(read(claim).tab===tabId)localStorage.removeItem(claim);};
 },[data.data,user.role,prefix,claim,tabId]);
 const close=()=>{if(once){try{const prior=read(prefix);for(const r of shown)prior[r.batch._id]=true;localStorage.setItem(prefix,JSON.stringify(prior));}catch{}}setOpen(false);release.current?.();if(read(claim).tab===tabId)localStorage.removeItem(claim);};
 const navigate=(r,status)=>{for(const [field,value]of Object.entries({batchId:r.batch._id,type:r.batch.type,status,page:1}))writeView('core-placements',field,value);setOpen(false);onNavigate('core-placements');};
 if(user.role==='student')return <StudentOverview user={user} internships={data.data?.items} loading={data.loading} error={data.error} onNavigate={onNavigate}/>;
 return <div className="business-stack"><Panel title="Tổng quan thực tập theo phạm vi" description="Theo dõi tiến độ và kết quả thực tập trong phạm vi quản lý."><Resource state={data}>
 {data.data?.totals&&<div className="business-grid">{[['students','Sinh viên'],['companies','Doanh nghiệp'],['mentors','Giảng viên'],['jds','Tin tuyển dụng'],['applications','Hồ sơ ứng tuyển'],['placements','Phân công'],['reports','Báo cáo'],['reviews','Lượt nhận xét'],['attendance','Ca làm'],['certificates','Chứng nhận đã ghi']].filter(([key])=>data.data.totals[key]!==undefined).map(([key,label])=><div className="glass-panel" style={{padding:16}} key={key}><span className="muted">{label}</span><h3>{data.data.totals[key].toLocaleString('vi-VN')}</h3></div>)}</div>}{user.role==='admin'?<>{data.data?.items.map(r=><Panel key={r.batch._id} title={r.batch.name}><div className="business-grid"><p>Thuộc diện: <strong>{r.summary.total}</strong></p><p>Đã đăng ký: <strong>{r.summary.registered}</strong> · Chưa đăng ký: <strong>{r.summary.unregistered}</strong></p><p>Chưa có đề tài: <strong>{r.summary.missingTopic}</strong>{!r.dueReached&&' · chưa tới mốc nhắc'}</p><p>Chưa có giảng viên: <strong>{r.summary.missingMentor}</strong></p><p>Đã phân công: {r.summary.assigned} · Đang thực tập: {r.summary.active} · Hoàn tất: {r.summary.completed}</p></div><div className="business-actions"><button className="btn btn-secondary" onClick={()=>navigate(r,'missing_topic')}>Danh sách thiếu đề tài</button><button className="btn btn-secondary" onClick={()=>navigate(r,'missing_mentor')}>Danh sách thiếu giảng viên</button></div></Panel>)}</>:user.role==='student'?<Rows items={data.data?.items} columns={[{key:'batch',title:'Kỳ được cấp',render:e=>e.batch?.name},{key:'registered',title:'Đăng ký',render:e=>e.registeredAt?'Đã đăng ký':'Chưa đăng ký'},{key:'admission',title:'Đề tài',render:e=>e.admission?.state==='active'?e.admission.title:'Chưa nhận đề tài'}]}/>:<p>Phân công chính thức trong phạm vi: <strong>{data.data?.totals?.placements||0}</strong> · Đang thực tập: {data.data?.totals?.activePlacements||0}</p>}
 </Resource>{!user.walletVerified&&['student','company'].includes(user.role)&&<p>Bạn chưa liên kết ví. <button className="btn btn-secondary" onClick={()=>onNavigate('core-profile')}>Mở hồ sơ để liên kết ví</button> Bạn vẫn có thể sử dụng các chức năng quản lý thực tập.</p>}</Panel>
 {open&&<MutationDialog title="Nhắc việc phân công thực tập" onClose={close}>{shown.map(r=><div key={r.batch._id}><h3>{r.batch.name}</h3><p>Thiếu đề tài cần xử lý: {r.dueReached?r.summary.dueMissingTopic:0} · Thiếu giảng viên: {r.summary.missingMentor}</p><div className="business-actions"><button className="btn btn-secondary" onClick={()=>navigate(r,'missing_topic')}>Mở danh sách thiếu đề tài</button><button className="btn btn-secondary" onClick={()=>navigate(r,'missing_mentor')}>Mở danh sách thiếu giảng viên</button></div></div>)}<p><label><input type="checkbox" checked={once} onChange={e=>setOnce(e.target.checked)}/>Chỉ nhắc một lần trong phiên này</label></p><button className="btn btn-primary" onClick={close}>OK</button><p className="muted">Đóng thông báo không có nghĩa đã hoàn tất phân công. Các số việc tồn luôn hiển thị trên Dashboard.</p></MutationDialog>}
 </div>;
}

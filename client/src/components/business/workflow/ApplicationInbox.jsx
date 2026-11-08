import SubmittedCvDialog from '../SubmittedCvDialog';
import SupervisionStudentFinder from '../SupervisionStudentFinder';
import {useViewState} from '../../viewStateStore';
import {useState} from 'react';
import {Panel,Resource,Rows,Pager,CommandDialog} from './common';
import {choices,stateLabel,reasonField,vnDate} from './constants';
import {Select,Text} from '../Shared';
import {useSchoolResource as useData} from './useSchoolResource';

export default function ApplicationInbox({batchId:fixedBatchId=''}){
 const [selectedStudent,setSelectedStudent]=useState(null),[viewing,setViewing]=useState(null);
 const [batchId,setBatchId]=useViewState('inbox:batchId',''),[state,setState]=useViewState('inbox:state',''),[query,setQuery]=useViewState('inbox:query',''),[page,setPage]=useViewState('inbox:page',1),[revision,setRevision]=useState(0),[modal,setModal]=useState(null),[message,setMessage]=useState('');
 const batches=useData('/core/admin/batches?limit=100');
 const params=new URLSearchParams({page:String(page),limit:'10'});
 if(fixedBatchId||batchId)params.set('batchId',fixedBatchId||batchId);
 if(state)params.set('state',state);if(selectedStudent)params.set('studentUserId',selectedStudent._id);
 if(query)params.set('q',query);
 const applications=useData('/core/admin/applications?'+params,revision);
 const reload=()=>{setPage(1);setRevision(n=>n+1);};
 return <Panel title="Theo dõi hồ sơ ứng tuyển" description="Sinh viên ứng tuyển trực tiếp đến doanh nghiệp. Nhà trường theo dõi và phải xử lý phân công nếu tới mốc 7 ngày trước khi kỳ bắt đầu mà sinh viên chưa có nơi tiếp nhận." actions={<button className="btn btn-secondary" onClick={reload}>Tải lại hồ sơ</button>}>
 {!fixedBatchId&&<Resource state={batches}><Select label="Kỳ của hồ sơ ứng tuyển" value={batchId} onChange={value=>{setBatchId(value);setPage(1);}} options={[{value:'',label:'Tất cả kỳ'},...choices(batches.data?.items,b=>`${b.code} · ${b.name}`).filter(x=>x.value)]}/></Resource>}
 <Select label="Trạng thái hồ sơ ứng tuyển" value={state} onChange={value=>{setState(value);setPage(1);}} options={[{value:'',label:'Tất cả trạng thái'},...['submitted','dispatched','under_review','offered','confirmed','withdrawn','rejected','closed_other_selected','closed_full','cancelled'].map(value=>({value,label:stateLabel[value]}))]}/>
 <SupervisionStudentFinder filters={{batchId:fixedBatchId||batchId}} selected={selectedStudent} showAssignments={false} onSelect={s=>{setSelectedStudent(s);setViewing(null);setPage(1);}}/><Text label="Tìm hồ sơ theo sinh viên, doanh nghiệp hoặc đề tài" value={query} onChange={value=>{setQuery(value);setPage(1);}}/>
 {message&&<p role="status">{message}</p>}
 <Resource state={applications}><p>{applications.data?.total||0} hồ sơ{!fixedBatchId&&!batchId?' · Tất cả kỳ':''}.</p><Rows items={applications.data?.items} empty="Không có hồ sơ khớp bộ lọc. Chọn tất cả kỳ/trạng thái hoặc bấm Tải lại hồ sơ để kiểm tra hồ sơ mới." columns={[
 {key:'studentName',title:'Sinh viên'},
 {key:'title',title:'Đề tài / doanh nghiệp',render:a=><><strong>{a.title}</strong><p>{a.companyName}</p><p>{batches.data?.items.find(b=>b._id===a.batchId)?.code}</p></>},
 {key:'createdAt',title:'Ngày ứng tuyển',render:a=>vnDate(a.createdAt)},
 {key:'state',title:'Trạng thái',render:a=>stateLabel[a.state]},
 {key:'action',title:'Thao tác',render:a=><><button type="button" className="btn btn-secondary" onClick={()=>setViewing(a)}>Xem hồ sơ đã nộp</button>{a.state==='submitted'&&<button className="btn btn-primary" onClick={()=>setModal({row:a,action:'dispatch'})}>Khôi phục quyền xét hồ sơ</button>}{['dispatched','under_review','offered'].includes(a.state)&&<button className="btn btn-secondary" onClick={()=>setModal({row:a,action:'revoke-dispatch'})}>Thu hồi quyền xét</button>}</>},
 ]}/><Pager data={applications.data} page={page} onPage={setPage}/></Resource>
 {viewing&&<SubmittedCvDialog application={viewing} onClose={()=>setViewing(null)}/>}
 {modal&&<CommandDialog title={modal.action==='dispatch'?'Khôi phục quyền xét hồ sơ xét tuyển':'Thu hồi quyền xét hồ sơ'} path={`/core/admin/applications/${modal.row._id}/${modal.action}`} initial={{version:modal.row.__v,reason:''}} fields={[reasonField]} onClose={()=>setModal(null)} onSaved={()=>{setMessage(modal.action==='dispatch'?`Đã giao hồ sơ của ${modal.row.studentName} cho ${modal.row.companyName}. Doanh nghiệp có thể mở “Hồ sơ được giao xét tuyển” và tải lại.`:'Đã thu hồi quyền xét hồ sơ.');setModal(null);reload();}}><p><strong>{modal.row.studentName}</strong> → {modal.row.companyName}</p><p>{modal.row.title}</p><details><summary>Đọc hồ sơ đã nộp</summary><p>{modal.row.message}</p><p>{modal.row.cvSnapshot?.summary}</p><p>{modal.row.cvSnapshot?.skills?.join(', ')}</p></details></CommandDialog>}
 </Panel>;
}

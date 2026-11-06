import {useState} from 'react';
import {CommandDialog} from './common';
import {reasonField} from './constants';
export default function AssignmentStateActions({assignment,onSaved}){
 const [state,setState]=useState(null);
 return <>{assignment.lifecycle==='approved'&&<button className="btn btn-secondary" onClick={()=>setState('active')}>Bắt đầu thực tập</button>}{assignment.lifecycle==='active'&&<button className="btn btn-secondary" onClick={()=>setState('completed')}>Chốt hoàn tất</button>}{state&&<CommandDialog title={state==='active'?'Bắt đầu theo thời gian phân công':'Chốt hoàn tất sau khi đủ KPI và báo cáo'} path={`/core/school/assignments/${assignment._id}/state`} initial={{version:assignment.__v,state,reason:''}} fields={[reasonField]} onClose={()=>setState(null)} onSaved={()=>{setState(null);onSaved();}}/>}</>;
}

import {useState} from 'react';
import SupervisionStudentFinder from './SupervisionStudentFinder';
export default function AdminStudentPicker({value,onChange,batchId='',onStudentChange,userRole='admin',requireBatch=false,includeAdmissions=false}){
 const [student,setStudent]=useState(null);
 if(requireBatch&&!batchId)return <p>Chọn kỳ thực tập trước để tìm sinh viên.</p>;
 return <SupervisionStudentFinder apiBase={userRole==='admin'?'/core/admin/supervision/students':'/core/student-lookup'} includeAdmissions={includeAdmissions} filters={{batchId,assignmentId:value?._id||''}} selected={student} onSelect={s=>{setStudent(s);onChange(null);onStudentChange?.(s);}} onAssignment={(_id,a)=>onChange(a?{...a,topic:{title:a.topicSnapshot?.title},participantNames:{student:student?.name},studentName:student?.name}:null)}/>;
}

import {useState} from 'react';
import {useResource} from '../hooks';
import {downloadFile} from '../../../api/files';
import {ErrorNotice} from '../Shared';
export default function ReportAttachments({report}){
 const state=useResource('/core/web3/reports/'+report._id+'/artifacts'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const attachments=(state.data?.items||[]).filter(a=>a.source==='attachment'&&a.state==='verified');
 return <section><ErrorNotice message={state.error||error}/>{attachments.map(a=><button key={a.id} type="button" disabled={busy} className="btn btn-secondary" onClick={async()=>{setBusy(true);setError('');try{await downloadFile('/core/web3/artifacts/'+a.id+'/file','bao-cao-'+report._id+(a.mime==='application/pdf'?'.pdf':'.docx'));}catch(e){setError(e.message);}finally{setBusy(false);}}}>Tải tệp báo cáo đã xác minh</button>)}</section>;
}

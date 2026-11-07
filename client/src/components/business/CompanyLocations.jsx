import {useState} from 'react';
import {apiRequest} from '../../api/client';
import {ActionForm,Text,ErrorNotice} from './Shared';

export default function CompanyLocations({data,onSaved}){
 const [open,setOpen]=useState(false),[confirmed,setConfirmed]=useState(false),[error,setError]=useState('');
 const [form,setForm]=useState({label:'',address:'',latitude:'',longitude:'',radiusMeters:'100',maxAccuracyMeters:'30'});
 const field=(key,value)=>{setForm(s=>({...s,[key]:value}));setConfirmed(false);};
 return <div className="business-stack"><button className="btn btn-secondary" type="button" onClick={()=>setOpen(v=>!v)}>{open?'Đóng thêm địa điểm':'Thêm địa điểm điểm danh'}</button>
 {open&&<ActionForm submit="Lưu địa điểm" onSaved={result=>{onSaved(result);setOpen(false);setConfirmed(false);}} onSubmit={()=>{if(!confirmed)throw Error('Xác nhận địa chỉ và tọa độ trước khi lưu.');return apiRequest('/core/company/locations',{method:'POST',body:{version:data?.version??null,...form,latitude:Number(form.latitude),longitude:Number(form.longitude),radiusMeters:Number(form.radiusMeters),maxAccuracyMeters:Number(form.maxAccuracyMeters),source:'manual',coordinatesConfirmed:true}});}}>
 <Text label="Tên địa điểm" required maxLength={160} value={form.label} onChange={v=>field('label',v)}/><Text label="Địa chỉ điểm danh" required maxLength={500} value={form.address} onChange={v=>field('address',v)}/>
 <div className="business-grid">{[['latitude','Vĩ độ địa điểm',-90,90],['longitude','Kinh độ địa điểm',-180,180],['radiusMeters','Bán kính địa điểm (m)',20,300],['maxAccuracyMeters','Sai số tối đa (m)',1,100]].map(([key,label,min,max])=><Text key={key} label={label} type="number" step="any" min={min} max={max} required value={form[key]} onChange={v=>field(key,v)}/>)}</div>
 <div className="business-actions"><a className="btn btn-secondary" target="_blank" rel="noreferrer" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(form.address||'')}>Tra địa chỉ trên bản đồ</a><button type="button" className="btn btn-secondary" onClick={()=>{setError('');if(!navigator.geolocation){setError('Trình duyệt không hỗ trợ vị trí.');return;}navigator.geolocation.getCurrentPosition(p=>{setForm(s=>({...s,latitude:String(p.coords.latitude),longitude:String(p.coords.longitude)}));setConfirmed(false);},()=>setError('Không lấy được vị trí. Bạn có thể nhập tọa độ sau khi kiểm tra bản đồ.'),{enableHighAccuracy:true,timeout:10000,maximumAge:0});}}>Lấy vị trí hiện tại</button></div>
 <ErrorNotice message={error}/><label><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Tôi đã kiểm tra địa chỉ, tọa độ và phạm vi điểm danh.</label>
 <p className="muted">Vị trí thiết bị có sai số. Bản đồ mở ở trang riêng; không tự lưu vị trí hoặc tạo điểm danh.</p>
 </ActionForm>}</div>;
}

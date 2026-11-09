import {useId} from 'react';
export default function WeekFilter({value,onChange}){
 const id=useId();
 return <section className="week-filter" aria-label="Bộ lọc tuần báo cáo">
 <label htmlFor={id}>Lọc tuần báo cáo</label>
 <input id={id} className="input-field" type="number" min="1" max="104" step="1" inputMode="numeric" placeholder="Tất cả" value={value} onChange={event=>onChange(event.target.value)}/>
 {value&&<button type="button" className="btn btn-secondary" onClick={()=>onChange('')}>Xóa lọc</button>}
 </section>;
}

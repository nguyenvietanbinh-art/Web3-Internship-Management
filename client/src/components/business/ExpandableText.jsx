import {useId,useState} from 'react';
export default function ExpandableText({text='',limit=320,label='Nội dung'}){
 const [expanded,setExpanded]=useState(false),id=useId();
 const content=String(text||''),long=content.length>limit;
 return <div>
 <div id={id} className="business-content" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{long&&!expanded?content.slice(0,limit).trimEnd()+'…':content}</div>
 {long&&<button type="button" className="btn btn-secondary" style={{marginTop:8}} aria-expanded={expanded} aria-controls={id} aria-label={(expanded?'Thu gọn ':'Xem thêm ')+label} onClick={()=>setExpanded(value=>!value)}>{expanded?'Thu gọn':'Xem thêm'}</button>}
 </div>;
}

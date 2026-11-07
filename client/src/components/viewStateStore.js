import {createContext,useContext,useEffect,useRef,useState,useCallback} from 'react';
const Context=createContext({scope:'guest',view:'dashboard',memory:new Map()}),prefix='internova:view:v1:';
const scalar=value=>(typeof value==='string'&&value.length<=160)||(typeof value==='number'&&Number.isFinite(value))||typeof value==='boolean';
export function readViewValue(key,fallback){try{const value=JSON.parse(sessionStorage.getItem(prefix+key));return scalar(value)&&typeof value===typeof fallback?value:fallback;}catch{return fallback;}}
export function writeViewValue(key,value){if(!scalar(value))return;try{sessionStorage.setItem(prefix+key,JSON.stringify(value));}catch{/* Storage can be disabled. */}}
const read=readViewValue,write=writeViewValue;
export function clearViewState(){try{for(const key of Object.keys(sessionStorage))if(key.startsWith(prefix)||key==='internova-admin-filter')sessionStorage.removeItem(key);}catch{/* Optional persistence. */}}
export {Context};
export function useViewState(field,fallback){
 const {scope,view}=useContext(Context),key=`${scope}:${view}:${field}`;
 const [value,setValue]=useState(()=>read(key,fallback));
 const update=useCallback(next=>setValue(previous=>{const result=typeof next==='function'?next(previous):next;write(key,result);return result;}),[key]);
 return [value,update];
}
export function useViewWriter(){const {scope}=useContext(Context);return (view,field,value)=>write(`${scope}:${view}:${field}`,value);}
export function useViewMemory(field,fallback){const {scope,view,memory}=useContext(Context),key=`${scope}:${view}:${field}`;const [value,setValue]=useState(()=>memory.has(key)?memory.get(key):fallback);const update=useCallback(next=>setValue(previous=>{const result=typeof next==='function'?next(previous):next;memory.set(key,result);return result;}),[memory,key]);return [value,update];}
export function confirmLeave(){return !document.querySelector('[data-unsaved="true"]')||window.confirm('Có nội dung chưa lưu. Bạn có muốn rời trang và bỏ các thay đổi này?');}
export function useViewNavigation(user,ready){
 const [view,setView]=useState('dashboard'),previous=useRef(null),current=useRef({scope:'',view:'dashboard'}),scope=user?`${user._id}:${user.role}`:'';
 useEffect(()=>{current.current={scope,view};},[scope,view]);
 useEffect(()=>{
  if(!ready)return;
  try{const owner=sessionStorage.getItem('internova:view-owner');if(owner&&owner!==scope)clearViewState();if(scope)sessionStorage.setItem('internova:view-owner',scope);else sessionStorage.removeItem('internova:view-owner');}catch{/* Storage is optional. */}
  if(previous.current!==null&&previous.current!==scope)clearViewState();
  previous.current=scope;
  let cancelled=false;
  const requested=scope?(new URLSearchParams(location.search).get('view')||read(`${scope}:navigation`,'dashboard')):'dashboard';
  queueMicrotask(()=>{if(!cancelled)setView(requested);});return()=>{cancelled=true;};
 },[scope,ready]);
 useEffect(()=>{const back=()=>{if(confirmLeave()){const next=new URLSearchParams(location.search).get('view')||'dashboard';setView(next);if(current.current.scope)write(`${current.current.scope}:navigation`,next);}else history.pushState({},'','?view='+encodeURIComponent(view));};window.addEventListener('popstate',back);return()=>window.removeEventListener('popstate',back);},[view]);
 const navigate=useCallback((next,{discard=false}={})=>{const {view,scope}=current.current;if(next===view||(!discard&&!confirmLeave()))return;setView(next);if(scope){write(`${scope}:navigation`,next);const url=new URL(location.href);url.searchParams.set('view',next);history.pushState({},'',url.pathname+url.search);}},[]);
 return [view,navigate];
}

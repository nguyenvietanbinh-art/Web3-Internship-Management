import {useEffect,useRef,useCallback,useState} from 'react';
import {Context,readViewValue,writeViewValue} from './viewStateStore';
export function ViewStateProvider({user,view,children}){
 const root=useRef(null),[memory]=useState(()=>new Map()),scope=user?`${user._id}:${user.role}`:'guest';
 useEffect(()=>{const guard=e=>{if(root.current?.querySelector('[data-unsaved="true"]')){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[]);
 const detailKey=useCallback(element=>`${scope}:${view}:details:${element.closest('tr')?.dataset.recordId||''}:${element.querySelector('summary')?.textContent?.trim().slice(0,100)||''}`,[scope,view]);
 useEffect(()=>{const node=root.current;if(!node)return;const restore=()=>{for(const e of node.querySelectorAll('main details'))if(!e.closest('[role=dialog]')){const open=readViewValue(detailKey(e),false);if(e.open!==open)e.open=open;}};restore();const observer=new MutationObserver(restore);observer.observe(node,{childList:true,subtree:true});return()=>observer.disconnect();},[detailKey]);
 return <Context.Provider value={{scope,view,memory}}><div ref={root} style={{display:'contents'}} onToggleCapture={event=>{const e=event.target;if(e.tagName==='DETAILS'&&e.closest('main')&&!e.closest('[role=dialog]'))writeViewValue(detailKey(e),e.open);}}>{children}</div></Context.Provider>;
}

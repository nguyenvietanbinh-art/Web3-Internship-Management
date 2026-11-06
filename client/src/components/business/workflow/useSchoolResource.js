import {useEffect,useState} from 'react';
import {apiRequest} from '../../../api/client';
export function useSchoolResource(path,revision=0){
 const [state,setState]=useState({data:null,error:'',loading:Boolean(path)});
 useEffect(()=>{let active=true;const controller=new AbortController();Promise.resolve().then(async()=>{if(!active)return;if(!path){setState({data:null,error:'',loading:false});return;}setState(s=>({...s,error:'',loading:true}));try{const data=await apiRequest(path,{signal:controller.signal});if(active)setState({data,error:'',loading:false});}catch(e){if(active&&e.name!=='AbortError')setState({data:null,error:e.message,loading:false});}});return()=>{active=false;controller.abort();};},[path,revision]);return state;
}

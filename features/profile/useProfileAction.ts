import {useEffect,useRef,useState} from 'react';
export function useProfileAction(){
 const [pending,setPending]=useState(false),[error,setError]=useState<string|null>(null);const lock=useRef(false),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 async function run(action:()=>Promise<void>){
  if(lock.current||!mounted.current)return false;lock.current=true;setPending(true);setError(null);
  try{await action();return mounted.current;}catch(e){if(mounted.current)setError(e instanceof Error&&!('code' in e)?e.message:'We couldn’t save your profile. Please try again.');return false;}
  finally{lock.current=false;if(mounted.current)setPending(false);}
 }
 return {pending,error,run};
}

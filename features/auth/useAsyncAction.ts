import {useCallback,useEffect,useRef,useState} from 'react';
import {getAuthErrorMessage} from './errors';
export function useAsyncAction() {
  const [pending,setPending]=useState(false);const [error,setError]=useState<string|null>(null);
  const busy=useRef(false);const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;};},[]);
  const clearError=useCallback(()=>{if(mounted.current)setError(null);},[]);
  const run=useCallback(async(action:()=>Promise<void>):Promise<boolean>=>{
    if(busy.current || !mounted.current)return false;
    busy.current=true;setPending(true);setError(null);
    try { await action();return mounted.current; }
    catch(error) {if(mounted.current)setError(getAuthErrorMessage(error));return false;}
    finally {busy.current=false;if(mounted.current)setPending(false);}
  },[]);
  return {pending,error,run,clearError};
}

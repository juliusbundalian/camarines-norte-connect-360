import AsyncStorage from '@react-native-async-storage/async-storage';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type PropsWithChildren} from 'react';
const KEY='@cn360/onboarding/v1';
interface OnboardingValue {completed:boolean;ready:boolean;error:string|null;initializationError:string|null;saving:boolean;complete():Promise<void>;retry():void}
const Context=createContext<OnboardingValue|null>(null);
export function OnboardingProvider({children}:PropsWithChildren) {
  const [completed,setCompleted]=useState(false);const [ready,setReady]=useState(false);
  const [error,setError]=useState<string|null>(null);const [initializationError,setInitializationError]=useState<string|null>(null);
  const [saving,setSaving]=useState(false);const [attempt,setAttempt]=useState(0);
  const mounted=useRef(true);const busy=useRef(false);
  useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;};},[]);
  useEffect(()=>{
    let active=true;setReady(false);setError(null);setInitializationError(null);
    AsyncStorage.getItem(KEY).then(value=>{if(active)setCompleted(value==='complete');})
      .catch(()=>{if(active){const message='Could not read onboarding progress. Please retry.';setError(message);setInitializationError(message);}})
      .finally(()=>{if(active)setReady(true);});
    return ()=>{active=false;};
  },[attempt]);
  const retry=useCallback(()=>setAttempt(n=>n+1),[]);
  const complete=useCallback(async()=>{
    if(busy.current || !ready || initializationError || !mounted.current)return;
    busy.current=true;setSaving(true);setError(null);
    try {await AsyncStorage.setItem(KEY,'complete');if(mounted.current)setCompleted(true);}
    catch {if(mounted.current)setError('Could not save onboarding progress. Please try again.');}
    finally {busy.current=false;if(mounted.current)setSaving(false);}
  },[ready,initializationError]);
  return <Context.Provider value={{completed,ready,error,initializationError,saving,complete,retry}}>{children}</Context.Provider>;
}
export function useOnboarding():OnboardingValue {
  const value=useContext(Context);if(!value)throw new Error('useOnboarding requires OnboardingProvider');return value;
}

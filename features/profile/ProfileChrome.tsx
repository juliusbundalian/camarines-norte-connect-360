import {createContext,useContext,useCallback,useMemo,useRef,type PropsWithChildren} from 'react';
import {useFocusEffect} from 'expo-router';
export interface ProfileChromeConfig {step:1|2;title:string;subtitle:string;onBack?:()=>void;busy:boolean;disabled?:boolean;actionLabel:string;onAction():void}
export const ProfileChromeContext=createContext<((config:ProfileChromeConfig)=>void)|null>(null);
/** Only the focused content route can update the persistent header/action bar. */
export function ProfileChromeSync({config}:{config:ProfileChromeConfig}){
 const publish=useContext(ProfileChromeContext)!;const current=useRef(config);current.current=config;
 const stable=useMemo(()=>({...config,onBack:config.onBack?()=>current.current.onBack?.():undefined,onAction:()=>current.current.onAction()}),[config.step,config.title,config.subtitle,config.busy,config.disabled,config.actionLabel,!!config.onBack]);
 useFocusEffect(useCallback(()=>{publish(stable);},[publish,stable]));return null;
}

import {createContext,useContext,useEffect,useRef,useState,type PropsWithChildren} from 'react';
import {useAuth} from '../auth/AuthProvider';
import {profileService,type ProfileService} from '../../services/firebase/profile-service';
import {requiresSetup} from './profile-cohort';
import {defaultAvatarForGender} from './avatars';
import {emptyDraft,type AvatarId,type Gender,type ProfileDraft,type ProfileStep,type UserProfile} from './profile-types';
import {validateProfile} from './profile-validation';
import {DraftWriter} from './draft-writer';
type Phase='guest'|'loading'|'legacy'|'required'|'complete'|'error';
interface State {uid:string|null;phase:Phase;profile:UserProfile|null;draft:ProfileDraft;step:ProfileStep;error:string|null;saveState:'saved'|'saving'|'unsaved'}
interface ProfileValue extends State {setDraft(patch:Partial<ProfileDraft>):void;saveGender(gender:Gender):Promise<void>;applyAvatar(id:AvatarId):Promise<void>;flushDraft():Promise<void>;finish(today:string):Promise<void>;retry():void}
const Context=createContext<ProfileValue|null>(null);
const initial=():State=>({uid:null,phase:'guest',profile:null,draft:emptyDraft(),step:'gender',error:null,saveState:'saved'});
export function ProfileProvider({children,service=profileService}:PropsWithChildren<{service?:ProfileService}>){
 const auth=useAuth();const [state,setState]=useState<State>(initial);const [attempt,setAttempt]=useState(0);
 const stateRef=useRef(state);stateRef.current=state;
 const profileRef=useRef<UserProfile|null>(null),draftRef=useRef(emptyDraft());
 const writerRef=useRef<DraftWriter|null>(null);const session=useRef(0);const dirty=useRef(false);const currentUid=useRef<string|null>(null);
 const finishing=useRef<Promise<void>|null>(null);
 const patch=(value:Partial<State>)=>setState(previous=>({...previous,...value}));
 useEffect(()=>{
  const user=auth.user,uid=user?.uid??null;const generation=++session.current;let active=true;
  const same=uid===currentUid.current;
  const preserved=same&&dirty.current?{...draftRef.current}:null;
  if(!same){dirty.current=false;finishing.current=null;}
  currentUid.current=uid;profileRef.current=null;draftRef.current=preserved??emptyDraft();
  writerRef.current?.dispose();writerRef.current=null;
  setState({...initial(),uid,draft:draftRef.current,phase:!auth.ready?'loading':uid?'loading':'guest'});
  const alive=()=>active&&generation===session.current;
  const accept=(p:UserProfile)=>{if(!alive())return;profileRef.current=p;patch({profile:p,step:p.currentStep});};
  async function initialize(){
   if(!auth.ready||!user)return;
   try{
    if(user.source==='native'){
     if(!requiresSetup(user,null)){if(alive())patch({phase:'legacy'});return;}
     throw new Error('This session cannot access profile setup. Please sign out and sign in with email.');
    }
    let p=await service.load(user.uid);if(!alive())return;
    if(!requiresSetup(user,p)){if(p){accept(p);draftRef.current=p.draft;patch({draft:p.draft,phase:'complete'});}else patch({phase:'legacy'});return;}
    p??=await service.ensure(user.uid,emptyDraft());if(!alive())return;
    accept(p);draftRef.current=preserved??p.draft;
    const writer=new DraftWriter(async draft=>{
     if(!alive()||!profileRef.current)throw new Error('The active account changed.');
     let saved:UserProfile;
     try{saved=await service.saveDraft(user.uid,draft,profileRef.current.revision);}
     catch(error){
      if(!(error instanceof Error)||!error.message.includes('updated elsewhere'))throw error;
      const latest=await service.load(user.uid);if(!alive()||!latest)throw error;
      if(latest.status==='complete'){accept(latest);patch({phase:'complete'});return;}
      profileRef.current=latest;saved=await service.saveDraft(user.uid,draft,latest.revision);
     }
     accept(saved);
     if(alive()&&JSON.stringify(draftRef.current)===JSON.stringify(draft))dirty.current=false;
    },saveState=>{if(alive())patch({saveState});});
    writerRef.current=writer;patch({draft:draftRef.current,phase:'required',error:null});
    if(preserved)writer.schedule(preserved);
   }catch(error){if(alive())patch({phase:'error',error:error instanceof Error?error.message:'Unable to load profile setup. Please retry.'});}
  }
  void initialize();
  return()=>{active=false;writerRef.current?.dispose();};
 },[auth.ready,auth.user?.uid,auth.user?.source,auth.user?.creationTimeMs,attempt,service]);
 const setDraft=(values:Partial<ProfileDraft>)=>{
  if(stateRef.current.phase!=='required'||finishing.current)return;
  const next={...draftRef.current,...values};draftRef.current=next;dirty.current=true;patch({draft:next});writerRef.current?.schedule(next);
 };
 const flushDraft=()=>writerRef.current?.flush()??Promise.resolve();
 const saveGender=async(gender:Gender)=>{
  const user=auth.user,writer=writerRef.current,generation=session.current;if(!user||!writer)throw new Error('Please wait for profile setup to load.');
  await writer.run(async()=>{
   const p=profileRef.current;if(!p)throw new Error('Please retry profile setup.');
   const draft={...draftRef.current};if(draft.avatarSelectionSource==='default')draft.avatarId=defaultAvatarForGender(gender);
   const saved=await service.saveGender(user.uid,gender,draft,p.revision);
   if(generation!==session.current)return;
   profileRef.current=saved;draftRef.current=draft;dirty.current=false;patch({profile:saved,draft,step:'profile',saveState:'saved'});
  });
 };
 const applyAvatar=async(id:AvatarId)=>{setDraft({avatarId:id,avatarSelectionSource:'manual'});await flushDraft();};
 const finish=(today:string):Promise<void>=>{
  if(finishing.current)return finishing.current;
  const user=auth.user,writer=writerRef.current,generation=session.current;
  if(!user||!writer)return Promise.reject(new Error('Please wait for profile setup to load.'));
  let completed;try{completed=validateProfile(profileRef.current?.gender??null,draftRef.current,today);}catch(error){return Promise.reject(error);}
  const request=writer.run(async()=>{
   if(!profileRef.current)throw new Error('Please retry profile setup.');
   const saved=await service.complete(user.uid,completed,profileRef.current.revision);
   if(generation!==session.current)return;
   writer.dispose();profileRef.current=saved;dirty.current=false;patch({profile:saved,phase:'complete',saveState:'saved'});
  }).finally(()=>{if(generation===session.current)finishing.current=null;});
  finishing.current=request;return request;
 };
 // A changed UID is hidden synchronously, before the effect resets its state.
 const visible=state.uid===(auth.user?.uid??null)?state:{...initial(),phase:auth.user?'loading' as const:'guest' as const};
 return <Context.Provider value={{...visible,setDraft,saveGender,applyAvatar,flushDraft,finish,retry:()=>setAttempt(v=>v+1)}}>{children}</Context.Provider>;
}
export function useProfile(){const value=useContext(Context);if(!value)throw new Error('useProfile requires ProfileProvider');return value;}

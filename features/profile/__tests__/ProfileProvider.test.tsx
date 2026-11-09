import {renderHook,act} from '@testing-library/react-native';
import {ProfileProvider,useProfile} from '../ProfileProvider';
import {useAuth} from '../../auth/AuthProvider';
import {ProfileConflictError} from '../../../services/firebase/account-profile-types';
import type {ProfileService} from '../../../services/firebase/profile-service';
import {emptyDraft,type UserProfile} from '../profile-types';
jest.mock('../../auth/AuthProvider',()=>({useAuth:jest.fn()}));
jest.mock('../../../services/firebase/profile-service',()=>({profileService:{}}));
jest.mock('../../../services/firebase/account-profile-service',()=>({getAccountProfileService:jest.fn(()=>({load:jest.fn(async()=>null)}))}));
const fresh={uid:'a',email:'a@example.com',phoneNumber:null,source:'js',creationTimeMs:Date.parse('2026-12-01')} as const;
const seed=():UserProfile=>({schemaVersion:1,onboardingVersion:1,status:'incomplete',currentStep:'gender',gender:null,draft:emptyDraft(),avatarId:'avatar-1',avatarSelectionSource:'default',displayName:null,birthdate:null,mobileNumber:null,createdAt:{} as any,updatedAt:{} as any,completedAt:null,revision:0});
function service(initial:UserProfile|null=null){let data:UserProfile|null=initial;let fail=false;return {
 get data(){return data;},set fail(v:boolean){fail=v;},
 savePersonalInfo:jest.fn(async(_uid,values,revision):Promise<UserProfile>=>data={...(data??seed()),...values,status:'complete',revision:revision===null?0:revision+1}),
 saveAvatar:jest.fn(async(_uid,avatarId)=>data={...data!,avatarId,revision:data!.revision+1}),load:jest.fn(async()=>data),ensure:jest.fn(async()=>data??=seed()),
 saveGender:jest.fn(async(_uid,gender,draft,revision)=>data={...data!,gender,draft,currentStep:'profile',revision:revision+1}),
 saveDraft:jest.fn(async(_uid,draft,revision)=>{if(fail)throw new Error('offline');return data={...data!,draft,revision:revision+1};}),
 complete:jest.fn(async(_uid,p,revision)=>data={...data!,...p,status:'complete',revision:revision+1})
 } satisfies ProfileService & {data:UserProfile|null;fail:boolean};}
function auth(user:any=fresh){jest.mocked(useAuth).mockReturnValue({user,ready:true} as any);}
beforeEach(()=>auth());
it('resumes new accounts and finishes only after draft writes, without creating another account',async()=>{
 const s=service();const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 expect(result.current.phase).toBe('required');
 await act(()=>result.current.saveGender('female'));
 expect(result.current.draft.avatarId).toBe('avatar-8');
 await act(()=>result.current.setDraft({displayName:'Alex',birthdateText:'02/29/2024'}));
 await act(()=>result.current.finish('2026-11-08'));
 expect(result.current.phase).toBe('complete');expect(s.data?.displayName).toBe('Alex');
 expect(s.data?.revision).toBe(3);
});
it('does not access JS Firestore for native-only legacy sessions',async()=>{
 auth({...fresh,source:'native',creationTimeMs:0});const s=service();
 const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 expect(result.current.phase).toBe('legacy');expect(s.load).not.toHaveBeenCalled();
});
it('clears drafts and ignores delayed reads when the UID changes',async()=>{
 const s=service();let release!:(p:UserProfile)=>void;s.load.mockImplementationOnce(()=>new Promise(r=>release=r));
 const hook=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 auth(null);await hook.rerender({});await act(()=>release({...seed(),draft:{...emptyDraft(),displayName:'Account A'}}));
 expect(hook.result.current.phase).toBe('guest');expect(hook.result.current.draft.displayName).toBe('');
});
it('retains unsaved inputs after a passive save error, then retries Finish',async()=>{
 const s=service();const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 await act(()=>result.current.saveGender('male'));s.fail=true;
 await act(()=>result.current.setDraft({displayName:'Alex',birthdateText:'01/01/2000'}));
 await act(async()=>{await expect(result.current.flushDraft()).rejects.toThrow('offline');});
 expect(result.current.saveState).toBe('unsaved');expect(result.current.draft.displayName).toBe('Alex');
 s.fail=false;await act(()=>result.current.finish('2026-11-08'));expect(result.current.phase).toBe('complete');
});
it('retries failed initialization without losing account identity',async()=>{
 const s=service();s.ensure.mockRejectedValueOnce(new Error('offline'));
 const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 expect(result.current.phase).toBe('error');await act(()=>result.current.retry());
 expect(result.current.phase).toBe('required');expect(result.current.uid).toBe('a');
});
it('preserves a manually selected avatar when gender changes',async()=>{
 const s=service();const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 await act(()=>result.current.saveGender('male'));await act(()=>result.current.applyAvatar('avatar-6'));
 await act(()=>result.current.saveGender('female'));expect(result.current.draft.avatarId).toBe('avatar-6');
});
it('serializes rapid Finish attempts into one completed write',async()=>{
 const s=service();const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 await act(()=>result.current.saveGender('male'));
 await act(()=>result.current.setDraft({displayName:'Alex',birthdateText:'01/01/2000'}));
 await act(async()=>{await Promise.all([result.current.finish('2026-11-08'),result.current.finish('2026-11-08')]);});
 expect(s.complete).toHaveBeenCalledTimes(1);expect(result.current.phase).toBe('complete');
});
it('refreshes a conflicting revision and retains the local draft',async()=>{
 const s=service();const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 await act(()=>result.current.saveGender('male'));s.saveDraft.mockRejectedValueOnce(new Error('Your profile was updated elsewhere. Please retry.'));
 await act(()=>result.current.setDraft({displayName:'Local draft'}));await act(()=>result.current.flushDraft());
 expect(s.data?.draft.displayName).toBe('Local draft');expect(result.current.saveState).toBe('saved');
});
it('adopts another device completion instead of retrying obsolete drafts',async()=>{
 const s=service();const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 await act(()=>result.current.saveGender('male'));
 await act(()=>result.current.setDraft({displayName:'Local',birthdateText:'01/01/2000'}));
 s.saveDraft.mockRejectedValueOnce(new Error('Profile setup is already complete.'));
 s.load.mockResolvedValueOnce({...seed(),status:'complete',gender:'male',displayName:'Remote',revision:7});
 await act(()=>result.current.finish('2026-11-08'));expect(result.current.phase).toBe('complete');expect(result.current.profile?.displayName).toBe('Remote');
 expect(s.complete).not.toHaveBeenCalled();
});
it('reloads revision conflicts for explicit gender and completion saves',async()=>{
 const s=service();const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 s.saveGender.mockRejectedValueOnce(new Error('Your profile was updated elsewhere. Please retry.'));
 await act(()=>result.current.saveGender('male'));expect(result.current.step).toBe('profile');
 await act(()=>result.current.setDraft({displayName:'Alex',birthdateText:'01/01/2000'}));await act(()=>result.current.flushDraft());
 s.complete.mockRejectedValueOnce(new Error('Your profile was updated elsewhere. Please retry.'));
 await act(()=>result.current.finish('2026-11-08'));expect(result.current.phase).toBe('complete');
});
it('leaves an unchanged draft clean and avoids a second save for the same manual avatar',async()=>{
 const s=service();const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 await act(()=>result.current.setDraft({displayName:''}));await act(()=>result.current.flushDraft());
 expect(s.saveDraft).not.toHaveBeenCalled();expect(result.current.saveState).toBe('saved');
 await act(()=>result.current.saveGender('male'));await act(()=>result.current.applyAvatar('avatar-6'));const revision=s.data?.revision;
 await act(()=>result.current.applyAvatar('avatar-6'));expect(s.data?.revision).toBe(revision);expect(s.saveDraft).toHaveBeenCalledTimes(1);
});
it('does not save a draft edited back to its acknowledged value before the debounce',async()=>{
 const s=service();const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 await act(()=>result.current.setDraft({displayName:'Temporary'}));await act(()=>result.current.setDraft({displayName:''}));await act(()=>result.current.flushDraft());
 expect(s.saveDraft).not.toHaveBeenCalled();expect(result.current.saveState).toBe('saved');
});

const completed=():UserProfile=>({...seed(),status:'complete',currentStep:'profile',gender:'male',displayName:'Original',birthdate:'2000-01-01'});
it('publishes acknowledged account edits and avatar changes',async()=>{
 const s=service(completed());const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 await act(()=>result.current.savePersonalInfo({displayName:'Updated',gender:'female',birthdate:'2000-01-01',mobileNumber:null,avatarId:'avatar-1'},0));
 expect(result.current.profile?.displayName).toBe('Updated');
 await act(()=>result.current.saveAccountAvatar('avatar-6'));expect(result.current.profile?.avatarId).toBe('avatar-6');
});
it('loads native legacy identity through its own adapter and creates a voluntary first profile',async()=>{
 auth({...fresh,source:'native',creationTimeMs:0});const js=service(),native=service();
 const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={js} accountService={native}>{children}</ProfileProvider>});
 expect(result.current.phase).toBe('legacy');expect(js.load).not.toHaveBeenCalled();expect(native.load).toHaveBeenCalled();expect(native.ensure).not.toHaveBeenCalled();
 await act(()=>result.current.savePersonalInfo({displayName:'Legacy',gender:'male',birthdate:'2000-01-01',mobileNumber:null,avatarId:'avatar-1'},null));
 expect(result.current.phase).toBe('complete');expect(result.current.profile?.displayName).toBe('Legacy');
});
it('rejects late account responses after logout and synchronously deduplicates saves',async()=>{
 const s=service(completed());let release!:(p:UserProfile)=>void;
 s.savePersonalInfo.mockImplementationOnce(()=>new Promise(r=>release=r));
 const hook=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 const values={displayName:'Updated',gender:'male' as const,birthdate:'2000-01-01',mobileNumber:null,avatarId:'avatar-1' as const};
 let first!:Promise<void>,second!:Promise<void>;
 await act(()=>{first=hook.result.current.savePersonalInfo(values,0);second=hook.result.current.savePersonalInfo(values,0);});
 expect(s.savePersonalInfo).toHaveBeenCalledTimes(1);
 auth(null);await hook.rerender({});
 await act(async()=>{release(completed());await expect(first).rejects.toThrow(/account/);await expect(second).rejects.toThrow(/account/);});
 expect(hook.result.current.phase).toBe('guest');expect(hook.result.current.profile).toBeNull();
});

it('adopts the conflicting server identity and leaves saving to an explicit retry',async()=>{
 const s=service(completed());const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 const remote={...completed(),displayName:'Remote',revision:4};
 s.savePersonalInfo.mockRejectedValueOnce(new ProfileConflictError(remote));
 await act(async()=>{await expect(result.current.savePersonalInfo({displayName:'Local',gender:'male',birthdate:'2000-01-01',mobileNumber:null,avatarId:'avatar-1'},0)).rejects.toThrow(/updated elsewhere/);});
 expect(result.current.profile?.displayName).toBe('Remote');expect(s.savePersonalInfo).toHaveBeenCalledTimes(1);
});
it('keeps native legacy browsing available after an account read failure',async()=>{
 auth({...fresh,source:'native',creationTimeMs:0});const native=service(),js=service();native.load.mockRejectedValueOnce(new Error('offline'));
 const {result}=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={js} accountService={native}>{children}</ProfileProvider>});
 expect(result.current.phase).toBe('legacy');expect(result.current.accountError).toBe('offline');
});

test.each(['a','b'])('rejects a queued JS Save before writing when native %s becomes authoritative',async uid=>{
 const js=service(completed()),native=service({...completed(),displayName:'Native'});
 const hook=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={js} accountService={useAuth().user?.source==='native'?native:js}>{children}</ProfileProvider>});
 const queuedSave=hook.result.current.savePersonalInfo;
 auth({...fresh,uid,source:'native',creationTimeMs:0});await hook.rerender({});
 expect(hook.result.current.profile?.displayName).toBe('Native');
 await act(async()=>{await expect(queuedSave({displayName:'Stale JS edit',gender:'male',birthdate:'2000-01-01',mobileNumber:null,avatarId:'avatar-1'},0)).rejects.toThrow(/account/);});
 expect(js.savePersonalInfo).not.toHaveBeenCalled();expect(native.savePersonalInfo).not.toHaveBeenCalled();
});
it('rejects old account callbacks after initialization restarts for the same identity',async()=>{
 const s=service(completed());const hook=await renderHook(useProfile,{wrapper:({children})=><ProfileProvider service={s}>{children}</ProfileProvider>});
 const queuedSave=hook.result.current.saveAccountAvatar,queuedRefresh=hook.result.current.refreshAccount;
 await act(()=>hook.result.current.retry());const reads=s.load.mock.calls.length;
 await act(async()=>{
  await expect(queuedSave('avatar-6')).rejects.toThrow(/account/);
  await expect(queuedRefresh()).rejects.toThrow(/account/);
 });
 expect(s.saveAvatar).not.toHaveBeenCalled();expect(s.load).toHaveBeenCalledTimes(reads);
});

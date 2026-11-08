import {renderHook,act} from '@testing-library/react-native';
import {ProfileProvider,useProfile} from '../ProfileProvider';
import {useAuth} from '../../auth/AuthProvider';
import type {ProfileService} from '../../../services/firebase/profile-service';
import {emptyDraft,type UserProfile} from '../profile-types';
jest.mock('../../auth/AuthProvider',()=>({useAuth:jest.fn()}));
jest.mock('../../../services/firebase/profile-service',()=>({profileService:{}}));
const fresh={uid:'a',email:'a@example.com',phoneNumber:null,source:'js',creationTimeMs:Date.parse('2026-12-01')} as const;
const seed=():UserProfile=>({schemaVersion:1,onboardingVersion:1,status:'incomplete',currentStep:'gender',gender:null,draft:emptyDraft(),avatarId:'avatar-1',avatarSelectionSource:'default',displayName:null,birthdate:null,mobileNumber:null,createdAt:{} as any,updatedAt:{} as any,completedAt:null,revision:0});
function service(){let data:UserProfile|null=null;let fail=false;return {
 get data(){return data;},set fail(v:boolean){fail=v;},
 load:jest.fn(async()=>data),ensure:jest.fn(async()=>data??=seed()),
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

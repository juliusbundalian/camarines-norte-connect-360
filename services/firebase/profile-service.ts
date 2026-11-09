import {doc,getDocFromServer,runTransaction,serverTimestamp,type DocumentData} from 'firebase/firestore';
import {getFirebaseAuth,getFirestoreDb} from './client';
import type {AvatarId,CompletedProfile,Gender,ProfileDraft,UserProfile} from '../../features/profile/profile-types';
import {formatBirthdate} from '../../features/profile/profile-validation';
import type {AccountProfileService} from './account-profile-types';
import {accountProfileOperations} from './account-profile-operations';
export interface ProfileService extends AccountProfileService {
 load(uid:string):Promise<UserProfile|null>;
 ensure(uid:string,draft:ProfileDraft):Promise<UserProfile>;
 saveGender(uid:string,gender:Gender,draft:ProfileDraft,revision:number):Promise<UserProfile>;
 saveDraft(uid:string,draft:ProfileDraft,revision:number):Promise<UserProfile>;
 complete(uid:string,profile:CompletedProfile,revision:number):Promise<UserProfile>;
}
function owner(uid:string){if(getFirebaseAuth().currentUser?.uid!==uid)throw new Error('The active account changed. Please sign in again.');}
function reference(uid:string){owner(uid);return doc(getFirestoreDb(),'users',uid);}
export function decodeProfile(data:DocumentData):UserProfile {
 if(data.schemaVersion!==1||data.onboardingVersion!==1||!['incomplete','complete'].includes(data.status)||!Number.isInteger(data.revision)||!data.draft)throw new Error('This profile cannot be loaded. Please retry.');
 return data as UserProfile;
}
async function load(uid:string){const ref=reference(uid);const snap=await getDocFromServer(ref);owner(uid);return snap.exists()?decodeProfile(snap.data()):null;}
async function mutate(uid:string,revision:number,patch:(p:UserProfile)=>DocumentData){
 const ref=reference(uid);
 await runTransaction(getFirestoreDb(),async tx=>{
  owner(uid);const snap=await tx.get(ref);if(!snap.exists())throw new Error('Profile setup has not been initialized. Please retry.');
  const p=decodeProfile(snap.data());
  if(p.status==='complete')throw new Error('Profile setup is already complete.');
  if(p.revision!==revision)throw new Error('Your profile was updated elsewhere. Please retry.');
  owner(uid);tx.update(ref,{...patch(p),revision:revision+1,updatedAt:serverTimestamp()});
 });
 const result=await load(uid);if(!result)throw new Error('Unable to load the saved profile.');return result;
}
const accountOperations=accountProfileOperations({
 load,
 async loadLegacyAvatar(uid){
  owner(uid);
  const snapshot=await getDocFromServer(doc(getFirestoreDb(),'accountAvatars',uid));
  owner(uid);
  return snapshot.data()?.avatarId as AvatarId|undefined ?? null;
 },
 timestamp:serverTimestamp,
 async transact(uid,change){
  const ref=reference(uid);
  await runTransaction(getFirestoreDb(),async tx=>{
   owner(uid);const snap=await tx.get(ref);
   const avatarRef=doc(getFirestoreDb(),'accountAvatars',uid);
   const avatar=snap.exists()?null:(await tx.get(avatarRef)).data()?.avatarId as AvatarId|undefined;
   const data=change(snap.exists()?decodeProfile(snap.data()):null,avatar??null);
   owner(uid);
   if(!data)return;
   if('legacyAvatar' in data)tx.set(avatarRef,{avatarId:data.legacyAvatar});
   else if(snap.exists())tx.update(ref,data.profile);
   else tx.set(ref,data.profile);
  });
  owner(uid);
 }
});
export const profileService:ProfileService={
 ...accountOperations,
 load,
 async ensure(uid,draft){
  const ref=reference(uid);
  await runTransaction(getFirestoreDb(),async tx=>{
   owner(uid);const snap=await tx.get(ref);if(snap.exists()){decodeProfile(snap.data());return;}
   tx.set(ref,{schemaVersion:1,onboardingVersion:1,status:'incomplete',currentStep:'gender',gender:null,draft,avatarId:draft.avatarId,avatarSelectionSource:draft.avatarSelectionSource,displayName:null,birthdate:null,mobileNumber:null,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),completedAt:null,revision:0});
  });
  const result=await load(uid);if(!result)throw new Error('Unable to initialize your profile.');return result;
 },
 saveGender:(uid,gender,draft,revision)=>mutate(uid,revision,()=>({gender,currentStep:'profile',draft,avatarId:draft.avatarId,avatarSelectionSource:draft.avatarSelectionSource})),
 saveDraft:(uid,draft,revision)=>mutate(uid,revision,()=>({draft,avatarId:draft.avatarId,avatarSelectionSource:draft.avatarSelectionSource})),
 async complete(uid,profile,revision){
  const current=await load(uid);
  if(current?.status==='complete')return current;
  return mutate(uid,revision,p=>({...profile,status:'complete',currentStep:'profile',completedAt:serverTimestamp(),draft:{...p.draft,displayName:profile.displayName,birthdateText:formatBirthdate(profile.birthdate),mobileText:profile.mobileNumber??'',avatarId:profile.avatarId}}));
 }
};

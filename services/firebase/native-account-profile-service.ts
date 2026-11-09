import type {AvatarId} from '../../features/profile/profile-types';
import {doc,getDocFromServer,runTransaction,serverTimestamp} from '@react-native-firebase/firestore';
import {getNativeAuth} from './native-auth';
import {getNativeFirestore} from './native-firestore';
import {decodeProfile} from './profile-service';
import {accountProfileOperations} from './account-profile-operations';

function owner(uid:string) {
  if(getNativeAuth().currentUser?.uid!==uid)throw new Error('The active account changed. Please sign in again.');
}
async function load(uid:string) {
  owner(uid);
  const snapshot=await getDocFromServer(doc(getNativeFirestore(),'users',uid));
  owner(uid);
  return snapshot.exists()?decodeProfile(snapshot.data()!):null;
}

export const nativeAccountProfileService=accountProfileOperations({
  load,
  async loadLegacyAvatar(uid){
    owner(uid);
    const snapshot=await getDocFromServer(doc(getNativeFirestore(),'accountAvatars',uid));
    owner(uid);
    return snapshot.data()?.avatarId as AvatarId|undefined ?? null;
  },
  timestamp:serverTimestamp,
  async transact(uid,change) {
    owner(uid);
    const database=getNativeFirestore();
    const reference=doc(database,'users',uid);
    await runTransaction(database,async transaction=>{
      owner(uid);
      const snapshot=await transaction.get(reference);
      const avatarRef=doc(database,'accountAvatars',uid);
      const avatar=snapshot.exists()?null:(await transaction.get(avatarRef)).data()?.avatarId as AvatarId|undefined;
      const data=change(snapshot.exists()?decodeProfile(snapshot.data()!):null,avatar??null);
      owner(uid);
      if(!data)return;
      if('legacyAvatar' in data)transaction.set(avatarRef,{avatarId:data.legacyAvatar});
      else if(snapshot.exists())transaction.update(reference,data.profile);
      else transaction.set(reference,data.profile);
    });
    owner(uid);
  },
});

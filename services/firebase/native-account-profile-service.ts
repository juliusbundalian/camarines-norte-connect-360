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
  timestamp:serverTimestamp,
  async transact(uid,change) {
    owner(uid);
    const database=getNativeFirestore();
    const reference=doc(database,'users',uid);
    await runTransaction(database,async transaction=>{
      owner(uid);
      const snapshot=await transaction.get(reference);
      const data=change(snapshot.exists()?decodeProfile(snapshot.data()!):null);
      owner(uid);
      if(data) {
        if(snapshot.exists())transaction.update(reference,data);
        else transaction.set(reference,data);
      }
    });
    owner(uid);
  },
});

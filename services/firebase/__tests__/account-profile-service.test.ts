import {getAccountProfileService} from '../account-profile-service.native';
import {getNativeFirestore} from '../native-firestore';
import {profileService} from '../profile-service';
import {getNativeAuth} from '../native-auth';
import {connectFirestoreEmulator,getDocFromServer,getFirestore} from '@react-native-firebase/firestore';

jest.mock('../profile-service',()=>({profileService:{load:jest.fn()},decodeProfile:(value:any)=>value}));
jest.mock('../native-auth',()=>({getNativeAuth:jest.fn(()=>({currentUser:{uid:'native-a'},app:{options:{projectId:'demo-cn360-connect'}}}))}));
jest.mock('../config',()=>({getFirebaseConfiguration:()=>({options:{projectId:'demo-cn360-connect'},firestoreEmulator:{host:'127.0.0.1',port:8088}})}));
jest.mock('@react-native-firebase/firestore',()=>({
 getFirestore:jest.fn(()=>({})),connectFirestoreEmulator:jest.fn(),doc:jest.fn(),
 getDocFromServer:jest.fn(async()=>({exists:()=>false})),runTransaction:jest.fn(),serverTimestamp:jest.fn(),
}),{virtual:true});

test('selects the authoritative source and connects the native emulator before access',async()=>{
 expect(getAccountProfileService('js')).toBe(profileService);
 const service=getAccountProfileService('native');
 expect(await service.load('native-a')).toBeNull();
 expect(profileService.load).not.toHaveBeenCalled();
 expect(connectFirestoreEmulator).toHaveBeenCalledWith(expect.anything(),'127.0.0.1',8088);
 expect(jest.mocked(connectFirestoreEmulator).mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(getDocFromServer).mock.invocationCallOrder[0]!);
 getNativeFirestore();expect(getFirestore).toHaveBeenCalledTimes(1);
 await expect(service.load('js-a')).rejects.toThrow(/account/i);
});
test('rejects a native Firebase project mismatch',()=>{
 jest.mocked(getNativeAuth).mockReturnValue({currentUser:{uid:'native-a'},app:{options:{projectId:'wrong-project'}}} as any);
 expect(()=>getNativeFirestore()).toThrow(/configuration/i);
});

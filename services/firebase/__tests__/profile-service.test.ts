import {profileService} from '../profile-service';
import {emptyDraft} from '../../../features/profile/profile-types';
jest.mock('../client',()=>({getFirebaseAuth:()=>({currentUser:{uid:'current'}}),getFirestoreDb:jest.fn(()=>{throw new Error('Firestore must not be reached');})}));
it('rejects cross-account work before issuing a Firestore request',async()=>{
 await expect(profileService.load('someone-else')).rejects.toThrow(/account/i);
 await expect(profileService.ensure('someone-else',emptyDraft())).rejects.toThrow(/account/i);
});

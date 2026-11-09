import {accountProfileOperations} from '../account-profile-operations';
import type {UserProfile} from '../../../features/profile/profile-types';

test('a failed acknowledgement read can retry a committed first save without another write',async()=>{
 let data:UserProfile|null=null;
 const change=jest.fn(async(_uid,update)=>{const patch=update(data);if(patch)data={...data,...patch};});
 const load=jest.fn(async()=>data).mockRejectedValueOnce(new Error('offline after commit'));
 const service=accountProfileOperations({load,transact:change,timestamp:()=>({toMillis:()=>1})});
 const values={displayName:'Alex',gender:'other' as const,birthdate:'2000-01-01',mobileNumber:null,avatarId:'avatar-1' as const};
 await expect(service.savePersonalInfo('a',values,null)).rejects.toThrow('offline after commit');
 expect((await service.savePersonalInfo('a',values,null)).revision).toBe(0);
 expect(change.mock.calls).toHaveLength(2);
 expect(change.mock.calls[1]?.[1](data)).toBeNull();
});

import {requiresSetup} from '../profile-cohort';
import type {AuthUser} from '../../../services/firebase/auth-types';
const user={uid:'u',email:null,phoneNumber:null,source:'js',creationTimeMs:99} as AuthUser;
it('grandfathers accounts created before rollout but gates boundary and later accounts',()=>{
 expect(requiresSetup(user,null,100)).toBe(false);
 expect(requiresSetup({...user,creationTimeMs:100},null,100)).toBe(true);
 expect(requiresSetup({...user,creationTimeMs:101},null,100)).toBe(true);
});
it('uses durable profile completion over the cohort',()=>{
 expect(requiresSetup(user,{status:'incomplete'} as any,100)).toBe(true);
 expect(requiresSetup({...user,creationTimeMs:101},{status:'complete'} as any,100)).toBe(false);
});
it('does not mistake missing creation metadata for a legacy account',()=>expect(()=>requiresSetup({...user,creationTimeMs:null},null,100)).toThrow(/creation/i));

import type {CompletedProfile,ProfileDraft,UserProfile} from '../../features/profile/profile-types';
import {formatBirthdate} from '../../features/profile/profile-validation';
import {samePersonalInfo} from '../../features/account/personal-info';
import {ProfileConflictError,type AccountProfileService} from './account-profile-types';

type Data=Record<string,unknown>;
export interface AccountProfileStore {
  load(uid:string):Promise<UserProfile|null>;
  transact(uid:string,change:(current:UserProfile|null)=>Data|null):Promise<void>;
  timestamp():unknown;
}

function canonicalDraft(values:CompletedProfile):ProfileDraft {
  return {displayName:values.displayName,birthdateText:formatBirthdate(values.birthdate),
    mobileText:values.mobileNumber??'',avatarId:values.avatarId,avatarSelectionSource:'manual' as const};
}

/** Both Firebase transports apply the same account mutation semantics. */
export function accountProfileOperations(store:AccountProfileStore):AccountProfileService {
  const acknowledged=async(uid:string)=>{
    const saved=await store.load(uid);
    if(!saved)throw new Error('Unable to load the saved profile. Please retry.');
    return saved;
  };
  return {
    load:store.load,
    async savePersonalInfo(uid,values,expectedRevision) {
      await store.transact(uid,current=>{
        if(current?.status==='incomplete')throw new Error('Please finish profile setup first.');
        if(current && samePersonalInfo(current as CompletedProfile,values))return null;
        if((current?.revision??null)!==expectedRevision)throw new ProfileConflictError(current);
        const draft=canonicalDraft({...values,avatarId:current?.avatarId??values.avatarId});
        if(current) {
          draft.avatarSelectionSource=current.avatarSelectionSource;
          return {displayName:values.displayName,gender:values.gender,birthdate:values.birthdate,
            mobileNumber:values.mobileNumber,draft,revision:current.revision+1,updatedAt:store.timestamp()};
        }
        return {...values,schemaVersion:1,onboardingVersion:1,status:'complete',currentStep:'profile',
          draft,avatarSelectionSource:'manual',revision:0,createdAt:store.timestamp(),
          updatedAt:store.timestamp(),completedAt:store.timestamp()};
      });
      return acknowledged(uid);
    },
    async saveAvatar(uid,avatarId) {
      await store.transact(uid,current=>{
        if(!current || current.status!=='complete')throw new Error('Please finish profile setup first.');
        if(current.avatarId===avatarId)return null;
        return {avatarId,avatarSelectionSource:'manual',
          draft:{...current.draft,avatarId,avatarSelectionSource:'manual'},
          revision:current.revision+1,updatedAt:store.timestamp()};
      });
      return acknowledged(uid);
    },
  };
}

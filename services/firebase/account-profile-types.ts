import type {AvatarId,CompletedProfile,UserProfile} from '../../features/profile/profile-types';
export type {PersonalInfo} from '../../features/account/personal-info';

export type AccountAvatarSave = UserProfile | {legacyAvatar:AvatarId};

export interface AccountProfileService {
  load(uid:string):Promise<UserProfile|null>;
  loadLegacyAvatar(uid:string):Promise<AvatarId|null>;
  savePersonalInfo(uid:string,values:CompletedProfile,expectedRevision:number|null):Promise<UserProfile>;
  saveAvatar(uid:string,avatarId:AvatarId):Promise<AccountAvatarSave>;
}

export class ProfileConflictError extends Error {
  constructor(public readonly latest:UserProfile|null) {
    super('Your profile was updated elsewhere. Review your changes and save again.');
    this.name='ProfileConflictError';
  }
}

import type {AvatarId,CompletedProfile,Gender,UserProfile} from '../profile/profile-types';
import {formatBirthdate,validateProfile} from '../profile/profile-validation';

export interface PersonalInfoDraft {
  displayName: string;
  gender: Gender|null;
  birthdateText: string;
  mobileText: string;
  avatarId: AvatarId;
}
export type PersonalInfo = Pick<CompletedProfile,'displayName'|'gender'|'birthdate'|'mobileNumber'>;

export function personalInfoDraft(profile: UserProfile|null): PersonalInfoDraft {
  return {
    displayName: profile?.displayName??'',
    gender: profile?.gender??null,
    birthdateText: profile?.birthdate?formatBirthdate(profile.birthdate):'',
    mobileText: profile?.mobileNumber?.replace(/^\+63/,'')??'',
    avatarId: profile?.avatarId??'avatar-1',
  };
}

export function validatePersonalInfo(draft: PersonalInfoDraft,today: string): CompletedProfile {
  return validateProfile(draft.gender,{...draft,avatarSelectionSource:'manual'},today);
}

export function samePersonalInfo(a: PersonalInfo,b: PersonalInfo): boolean {
  return a.displayName===b.displayName && a.gender===b.gender &&
    a.birthdate===b.birthdate && a.mobileNumber===b.mobileNumber;
}

export function longBirthdate(iso: string): string {
  const [year,month,day]=iso.split('-').map(Number);
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[month-1]} ${day}, ${year}`;
}

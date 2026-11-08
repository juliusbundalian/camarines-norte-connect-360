import type {Timestamp} from 'firebase/firestore';
export type Gender='male'|'female'|'other';
export type AvatarId=`avatar-${1|2|3|4|5|6|7|8|9}`;
export type ProfileStep='gender'|'profile';
export interface ProfileDraft {displayName:string;birthdateText:string;mobileText:string;avatarId:AvatarId;avatarSelectionSource:'default'|'manual'}
export interface CompletedProfile {gender:Gender;displayName:string;birthdate:string;mobileNumber:string|null;avatarId:AvatarId}
export interface UserProfile {schemaVersion:1;onboardingVersion:1;status:'incomplete'|'complete';currentStep:ProfileStep;gender:Gender|null;draft:ProfileDraft;avatarId:AvatarId;avatarSelectionSource:'default'|'manual';displayName:string|null;birthdate:string|null;mobileNumber:string|null;createdAt:Timestamp;updatedAt:Timestamp;completedAt:Timestamp|null;revision:number}
export const emptyDraft=():ProfileDraft=>({displayName:'',birthdateText:'',mobileText:'',avatarId:'avatar-1',avatarSelectionSource:'default'});

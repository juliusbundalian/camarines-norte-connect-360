import type {AvatarId,Gender} from './profile-types';
export const AVATARS:ReadonlyArray<{id:AvatarId;source:number;label:string}>=[
 {id:'avatar-8',source:require('../../assets/avatars/Avatar-8.svg'),label:'Avatar 8'},
 {id:'avatar-1',source:require('../../assets/avatars/Avatar-1.svg'),label:'Avatar 1'},
 {id:'avatar-2',source:require('../../assets/avatars/Avatar-2.svg'),label:'Avatar 2'},
 {id:'avatar-9',source:require('../../assets/avatars/Avatar-9.svg'),label:'Avatar 9'},
 {id:'avatar-3',source:require('../../assets/avatars/Avatar-3.svg'),label:'Avatar 3'},
 {id:'avatar-4',source:require('../../assets/avatars/Avatar-4.svg'),label:'Avatar 4'},
 {id:'avatar-5',source:require('../../assets/avatars/Avatar-5.svg'),label:'Avatar 5'},
 {id:'avatar-6',source:require('../../assets/avatars/Avatar-6.svg'),label:'Avatar 6'},
 {id:'avatar-7',source:require('../../assets/avatars/Avatar-7.svg'),label:'Avatar 7'},
];
export function defaultAvatarForGender(gender:Gender):AvatarId{return gender==='female'?'avatar-8':'avatar-1';}

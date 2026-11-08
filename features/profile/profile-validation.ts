import type {CompletedProfile,Gender,ProfileDraft} from './profile-types';
export function validateGender(value:unknown):Gender {
 if(value!=='male'&&value!=='female'&&value!=='other')throw new Error('Please select your gender.');
 return value;
}
export function parseBirthdate(text:string):string|null {
 const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
 if(!m)return null;
 const month=Number(m[1]),day=Number(m[2]),year=Number(m[3]);
 const leap=year%4===0&&(year%100!==0||year%400===0);
 const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 if(year<1||month<1||month>12||day<1||day>(days[month-1]??0))return null;
 return `${m[3]}-${m[1]}-${m[2]}`;
}
export function formatBirthdate(iso:string):string {return `${iso.slice(5,7)}/${iso.slice(8,10)}/${iso.slice(0,4)}`;}
export function localToday():string {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function normalizeMobile(text:string):string|null {
 if(!text.trim())return null;
 if(!/^[+\d\s()-]+$/.test(text))throw new Error('Please enter a valid Philippine mobile number.');
 let n=text.replace(/[\s()-]/g,'');
 if(n.startsWith('+63'))n=n.slice(3);else if(n.startsWith('0'))n=n.slice(1);
 if(!/^9\d{9}$/.test(n))throw new Error('Please enter a valid Philippine mobile number.');
 return `+63${n}`;
}
export function validateProfile(gender:Gender|null,draft:ProfileDraft,today:string):CompletedProfile {
 const selected=validateGender(gender);const displayName=draft.displayName.trim();
 if(!displayName||[...displayName].length>100)throw new Error('Please enter a name of 1 to 100 characters.');
 const birthdate=parseBirthdate(draft.birthdateText);
 if(!birthdate||birthdate>today)throw new Error('Please enter a valid birthdate that is not in the future.');
 if(!/^avatar-[1-9]$/.test(draft.avatarId))throw new Error('Please select an avatar.');
 return {gender:selected,displayName,birthdate,mobileNumber:normalizeMobile(draft.mobileText),avatarId:draft.avatarId};
}

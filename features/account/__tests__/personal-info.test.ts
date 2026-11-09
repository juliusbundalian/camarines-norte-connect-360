import {personalInfoDraft,validatePersonalInfo,samePersonalInfo,longBirthdate} from '../personal-info';

test('uses calendar components and preserves newborn and leap dates',()=>{
 expect(longBirthdate('2001-10-26')).toBe('October 26, 2001');
 expect(longBirthdate('2024-02-29')).toBe('February 29, 2024');
 const draft={...personalInfoDraft(null),gender:'other' as const,displayName:' Alex ',birthdateText:'11/09/2026'};
 expect(validatePersonalInfo(draft,'2026-11-09').displayName).toBe('Alex');
 expect(()=>validatePersonalInfo({...draft,birthdateText:'11/10/2026'},'2026-11-09')).toThrow(/future/);
});
test('legacy empty fields stay empty and canonical personal equality ignores presentation',()=>{
 expect(personalInfoDraft(null)).toMatchObject({gender:null,displayName:'',birthdateText:'',mobileText:'',avatarId:'avatar-1'});
 const draft={...personalInfoDraft(null),gender:'male' as const,displayName:' Alex ',birthdateText:'01/01/2000',mobileText:'917 123 4567'};
 const value=validatePersonalInfo(draft,'2026-11-09');
 expect(value.mobileNumber).toBe('+639171234567');
 expect(samePersonalInfo(value,{...value,displayName:'Alex'})).toBe(true);
 expect(samePersonalInfo(value,{...value,gender:'female'})).toBe(false);
 expect(validatePersonalInfo({...draft,mobileText:''},'2026-11-09').mobileNumber).toBeNull();
});

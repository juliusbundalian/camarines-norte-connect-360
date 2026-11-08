import {validateProfile,parseBirthdate,formatBirthdate,normalizeMobile} from '../profile-validation';
const draft={displayName:'  李  ',birthdateText:'11/08/2026',mobileText:'',avatarId:'avatar-1' as const,avatarSelectionSource:'default' as const};
it('accepts a newborn and trims a Unicode single-word name without an age gate',()=>{
 expect(validateProfile('other',draft,'2026-11-08')).toEqual({gender:'other',displayName:'李',birthdate:'2026-11-08',mobileNumber:null,avatarId:'avatar-1'});
});
it.each(['',' '.repeat(2),'a'.repeat(101)])('rejects invalid name %p',displayName=>expect(()=>validateProfile('male',{...draft,displayName},'2026-11-08')).toThrow(/name/i));
it('requires an explicit gender',()=>expect(()=>validateProfile(null,draft,'2026-11-08')).toThrow(/gender/i));
it.each([['02/29/2024','2024-02-29'],['02/29/2023',null],['04/31/2000',null],['13/01/2000',null],['01/01/0000',null]])('parses actual calendar date %s',(text,want)=>expect(parseBirthdate(text)).toBe(want));
it('rejects future birthdays',()=>expect(()=>validateProfile('female',{...draft,birthdateText:'11/09/2026'},'2026-11-08')).toThrow(/birthdate/i));
it('formats a date without timezone conversion',()=>expect(formatBirthdate('2008-08-23')).toBe('08/23/2008'));
it.each([['',null],['09171234567','+639171234567'],['+63 917 123 4567','+639171234567'],['9171234567','+639171234567']])('normalizes optional mobile %s',(input,want)=>expect(normalizeMobile(input)).toBe(want));
it.each(['0212345678','091712345678','words09171234567'])('rejects malformed mobile %s',text=>expect(()=>normalizeMobile(text)).toThrow(/mobile/i));

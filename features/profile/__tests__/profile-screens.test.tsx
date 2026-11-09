import {BackHandler} from 'react-native';
import {router} from 'expo-router';
import {render,screen,fireEvent} from '@testing-library/react-native';
import {GenderScreen} from '../GenderScreen';
import {CompleteProfileScreen} from '../CompleteProfileScreen';
import {useProfile} from '../ProfileProvider';
import {useAuth} from '../../auth/AuthProvider';
import {emptyDraft} from '../profile-types';
jest.mock('../ProfileProvider',()=>({useProfile:jest.fn()}));jest.mock('../../auth/AuthProvider',()=>({useAuth:jest.fn()}));
jest.mock('expo-router',()=>({router:{replace:jest.fn(),push:jest.fn(),dismissTo:jest.fn()},useFocusEffect:(fn:any)=>require('react').useEffect(fn,[fn])}));
jest.mock('@react-native-community/datetimepicker',()=>({DateTimePickerAndroid:{open:jest.fn()}}),{virtual:true});
const saveGender=jest.fn(),finish=jest.fn(),setDraft=jest.fn(),logout=jest.fn();
beforeEach(()=>{
 saveGender.mockReset().mockResolvedValue(undefined);finish.mockReset().mockResolvedValue(undefined);logout.mockReset().mockResolvedValue(undefined);
 jest.mocked(useAuth).mockReturnValue({logout,logoutPending:false} as any);
 jest.mocked(useProfile).mockReturnValue({phase:'required',profile:null,draft:emptyDraft(),step:'gender',saveState:'saved',setDraft,saveGender,finish,flushDraft:jest.fn().mockResolvedValue(undefined),applyAvatar:jest.fn().mockResolvedValue(undefined)} as any);
});
it('keeps Next disabled until a gender is selected without showing validation feedback',async()=>{
 await render(<GenderScreen/>);expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();
 await fireEvent.press(screen.getByText('Next'));expect(saveGender).not.toHaveBeenCalled();expect(screen.queryByRole('alert')).toBeNull();
 await fireEvent.press(screen.getByRole('radio',{name:'Female'}));expect(screen.getByRole('button',{name:'Next'})).toBeEnabled();
 await fireEvent.press(screen.getByText('Next'));expect(saveGender).toHaveBeenCalledWith('female');expect(router.push).toHaveBeenCalledWith('/complete-profile');
});
it('has no Back button on step one and consumes Android Back without leaving setup',async()=>{
 const listener=jest.spyOn(BackHandler,'addEventListener');
 await render(<GenderScreen/>);expect(screen.queryByRole('button',{name:'Back'})).toBeNull();
 const back=listener.mock.calls.find(([event])=>event==='hardwareBackPress')![1];
 expect(back({} as never)).toBe(true);expect(router.replace).not.toHaveBeenCalled();expect(logout).not.toHaveBeenCalled();
 expect(screen.queryByText('Logout?')).toBeNull();listener.mockRestore();
});
it('keeps Back available on step two',async()=>{
 await render(<CompleteProfileScreen/>);await fireEvent.press(screen.getByRole('button',{name:'Back'}));expect(router.dismissTo).toHaveBeenCalledWith('/gender');
});
it('keeps typing free of validation feedback and submits through the provider',async()=>{
 await render(<CompleteProfileScreen/>);expect(screen.getAllByText('MM/DD/YYYY').length).toBeGreaterThan(0);
 await fireEvent.changeText(screen.getByLabelText('Name'),'A');expect(setDraft).toHaveBeenCalledWith({displayName:'A'});expect(screen.queryByRole('alert')).toBeNull();
 await fireEvent.press(screen.getByText('Finish'));expect(finish).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Finish'})).toBeDisabled();
});
it('retains profile controls and shows a form-level save failure after Finish',async()=>{
 jest.mocked(useProfile).mockReturnValue({...useProfile(),profile:{gender:'male'},draft:{...emptyDraft(),displayName:'Alex',birthdateText:'01/01/2000'}} as any);
 finish.mockRejectedValue(new Error('We couldn’t save your profile. Please try again.'));
 await render(<CompleteProfileScreen/>);await fireEvent.press(screen.getByText('Finish'));
 expect(screen.getByRole('alert')).toBeTruthy();expect(screen.getByLabelText('Name')).toBeTruthy();
});

it.each([
 ['valid', '01/01/2000', '', true],
 ['valid', '01/01/2999', '', false],
 ['', '01/01/2000', '', false],
 ['valid', '02/30/2000', '', false],
 ['valid', '01/01/2000', '123', false],
 ['valid', '01/01/2000', '09171234567', true],
])('gates Finish for name %s date %s phone %s',async(name,date,phone,enabled)=>{
 jest.mocked(useProfile).mockReturnValue({...useProfile(),profile:{gender:'male'},draft:{...emptyDraft(),displayName:name,birthdateText:date,mobileText:phone}} as any);
 await render(<CompleteProfileScreen/>);
 expect(screen.getByRole('button',{name:'Finish'}).props.accessibilityState.disabled).toBe(!enabled);
 expect(screen.queryByRole('alert')).toBeNull();
});

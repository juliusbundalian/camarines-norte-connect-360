import {render,screen,fireEvent} from '@testing-library/react-native';
import {GenderScreen} from '../GenderScreen';
import {CompleteProfileScreen} from '../CompleteProfileScreen';
import {useProfile} from '../ProfileProvider';
import {useAuth} from '../../auth/AuthProvider';
import {emptyDraft} from '../profile-types';
jest.mock('../ProfileProvider',()=>({useProfile:jest.fn()}));jest.mock('../../auth/AuthProvider',()=>({useAuth:jest.fn()}));
jest.mock('expo-router',()=>({router:{replace:jest.fn()},useFocusEffect:(fn:any)=>require('react').useEffect(fn,[fn])}));
jest.mock('@react-native-community/datetimepicker',()=>({DateTimePickerAndroid:{open:jest.fn()}}),{virtual:true});
const saveGender=jest.fn(),finish=jest.fn(),setDraft=jest.fn(),logout=jest.fn();
beforeEach(()=>{
 saveGender.mockReset().mockResolvedValue(undefined);finish.mockReset().mockResolvedValue(undefined);logout.mockReset().mockResolvedValue(undefined);
 jest.mocked(useAuth).mockReturnValue({logout,logoutPending:false} as any);
 jest.mocked(useProfile).mockReturnValue({phase:'required',profile:null,draft:emptyDraft(),step:'gender',saveState:'saved',setDraft,saveGender,finish,flushDraft:jest.fn().mockResolvedValue(undefined),applyAvatar:jest.fn().mockResolvedValue(undefined)} as any);
});
it('does not show gender validation until Next is pressed',async()=>{
 await render(<GenderScreen/>);expect(screen.queryByRole('alert')).toBeNull();await fireEvent.press(screen.getByText('Next'));
 expect(screen.getByRole('alert')).toBeTruthy();await fireEvent.press(screen.getByRole('radio',{name:'Female'}));
 await fireEvent.press(screen.getByText('Next'));expect(saveGender).toHaveBeenCalledWith('female');
});
it('requires logout confirmation before leaving gender setup',async()=>{
 await render(<GenderScreen/>);await fireEvent.press(screen.getByRole('button',{name:'Back'}));expect(screen.getByText('Logout?')).toBeTruthy();
 await fireEvent.press(screen.getByText('Cancel'));expect(logout).not.toHaveBeenCalled();
 await fireEvent.press(screen.getByRole('button',{name:'Back'}));await fireEvent.press(screen.getByText('Confirm'));expect(logout).toHaveBeenCalledTimes(1);
});
it('keeps typing free of validation feedback and submits through the provider',async()=>{
 await render(<CompleteProfileScreen/>);expect(screen.getAllByText('MM/DD/YYYY').length).toBeGreaterThan(0);
 await fireEvent.changeText(screen.getByLabelText('Name'),'A');expect(setDraft).toHaveBeenCalledWith({displayName:'A'});expect(screen.queryByRole('alert')).toBeNull();
 await fireEvent.press(screen.getByText('Finish'));expect(finish).toHaveBeenCalledTimes(1);
});
it('retains profile controls and shows a form-level save failure after Finish',async()=>{
 finish.mockRejectedValue(new Error('Please enter a valid birthdate that is not in the future.'));
 await render(<CompleteProfileScreen/>);await fireEvent.press(screen.getByText('Finish'));
 expect(screen.getByRole('alert')).toBeTruthy();expect(screen.getByLabelText('Name')).toBeTruthy();
});

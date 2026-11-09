import {render,screen,fireEvent} from '@testing-library/react-native';
import {Alert} from 'react-native';
import {router} from 'expo-router';
import {AccountScreen} from '../AccountScreen';
import {useProfile} from '../../profile/ProfileProvider';
import {useAuth} from '../../auth/AuthProvider';
jest.mock('../../profile/ProfileProvider',()=>({useProfile:jest.fn()}));
jest.mock('../../auth/AuthProvider',()=>({useAuth:jest.fn()}));
jest.mock('expo-router',()=>({router:{push:jest.fn(),back:jest.fn(),canGoBack:()=>true,dismissTo:jest.fn()},useFocusEffect:(callback:any)=>require('react').useEffect(callback,[callback])}));
jest.mock('../../profile/ProfileAvatar',()=>({ProfileAvatar:()=>null}));
const saved={displayName:'Alex',gender:'other',birthdate:'2000-01-01',mobileNumber:null,avatarId:'avatar-2',revision:1};
function setup(profile:any=saved){
 const saveAccountAvatar=jest.fn(async()=>{});
 jest.mocked(useAuth).mockReturnValue({user:{uid:'a',email:'alex@example.com'},ready:true} as any);
 jest.mocked(useProfile).mockReturnValue({profile,phase:profile?'complete':'legacy',saveAccountAvatar,refreshAccount:jest.fn()} as any);
 return saveAccountAvatar;
}
test('shows persisted personal info and email, with functional edit and Back actions',async()=>{
 setup();await render(<AccountScreen/>);
 expect(screen.getByText('Alex')).toBeTruthy();expect(screen.getByText('Other')).toBeTruthy();
 expect(screen.getByText('January 1, 2000')).toBeTruthy();expect(screen.getByText('alex@example.com')).toBeTruthy();
 expect(screen.queryByText('Change Password')).toBeNull();
 await fireEvent.press(screen.getByLabelText('Edit personal info'));expect(router.push).toHaveBeenCalledWith('/personal-info');
 await fireEvent.press(screen.getByLabelText('Back'));expect(router.back).toHaveBeenCalled();
});
test('missing profiles direct avatar editing to the first complete personal form',async()=>{
 setup(null);await render(<AccountScreen/>);
 expect(screen.getAllByText('Not provided')).toHaveLength(4);
 await fireEvent.press(screen.getByLabelText('Edit avatar'));
 expect(router.push).toHaveBeenCalledWith({pathname:'/personal-info',params:{selectAvatar:'1'}});
});
test('a failed avatar save retains the choice and permits retry',async()=>{
 const save=setup();save.mockRejectedValueOnce(new Error('offline'));jest.spyOn(Alert,'alert').mockImplementation(()=>{});
 await render(<AccountScreen/>);await fireEvent.press(screen.getByLabelText('Edit avatar'));
 await fireEvent.press(screen.getByLabelText('Avatar 6'));await fireEvent.press(screen.getByText('Done'));
 expect(Alert.alert).toHaveBeenCalledWith('Unable to save',expect.stringContaining('offline'));
 expect(screen.getByText('Done')).toBeTruthy();
 await fireEvent.press(screen.getByText('Done'));expect(save).toHaveBeenLastCalledWith('avatar-6');
});

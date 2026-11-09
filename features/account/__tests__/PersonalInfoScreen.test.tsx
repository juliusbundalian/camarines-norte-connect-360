import {render,screen,fireEvent,act} from '@testing-library/react-native';
import {Alert} from 'react-native';
import {router} from 'expo-router';
import {PersonalInfoScreen} from '../PersonalInfoScreen';
import {useProfile} from '../../profile/ProfileProvider';
import {ProfileConflictError} from '../../../services/firebase/account-profile-types';
jest.mock('../../profile/ProfileProvider',()=>({useProfile:jest.fn()}));
jest.mock('../../profile/ProfileAvatar',()=>({ProfileAvatar:()=>null}));
jest.mock('@react-native-community/datetimepicker',()=>({DateTimePickerAndroid:{open:jest.fn()}}));
jest.mock('expo-router',()=>({router:{dismissTo:jest.fn()},useLocalSearchParams:()=>({}),useFocusEffect:(callback:any)=>require('react').useEffect(callback,[callback])}));
const original={displayName:'Original',gender:'male',birthdate:'2000-01-01',mobileNumber:null,avatarId:'avatar-1',revision:3};
function setup(){
 const savePersonalInfo=jest.fn(async()=>{});
 jest.mocked(useProfile).mockReturnValue({profile:original,savePersonalInfo} as any);
 jest.spyOn(Alert,'alert').mockImplementation(()=>{});
 return savePersonalInfo;
}
test('requires valid changed values and shows Changes Saved only after acknowledgement',async()=>{
 const save=setup();await render(<PersonalInfoScreen/>);
 expect(screen.getByRole('button',{name:'Save'})).toBeDisabled();
 await fireEvent.changeText(screen.getByLabelText('Name'),'');expect(screen.getByRole('button',{name:'Save'})).toBeDisabled();
 expect(Alert.alert).not.toHaveBeenCalled();
 await fireEvent.changeText(screen.getByLabelText('Name'),'Updated');
 expect(screen.getByRole('button',{name:'Save'})).toBeEnabled();
 await fireEvent.press(screen.getByRole('button',{name:'Save'}));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({displayName:'Updated',mobileNumber:null}),3);
 expect(screen.getByText('Changes Saved')).toBeTruthy();
 await fireEvent.press(screen.getByText('Confirm'));expect(router.dismissTo).toHaveBeenCalledWith('/account');
});
test('prompts before discarding edited values, and an offline save retains them',async()=>{
 const save=setup();save.mockRejectedValueOnce(new Error('offline'));
 await render(<PersonalInfoScreen/>);await fireEvent.changeText(screen.getByLabelText('Name'),'Local draft');
 await fireEvent.press(screen.getByLabelText('Back'));
 expect(Alert.alert).toHaveBeenCalledWith('Discard changes?',expect.any(String),expect.arrayContaining([expect.objectContaining({text:'Stay'}),expect.objectContaining({text:'Discard'})]));
 await fireEvent.press(screen.getByRole('button',{name:'Save'}));
 expect(screen.getByDisplayValue('Local draft')).toBeTruthy();expect(screen.queryByText('Changes Saved')).toBeNull();
 await fireEvent.press(screen.getByRole('button',{name:'Save'}));expect(screen.getByText('Changes Saved')).toBeTruthy();
});
test('a conflicting revision keeps local input and uses the refreshed revision on retry',async()=>{
 const save=setup();save.mockRejectedValueOnce(new ProfileConflictError({...original,displayName:'Remote',revision:8} as any));
 await render(<PersonalInfoScreen/>);await fireEvent.changeText(screen.getByLabelText('Name'),'Local');
 await fireEvent.press(screen.getByRole('button',{name:'Save'}));expect(screen.getByDisplayValue('Local')).toBeTruthy();
 await fireEvent.press(screen.getByRole('button',{name:'Save'}));expect(save).toHaveBeenLastCalledWith(expect.objectContaining({displayName:'Local'}),8);
});

test('gender/date controls and optional mobile keep invalid input behind the Save gate',async()=>{
 setup();const {DateTimePickerAndroid}=require('@react-native-community/datetimepicker');
 await render(<PersonalInfoScreen/>);
 await fireEvent.press(screen.getByLabelText('Gender'));await fireEvent.press(screen.getByRole('radio',{name:'Female'}));
 await fireEvent.press(screen.getByLabelText('Birthdate'));
 const options=DateTimePickerAndroid.open.mock.calls.at(-1)[0];
 await act(()=>options.onDismiss());expect(screen.getByText('January 1, 2000')).toBeTruthy();
 await act(()=>options.onValueChange({type:'set'},new Date(2999,0,1)));
 expect(screen.getByRole('button',{name:'Save'})).toBeDisabled();
 await act(()=>options.onValueChange({type:'set'},new Date(2000,1,29)));
 await fireEvent.changeText(screen.getByLabelText('Mobile Number (optional)'),'123');expect(screen.getByRole('button',{name:'Save'})).toBeDisabled();
 await fireEvent.changeText(screen.getByLabelText('Mobile Number (optional)'),'');expect(screen.getByRole('button',{name:'Save'})).toBeEnabled();
 expect(Alert.alert).not.toHaveBeenCalled();
});
test('rapid Save and pending Back cannot submit or discard twice',async()=>{
 const save=setup();let finish!:()=>void;save.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=resolve;}));
 await render(<PersonalInfoScreen/>);await fireEvent.changeText(screen.getByLabelText('Name'),'Updated');
 await fireEvent.press(screen.getByRole('button',{name:'Save'}));await fireEvent.press(screen.getByRole('button',{name:'Save'}));
 await fireEvent.press(screen.getByLabelText('Back'));
 expect(save).toHaveBeenCalledTimes(1);expect(Alert.alert).not.toHaveBeenCalled();
 await act(()=>finish());expect(screen.getByText('Changes Saved')).toBeTruthy();
});

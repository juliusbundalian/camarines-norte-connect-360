import {render,screen,fireEvent,act} from '@testing-library/react-native';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import {BirthdateField} from '../BirthdateField';
jest.mock('@react-native-community/datetimepicker',()=>({DateTimePickerAndroid:{open:jest.fn()}}),{virtual:true});
it('does not assign the neutral date on open or cancel, and stores confirmed local calendar components',async()=>{
 const onChange=jest.fn();await render(<BirthdateField value="" onChange={onChange}/>);
 await fireEvent.press(screen.getByRole('button',{name:'Birthdate'}));
 const options=jest.mocked(DateTimePickerAndroid.open).mock.calls.at(-1)![0];expect(onChange).not.toHaveBeenCalled();
 await act(()=>options.onDismiss!());expect(onChange).not.toHaveBeenCalled();
 await act(()=>options.onValueChange!({type:'set'} as any,new Date(2008,7,23)));expect(onChange).toHaveBeenCalledWith('08/23/2008');
});
it('does not reinterpret a saved year below100 as a twentieth-century date',async()=>{
 await render(<BirthdateField value="01/01/0001" onChange={jest.fn()}/>);await fireEvent.press(screen.getByRole('button',{name:'Birthdate'}));
 expect(jest.mocked(DateTimePickerAndroid.open).mock.calls.at(-1)![0].value.getFullYear()).toBe(1);
});
